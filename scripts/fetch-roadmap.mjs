/**
 * Fetches the public roadmap from the CoachRx Feature Hub in Notion.
 *
 * WHY BUILD TIME AND NOT RUNTIME
 * The site is fully static on OpenNext. Fetching here means no Notion token in the Worker,
 * no rate limits on visitor traffic, no API round trip per view, and — the important one —
 * Notion going down cannot take the page down.
 *
 * FAILS SOFT, ON PURPOSE
 * If NOTION_TOKEN is missing or Notion errors, this keeps the committed src/data/roadmap.json
 * and exits 0. A Notion outage must never block a deploy of the whole site for the sake of
 * one page. The committed file is therefore the floor, not a placeholder — keep it real.
 *
 * WHAT COUNTS AS PUBLIC
 * Mirrors the "Public Roadmap" view in Notion exactly:
 *     Public Roadmap is true   OR   Recently Shipped is true
 * The gate lives in Notion so Carl controls it without a deploy. Do not add filtering here.
 *
 * Freshness comes from a Cloudflare Deploy Hook on a daily schedule, not from this script.
 */
import fs from "node:fs";
import path from "node:path";

// Notion exposes the SAME table under two different ids, and they are not interchangeable:
//   DATABASE_ID    used by /v1/databases/{id}/query        (Notion-Version 2022-06-28)
//   DATA_SOURCE_ID used by /v1/data_sources/{id}/query     (Notion-Version 2025-09-03+)
// The original code sent the DATA SOURCE id to the data_sources endpoint while declaring
// version 2022-06-28, and Notion answered 400 invalid_request_url — new endpoint, old version.
// Both are kept so the request can be retried the other way round without another round trip.
const DATABASE_ID = "28e0519a-8d52-8069-bd0e-eb9494be7244";
const DATA_SOURCE_ID = "28e0519a-8d52-80c7-8e76-000b492d024d";
const OUT = path.join(process.cwd(), "src", "data", "roadmap.json");
const TOKEN = process.env.NOTION_TOKEN;

/** Public column labels. "Backlog" is internal language and reads as a junk drawer. */
const PUBLIC_STATUS = {
  "In Progress": "Building now",
  "Up Next": "Up next",
  Backlog: "Exploring",
  Shipped: "Shipped",
};

const keep = (s) => Object.prototype.hasOwnProperty.call(PUBLIC_STATUS, s);

function bail(reason) {
  const exists = fs.existsSync(OUT);
  console.log(`  roadmap: ${reason}`);
  console.log(
    exists
      ? `  roadmap: using committed ${path.relative(process.cwd(), OUT)} (build continues)`
      : `  roadmap: WARNING no committed file to fall back on, the page will be empty`
  );
  process.exit(0);
}

/* --------------------------------------------------------------- notion helpers */

const plain = (rich) => (Array.isArray(rich) ? rich.map((r) => r.plain_text).join("") : "");

/** Notion returns formula results even though SQL mode cannot query them. */
const formulaTrue = (p) => {
  const f = p?.formula;
  if (!f) return false;
  if (f.type === "boolean") return f.boolean === true;
  if (f.type === "string") return String(f.string).toLowerCase() === "true";
  return false;
};

function toRow(page) {
  const p = page.properties || {};
  const status = p.Status?.select?.name || "";
  return {
    id: page.id,
    feature: plain(p.Feature?.title),
    summary: plain(p.Summary?.rich_text),
    status,
    label: PUBLIC_STATUS[status] || status,
    pillar: p.Pillar?.select?.name || "",
    platform: (p.Platform?.multi_select || []).map((o) => o.name),
    released: p["Release Date"]?.date?.start || null,
    updated: p["Last Updated"]?.date?.start || null,
    // Shipped rows arrive via the formula rather than the checkbox, by design.
    viaFlag: p["Public Roadmap"]?.checkbox === true,
    viaShipped: formulaTrue(p["Recently Shipped"]),
  };
}

/**
 * Mirrors the "Public Roadmap" view in Notion exactly, read from the view's own config:
 *   Public Roadmap checkbox is true   OR   Recently Shipped formula is the STRING "true"
 *
 * Recently Shipped is a formula returning text, not a checkbox. The original filter used
 * formula:{checkbox:...}, which does not match a string formula, so even once the URL was right
 * the shipped rows would have been dropped.
 */
const FILTER = {
  or: [
    { property: "Public Roadmap", checkbox: { equals: true } },
    { property: "Recently Shipped", formula: { string: { equals: "true" } } },
  ],
};

/** One page of results from whichever API shape works. */
async function queryPage(mode, cursor) {
  const url = mode === "classic"
    ? `https://api.notion.com/v1/databases/${DATABASE_ID}/query`
    : `https://api.notion.com/v1/data_sources/${DATA_SOURCE_ID}/query`;
  const version = mode === "classic" ? "2022-06-28" : "2025-09-03";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Notion-Version": version,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100, start_cursor: cursor, filter: FILTER }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const err = new Error(`Notion ${res.status} ${body}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function queryAll() {
  // Try the long-stable classic shape first. If this workspace has moved to data sources and
  // rejects it, retry the modern shape rather than failing and costing another build.
  for (const mode of ["classic", "datasource"]) {
    try {
      const rows = [];
      let cursor;
      do {
        const json = await queryPage(mode, cursor);
        rows.push(...(json.results || []));
        cursor = json.has_more ? json.next_cursor : undefined;
      } while (cursor);
      if (mode !== "classic") console.log("  roadmap: used the data_sources API");
      return rows;
    } catch (err) {
      const retryable = err.status === 400 || err.status === 404;
      if (mode === "classic" && retryable) {
        console.log(`  roadmap: classic API said ${err.status}, retrying the data_sources API`);
        continue;
      }
      throw err;
    }
  }
}

/* ------------------------------------------------------------------------- main */

if (!TOKEN) bail("NOTION_TOKEN not set");

let raw;
try {
  raw = await queryAll();
} catch (err) {
  // FAIL LOUDLY when a token IS present. Falling back silently made sense while there was no
  // token: a Notion outage should not block a deploy of the whole site for one page. But once a
  // token is configured, a failure means something is genuinely wrong, and a silent fallback is
  // indistinguishable from success — Carl set the token, deployed, and the roadmap did not
  // change, with nothing on the page or in the summary to say why.
  console.error(`\nfetch-roadmap: Notion request FAILED and a token is configured.\n`);
  console.error(`  ${err.message}\n`);
  if (/\b404\b/.test(err.message)) {
    console.error("  404 means the token is valid but the integration cannot see the database.");
    console.error("  This is the usual cause and it is not the token.");
    console.error("  Fix: open the CoachRx Feature Hub in Notion, the ... menu at the top right,");
    console.error("       Connections, then add your integration. Notion integrations see nothing");
    console.error("       until a database is explicitly shared with them.\n");
  } else if (/\b401\b/.test(err.message)) {
    console.error("  401 means the token itself was rejected: wrong value, or the integration");
    console.error("  was deleted. Recreate it and update NOTION_TOKEN in the Cloudflare Build");
    console.error("  variables.\n");
  } else if (/\b429\b/.test(err.message)) {
    console.error("  429 is Notion rate limiting. Re-run the build; nothing is misconfigured.\n");
  }
  console.error("  Stopping the build on purpose. A silent fallback here looks exactly like a");
  console.error("  successful deploy, which is how this went unnoticed for two days.\n");
  process.exit(1);
}

const rows = raw.map(toRow).filter((r) => r.feature && keep(r.status));

// A feature with no summary would render as a bare heading, which looks broken. Skip it
// rather than shipping an empty card, and say which so it can be fixed in Notion.
const noSummary = rows.filter((r) => !r.summary);
if (noSummary.length) {
  console.log(`  roadmap: skipping ${noSummary.length} row(s) with no Summary: ` +
    noSummary.map((r) => r.feature).join(", "));
}

const usable = rows.filter((r) => r.summary);
if (!usable.length) {
  // Almost always means the integration was created but never connected to the database.
  console.error("\nfetch-roadmap: Notion answered, but 0 rows are publishable.\n");
  console.error("  The query worked, so auth and the database connection are both fine.");
  console.error("  Nothing in the Feature Hub currently has Public Roadmap ticked, or a");
  console.error("  Release Date recent enough for Recently Shipped.\n");
  console.error("  Tick Public Roadmap on the rows you want public, then rebuild.\n");
  process.exit(1);
}

const upcoming = usable.filter((r) => r.status !== "Shipped");
const shipped = usable
  .filter((r) => r.status === "Shipped")
  .sort((a, b) => String(b.released).localeCompare(String(a.released)))
  .slice(0, 8);

const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  columns: ["In Progress", "Up Next", "Backlog"].map((s) => ({
    status: s,
    label: PUBLIC_STATUS[s],
    items: upcoming.filter((r) => r.status === s),
  })),
  shipped,
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));

const counts = out.columns.map((c) => `${c.label} ${c.items.length}`).join(", ");
console.log(`  roadmap: ${usable.length} rows from Notion (${counts}, shipped ${shipped.length})`);

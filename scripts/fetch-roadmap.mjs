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

const DATA_SOURCE = "28e0519a-8d52-80c7-8e76-000b492d024d"; // CoachRx Feature Hub - Database
const OUT = path.join(process.cwd(), "src", "data", "roadmap.json");
const TOKEN = process.env.NOTION_TOKEN;
const NOTION_VERSION = "2022-06-28";

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

async function queryAll() {
  const rows = [];
  let cursor;
  do {
    const res = await fetch(`https://api.notion.com/v1/data_sources/${DATA_SOURCE}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: 100,
        start_cursor: cursor,
        filter: {
          or: [
            { property: "Public Roadmap", checkbox: { equals: true } },
            { property: "Recently Shipped", formula: { checkbox: { equals: true } } },
          ],
        },
      }),
    });
    if (!res.ok) throw new Error(`Notion ${res.status} ${await res.text().catch(() => "")}`);
    const json = await res.json();
    rows.push(...(json.results || []));
    cursor = json.has_more ? json.next_cursor : undefined;
  } while (cursor);
  return rows;
}

/* ------------------------------------------------------------------------- main */

if (!TOKEN) bail("NOTION_TOKEN not set");

let raw;
try {
  raw = await queryAll();
} catch (err) {
  bail(`Notion fetch failed: ${err.message}`);
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
  bail("Notion returned 0 usable rows — check the connection is attached to the Feature Hub");
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

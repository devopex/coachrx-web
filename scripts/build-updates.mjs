/**
 * Compiles "CoachRx Updates.dc.html" into THREE pages.
 *
 * The design file carries one section per route — Route /roadmap, Route /changelog and
 * Route /feature-requests — so all three tab states preview together in Claude Design. The
 * compiler has no concept of that: left alone it emits every section into one page, so /roadmap
 * would render all three tabs stacked on top of each other.
 *
 * This compiles the file once, then splits the result by `data-screen-label="Route /x"` and writes
 * one module per route. Live roadmap rows are injected the same way build-roadmap.mjs does it.
 *
 * Outputs src/generated/updates-roadmap.ts, updates-changelog.ts, updates-requests.ts
 */
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import { compileDesign } from "./dc-compile.mjs";

const ROOT = process.cwd();
const DROOT = path.join(ROOT, "design");
const GEN = path.join(ROOT, "src", "generated");

const findDesign = (f) => {
  const d = path.join(DROOT, f);
  if (fs.existsSync(d)) return d;
  for (const e of fs.readdirSync(DROOT, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const n = path.join(DROOT, e.name, f);
    if (fs.existsSync(n)) return n;
  }
  return d;
};

const SRC = findDesign("CoachRx Updates.dc.html");
if (!fs.existsSync(SRC)) {
  console.log("\nbuild-updates:\n  skip (design/CoachRx Updates.dc.html not built yet)");
  process.exit(0);
}

const ROUTES = [
  { label: "Route /roadmap", name: "updates-roadmap", route: "/roadmap", h1: "Roadmap" },
  { label: "Route /changelog", name: "updates-changelog", route: "/changelog", h1: "Changelog" },
  { label: "Route /feature-requests", name: "updates-requests", route: "/feature-requests", h1: "Feature requests" },
];

// Live roadmap rows, if fetch-roadmap has run. Falls back to the design's sample data.
const DATA = path.join(ROOT, "src", "data", "roadmap.json");
let override;
if (fs.existsSync(DATA)) {
  const d = JSON.parse(fs.readFileSync(DATA, "utf8"));
  const rows = (d.items || d.rows || []).filter((r) => r.publicRoadmap !== false);
  const pick = (status) =>
    rows
      .filter((r) => (r.status || "").toLowerCase().includes(status))
      .map((r) => ({ feature: r.feature || r.name, pillar: r.pillar || "", summary: r.summary || "" }));
  const building = pick("building");
  const upnext = pick("up next");
  if (building.length || upnext.length) {
    override = {
      building,
      upnext,
      buildingCount: building.length,
      upnextCount: upnext.length,
      updated: new Date()
        .toLocaleDateString("en-US", { month: "short", year: "numeric" })
        .toUpperCase(),
    };
  }
}

// Live releases for the Changelog tab. Repointing /changelog at this split output dropped the
// real data (2026-08-30): every "Read" link pointed at /changelog itself and the rows showed the
// design's invented v5.x version numbers. Inject the real ones.
const CHANGELOG = path.join(ROOT, "src", "data", "changelog.json");
if (fs.existsSync(CHANGELOG)) {
  const raw = JSON.parse(fs.readFileSync(CHANGELOG, "utf8"));
  const all = (Array.isArray(raw) ? raw : raw.releases || raw.items || []).filter((r) => !r.draft);
  const releases = all.slice(0, 8).map((r) => ({
    date: r.date
      ? new Date(r.date).toLocaleDateString("en-US", { month: "short", year: "numeric" }).toUpperCase()
      : "",
    summary: (r.description || "").replace(/\s+/g, " ").trim().replace(/[,\s]+$/, "").slice(0, 150),
    href: `/changelog/${r.slug}`,
  }));
  override = { ...(override || {}), releases };
  console.log(`\nbuild-updates: injected ${releases.length} live releases (of ${all.length})`);
}

const out = compileDesign(SRC, override);
const $ = cheerio.load(out.html, null, false);

const all = $("section").filter((_, e) => /^Route \//.test($(e).attr("data-screen-label") || ""));
if (all.length !== ROUTES.length) {
  console.error(
    `build-updates: expected ${ROUTES.length} route sections, found ${all.length}.\n` +
      `  The design file must carry one <section data-screen-label="Route /x"> per tab.\n` +
      `  Found: ${all.map((_, e) => $(e).attr("data-screen-label")).get().join(", ") || "none"}`,
  );
  process.exit(1);
}

fs.mkdirSync(GEN, { recursive: true });
console.log("\nbuild-updates:");

for (const r of ROUTES) {
  const $$ = cheerio.load(out.html, null, false);
  // keep this route's section, drop the other two, and strip the preview label bars
  $$("section").each((_, e) => {
    const label = $$(e).attr("data-screen-label") || "";
    if (/^Route \//.test(label) && label !== r.label) $$(e).remove();
  });
  $$("[class*='crx-route']").remove();
  $$("*")
    .filter((_, e) => /^Build preview · direct route/.test(($$(e).text() || "").trim()))
    .remove();

  // All three routes shipped <h1>Product updates</h1>. That is what a screen reader announces and
  // what Google weights, so each route gets its own. "Product updates" survives as the eyebrow.
  const $h1 = $$("h1").first();
  if ($h1.length && r.h1) {
    $h1.before(
      `<span style="display:block;font-family:var(--font-mono);font-size:11px;font-weight:600;` +
        `letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.45);margin-bottom:14px">` +
        `${$h1.text().trim()}</span>`,
    );
    $h1.text(r.h1);
  }

  const html = ($$.root().html() || "").trim();
  fs.writeFileSync(
    path.join(GEN, `${r.name}.ts`),
    `// GENERATED by scripts/build-updates.mjs from "CoachRx Updates.dc.html" (${r.route}).\n` +
      `// Do not edit by hand.\n` +
      `export const html = ${JSON.stringify(html)};\n` +
      `export const css = ${JSON.stringify(out.css)};\n` +
      `export const script = ${JSON.stringify(out.script)};\n`,
  );
  console.log(`  ok   ${r.name.padEnd(20)} ${String(Math.round(html.length / 1024)).padStart(4)}KB  ${r.route}`);
}

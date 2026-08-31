/**
 * Fails the build if the footer drifts between pages, or if the oversized wordmark comes back.
 *
 * WHY THIS IS A SEPARATE SCRIPT
 * dc-compile sees one page at a time, so it structurally cannot notice that page A's footer and
 * page B's footer disagree. The blog index, the ten topic pages, the changelog and the three
 * Updates routes are also built by other scripts entirely. This runs last, over every compiled
 * page, which is the only place the whole picture exists.
 *
 * WHAT IT CHECKS
 *   1. No page ships [data-fmark]. Carl removed the big cropped CoachRx wordmark on 2026-08-31
 *      and wanted it gone on every page, permanently.
 *   2. Every page's footer link set and column headings are identical.
 *
 * WHAT IT DELIBERATELY ALLOWS
 * The home page footer carries an extra "START FOR FREE" CTA that no other page has. That is a
 * deliberate homepage conversion element, not drift, so the comparison is on the footer's link
 * set and headings rather than on raw markup. Whitespace is normalized before comparing, because
 * the design files differ cosmetically there and it means nothing.
 */
import fs from "node:fs";
import path from "node:path";

const GEN = path.join(process.cwd(), "src", "generated");
const files = fs.readdirSync(GEN).filter(f => f.endsWith(".ts") && !/manifest|topic-pages/.test(f));

function footerOf(src) {
  const i = src.indexOf("export const html");
  const j = src.indexOf("export const script");
  const html = src.slice(i, j > i ? j : src.length);
  const m = html.match(/<footer[\s\S]*?<\/footer>/);
  return m ? m[0] : null;
}

/** The footer's identity: the links it offers and the labels it shows, order preserved. */
function signature(footer) {
  const links = [...footer.matchAll(/href=\\?"([^"\\]+)\\?"/g)].map(m => m[1]);
  const labels = [...footer.matchAll(/>([^<>]{2,60})</g)]
    .map(m => m[1].replace(/\\n/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .filter(t => t !== "START FOR FREE");        // homepage-only CTA, allowed
  return JSON.stringify({ links: links.filter(l => l !== "https://dashboard.coachrx.app/signup"), labels });
}

const wordmark = [];
const sigs = new Map();
let checked = 0;

for (const f of files) {
  const src = fs.readFileSync(path.join(GEN, f), "utf8");
  if (/data-fmark/.test(src)) wordmark.push(f);
  const footer = footerOf(src);
  if (!footer) continue;
  checked++;
  const sig = signature(footer);
  if (!sigs.has(sig)) sigs.set(sig, []);
  sigs.get(sig).push(f);
}

let failed = false;

if (wordmark.length) {
  console.error(`\ncheck-footer: the oversized wordmark [data-fmark] is back on ${wordmark.length} page(s):`);
  for (const f of wordmark) console.error(`  ${f}`);
  console.error(`  Carl removed it on 2026-08-31 and it must not return on any page.`);
  console.error(`  stripFooterWordmark() in dc-compile.mjs should have removed it. Check that it still runs.\n`);
  failed = true;
}

if (sigs.size > 1) {
  const groups = [...sigs.entries()].sort((a, b) => b[1].length - a[1].length);
  console.error(`\ncheck-footer: the footer is not consistent. ${sigs.size} different footers across ${checked} pages.`);
  const [, majority] = groups[0];
  console.error(`  ${majority.length} pages agree. The odd ones out:`);
  for (const [sig, list] of groups.slice(1)) {
    console.error(`\n  ${list.join(", ")}`);
    const a = JSON.parse(groups[0][0]), b = JSON.parse(sig);
    const extraL = b.labels.filter(x => !a.labels.includes(x));
    const missL  = a.labels.filter(x => !b.labels.includes(x));
    const extraH = b.links.filter(x => !a.links.includes(x));
    const missH  = a.links.filter(x => !b.links.includes(x));
    if (extraL.length) console.error(`      extra labels : ${extraL.join(" | ")}`);
    if (missL.length)  console.error(`      missing labels: ${missL.join(" | ")}`);
    if (extraH.length) console.error(`      extra links  : ${extraH.join(" | ")}`);
    if (missH.length)  console.error(`      missing links : ${missH.join(" | ")}`);
  }
  console.error(`\n  The footer is compiler-owned chrome. Fix ensureFooter/FOOTER_COLUMNS in dc-compile.mjs,`);
  console.error(`  not the individual design files.\n`);
  failed = true;
}

if (failed) process.exit(1);
console.error(`\ncheck-footer: ${checked} pages, one identical footer, no oversized wordmark.`);

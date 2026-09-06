/**
 * Guards the five product pillars across every compiled page.
 *
 * WHY THIS EXISTS
 * The pillars appear in six design files, in the compiler's FOOTER_COLUMNS, and on the Features
 * page they are additionally wired into JavaScript in three places: the onClick handler names, the
 * strings passed to goTo() in renderVals(), and a hardcoded id array in setupStickyNav(). Rename a
 * pillar and miss any one of those and the sticky nav silently scrolls nowhere or highlights the
 * wrong section. Nothing throws, so no existing gate notices.
 *
 * On 2026-09-01 Consult became Communicate and Design became Program. This gate makes a partial
 * rename impossible to ship.
 *
 * WHAT IT CHECKS
 *   1. No page shows a retired pillar name as a standalone label.
 *   2. Every footer pillar link points at an anchor the Features page actually defines.
 *   3. The Features page still defines all five section ids.
 *
 * WHAT IT ALLOWS
 * Ordinary words that merely contain a pillar name: "Program calendar", "Programs", "program
 * design", "Consultations", "design" meaning visual design. Only standalone element text is
 * treated as a pillar label, which is how the labels are actually authored.
 */
import fs from "node:fs";
import path from "node:path";

const GEN = path.join(process.cwd(), "src", "generated");
const files = fs.readdirSync(GEN).filter(f => f.endsWith(".ts") && !/manifest|topic-pages/.test(f));

const RETIRED = ["Consult", "Design"];
const CURRENT = ["assess", "communicate", "program", "operate", "client-experience"];

function htmlOf(src) {
  const i = src.indexOf("export const html");
  const j = src.indexOf("export const css");
  return src.slice(i, j > i ? j : src.length);
}

let failed = false;

// 1. retired pillar labels anywhere in rendered html
const stale = [];
for (const f of files) {
  const html = htmlOf(fs.readFileSync(path.join(GEN, f), "utf8"));
  for (const name of RETIRED) {
    // standalone element text only: >Consult<  or  >Consult</span>
    const re = new RegExp(`>\\s*${name}\\s*<`, "g");
    const n = (html.match(re) || []).length;
    if (n) stale.push({ file: f, name, n });
  }
}
if (stale.length) {
  console.error(`\ncheck-pillars: retired pillar name still rendering on ${stale.length} page/label pair(s):`);
  for (const s of stale) console.error(`  ${s.file}: "${s.name}" x${s.n}`);
  console.error(`  Consult is now Communicate. Design is now Program (renamed 2026-09-01).`);
  console.error(`  Fix the design file, or FOOTER_COLUMNS if it is the footer.\n`);
  failed = true;
}

/**
 * 1b. The pillar list, written out as a sentence, with retired names in it.
 *
 * Rule 1 above only looks at standalone element text (`>Consult<`), which is right for labels and
 * is what stops "Program calendar" and "design" from failing. It cannot see the list written as
 * prose, and two of those shipped to staging on 2026-09-06:
 *
 *   /404 body copy:  "Assess, consult, design, operate, and the client app, in one place."
 *   /features <meta description> and og:description:
 *                    "Assess, consult, design, operate, and deliver."
 *
 * The meta description is what Google shows in results and what every social share renders, and no
 * gate looked at it at all, because it lives in src/app/features/page.tsx rather than in any
 * compiled page.
 *
 * The signature is unambiguous and does not fire on ordinary prose: "assess" followed by "consult"
 * or "design" followed by "operate", all within about 60 characters. That is the pillar list and
 * nothing else.
 */
const SEQ = /assess[^.]{0,30}\b(consult|design)\b[^.]{0,30}\boperate\b/i;
const PROSE_SOURCES = [];
for (const f of files) {
  PROSE_SOURCES.push([`generated/${f}`, htmlOf(fs.readFileSync(path.join(GEN, f), "utf8"))]);
}
for (const dir of ["src/app", "src/data"]) {
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(tsx?|json)$/.test(e.name)) PROSE_SOURCES.push([p, fs.readFileSync(p, "utf8")]);
    }
  };
  walk(path.join(process.cwd(), dir));
}
const seqHits = [];
for (const [name, src] of PROSE_SOURCES) {
  const m = src.match(SEQ);
  if (m) seqHits.push({ name, text: m[0].replace(/\s+/g, " ").slice(0, 90) });
}
if (seqHits.length) {
  console.error(`\ncheck-pillars: the five pillars listed in prose using a retired name:`);
  for (const h of seqHits) console.error(`  ${h.name}\n     "...${h.text}..."`);
  console.error(`  Consult is now Communicate. Design is now Program (renamed 2026-09-01).`);
  console.error(`  This covers <meta> descriptions too, which are what search results and social`);
  console.error(`  shares display and which no other gate reads.\n`);
  failed = true;
}

// 2 and 3. the Features page must define every anchor the footers point at
const featPath = path.join(GEN, "features.ts");
if (fs.existsSync(featPath)) {
  const feat = htmlOf(fs.readFileSync(featPath, "utf8"));
  const missing = CURRENT.filter(id => !new RegExp(`id=\\\\?"${id}\\\\?"`).test(feat));
  if (missing.length) {
    console.error(`\ncheck-pillars: the Features page is missing section id(s): ${missing.join(", ")}`);
    console.error(`  Footer pillar links point at these anchors on all 24 pages. Without them the`);
    console.error(`  links land on /features and do not scroll.\n`);
    failed = true;
  }

  const dead = new Set();
  for (const f of files) {
    const html = htmlOf(fs.readFileSync(path.join(GEN, f), "utf8"));
    for (const m of html.matchAll(/\/features#([a-z-]+)/g)) {
      if (!CURRENT.includes(m[1])) dead.add(`${m[1]} (in ${f})`);
    }
  }
  if (dead.size) {
    console.error(`\ncheck-pillars: link(s) to a pillar anchor that is not one of the five:`);
    for (const d of dead) console.error(`  /features#${d}`);
    console.error(`\n`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.error(`\ncheck-pillars: ${files.length} pages, five pillars consistent, every anchor resolves.`);

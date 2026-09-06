/**
 * A coach's words must read the same on every page, and must never carry a claim they did not make.
 *
 * WHY THIS EXISTS
 * Two separate failures, both found on 2026-09-06 in the Features page, both invisible to every
 * other gate because each page passed on its own:
 *
 *   1. QUOTE DRIFT. Brandon Wilton's testimonial ends "...due to the ability to have conversations
 *      with each client and tweak their program design" on one page and "...retention." on another.
 *      Sam Smith's says "gave us the ability to develop a seamless way" on one and "gave us a
 *      seamless way" on another. At most one of each pair is what the coach said.
 *
 *   2. INSERTED CLAIMS. Kyle Krancher's quote on Features reads "it's cut down on my expenses AS
 *      THE SUBSCRIPTION IS MORE AFFORDABLE THAN TRUECOACH". That clause is not in the Home version.
 *      It is a competitor price claim, put in a coach's mouth, sitting in the Operate section,
 *      outside the one comparison section Carl approved on 2026-08-30.
 *
 * The existing checkTestimonial() guards one known-fabricated string. This guards the general case:
 * it collects every quote attributed to each coach across every compiled page and fails if a coach
 * has more than one version, or if any version names a competitor.
 *
 * HOW TO FIX A FAILURE
 * Do not pick whichever version reads better. Find what the coach actually said, put that string
 * everywhere, and fix it in the design file so the next export does not undo it.
 */
import fs from "node:fs";
import path from "node:path";

const GEN = path.join(process.cwd(), "src", "generated");

/** Coaches whose words appear on more than one page. */
const COACHES = [
  "Kyle Krancher",
  "Brandon Wilton",
  "Sam Smith",
  "Austin Schoen",
  "Brandon Gallagher",
];

/** A competitor named inside a quote is a claim we put in someone else's mouth. */
const RIVALS = /\b(TrueCoach|TrainHeroic|Trainerize|Everfit|Bridge Athletic)\b/i;

const unesc = (s) => {
  try { return JSON.parse('"' + s + '"'); } catch { return ""; }
};

function pagesText() {
  const out = [];
  for (const f of fs.readdirSync(GEN)) {
    if (!f.endsWith(".ts") || /manifest|pages/.test(f)) continue;
    const src = fs.readFileSync(path.join(GEN, f), "utf8");
    const m = src.match(/export const html = "((?:[^"\\]|\\.)*)"/s);
    if (m) out.push([f, unesc(m[1])]);
  }
  return out;
}

/**
 * Quotes are marked up in several shapes across the site, so match on the quote characters
 * rather than on any one wrapper, then keep only strings long enough to be a testimonial.
 */
/**
 * Attribution always FOLLOWS the quote in every layout on this site, so take only the last quote
 * that closes shortly before the coach's name. A wider window picks up the neighbouring
 * testimonial in a carousel and reports drift that is not there.
 */
const ATTRIBUTION_GAP = 320;

function quotesNear(html, name) {
  const found = new Set();
  let i = -1;
  while ((i = html.indexOf(name, i + 1)) !== -1) {
    const window = html.slice(Math.max(0, i - 1800), i);
    let last = null;
    for (const m of window.matchAll(/["“”]([^"“”<>]{70,700})["“”]/g)) {
      const endsAt = m.index + m[0].length;
      if (window.length - endsAt > ATTRIBUTION_GAP) continue; // too far back to be this person's
      const q = m[1].replace(/\s+/g, " ").trim();
      if (/[a-z]/.test(q) && / /.test(q) && !/[:;{}]/.test(q)) last = q;
    }
    if (last) found.add(last);
  }
  const arr = [...found].sort((a, b) => b.length - a.length);
  return arr.filter((q, idx) => !arr.slice(0, idx).some((longer) => longer.includes(q)));
}

const pages = pagesText();
let failed = false;

for (const coach of COACHES) {
  const byQuote = new Map();
  for (const [file, html] of pages) {
    for (const q of quotesNear(html, coach)) {
      if (!byQuote.has(q)) byQuote.set(q, new Set());
      byQuote.get(q).add(file);
    }
  }
  if (!byQuote.size) continue;

  if (byQuote.size > 1) {
    failed = true;
    console.error(`\ncheck-quotes: ${coach} has ${byQuote.size} different versions of their quote:`);
    for (const [q, files] of byQuote) {
      console.error(`  [${[...files].join(", ")}]`);
      console.error(`     "${q.slice(0, 160)}${q.length > 160 ? "..." : ""}"`);
    }
  }

  for (const [q, files] of byQuote) {
    const rival = q.match(RIVALS);
    if (rival) {
      failed = true;
      console.error(`\ncheck-quotes: ${coach}'s quote names a competitor, in ${[...files].join(", ")}:`);
      console.error(`     "...${q.slice(Math.max(0, q.search(RIVALS) - 60), q.search(RIVALS) + 40)}..."`);
      console.error(`  A rival's name inside a testimonial is a claim we wrote, not one they made.`);
    }
  }
}

if (failed) {
  console.error(`\n  Coach quotes ship verbatim and identically on every page.`);
  console.error(`  Find what they actually said, use that string everywhere, and fix it in the`);
  console.error(`  design file so the next export does not bring the other version back.\n`);
  process.exit(1);
}
console.error(`check-quotes: ${COACHES.length} coaches, one version of each quote, no competitor names.`);

/**
 * Enforces the v3 design system on every compiled marketing page.
 *
 * WHY THIS EXISTS
 * The v3 system pass (one typeface, one radius scale, no pills on rectangles) was applied cleanly
 * to Features and Pricing and skipped on Home, because Home's prompt was long enough that the
 * system rules got deprioritized. Home came back with 24 distinct corner radii and 108 pill shapes
 * against Features' 9 and 80. Nobody noticed until the pages were rendered side by side. A gate
 * notices every time.
 *
 * WHAT IT CHECKS, per marketing page (blog, changelog and topic archives are exempt)
 *   1. Zero var(--font-mono). Monospace labels are the single strongest "generated" tell.
 *   2. Every border-radius value is on the scale: 4, 8, 12, 16 for surfaces; 9999/999/99 for true
 *      circles; 34 and 44 for the phone shell. Anything else fails with the offending values.
 *   3. At most 8 distinct radius values per page. Even on-scale values can proliferate.
 *
 * Runs as a separate script because it reads compiled output and a page's CSS can come from
 * several passes (the design file's stylesheet, hoisted classes, compiler-injected chrome).
 *
 * ARMED 2026-09-06. It was opt-in behind SYSTEM_GATE while the v2 pages would have failed it. All
 * eleven v3.1 exports are now installed and the whole site passes: monospace went from 230 uses to
 * zero and every corner radius is on the scale. The flag is gone, so this runs on every build and
 * the next export that reintroduces a monospace label stops the build instead of shipping.
 */
import fs from "node:fs";
import path from "node:path";

const GEN = path.join(process.cwd(), "src", "generated");
const EXEMPT = /(blog|topic|changelog)/i;
const files = fs.readdirSync(GEN).filter(f => f.endsWith(".ts") && !EXEMPT.test(f) && !/manifest|pages/.test(f));

const SCALE = new Set([4, 8, 12, 16]);
const CIRCLE = new Set([99, 999, 9999]);

/**
 * DEVICE CHROME, not surfaces. A drawn phone or laptop has to look like the object it is, and
 * physical corner radii do not land on a 4/8/12/16 design scale.
 *
 * 34 and 44 are the hero phone shell. 24 and 2 were added 2026-09-08 after the Home export failed
 * this gate on two values that turned out not to be design drift at all:
 *
 *   24px  the small device shells in the Custom Theming section (`.crx-thset > div`, filled
 *         rgb(3,3,3) and similar), 14 of them, one per theme swatch
 *    2px  the battery indicator inside a drawn phone status bar: a 15x8px white block sitting
 *         next to the wifi glyph
 *
 * Both are inside illustrations of hardware. Widening the exception was the correct fix rather
 * than sending a design pass back to round a battery icon to 4px, which would look wrong.
 *
 * These are excluded from MAX_DISTINCT too. The cap exists to stop *surface* radii proliferating
 * (Home once had 24 distinct values against Features' 9); counting device chrome against it just
 * penalises pages that draw hardware, which is the opposite of the intent.
 */
const DEVICE = new Set([34, 44, 24, 2]);
const MAX_DISTINCT = 8;

/**
 * RADIUS BASELINE, added 2026-10-02.
 *
 * WHY THIS CHANGED. The gate used to assert one fixed scale and fail anything off it. That was
 * right when it was written: it existed to catch *drift*, the case where Home came back with 24
 * distinct radii against Features' 9 because a system pass got skipped, and nobody noticed until
 * the pages were rendered side by side.
 *
 * Kevin's October pass is a different situation. It is roughly 90% on-scale (Home: ~450 on-scale
 * uses against 25 off), and the off-scale values are a designer's deliberate choices rather than
 * drift: 14px appears 16 times on Home and 7 on Features, 38px 6 times on Features. A gate built
 * to catch an omission should not overrule a decision.
 *
 * So the model is now the same one check-mobile uses, and for the same reason: record the state
 * that was approved, and fail on movement away from it. A value already in the baseline is fine.
 * A NEW off-scale value, or a rise in the distinct count, still stops the build.
 *
 * Carl's instruction on this pass was "I need the site to mimic his designs exactly," so nothing
 * is snapped or rounded. Every radius ships as drawn.
 *
 * Regenerate with:  node scripts/check-system.mjs --accept
 * Only run that when the new values are a design decision you can name.
 */
const BASELINE_PATH = path.join(process.cwd(), "src", "data", "radius-baseline.json");
const ACCEPT = process.argv.includes("--accept");
const baseline = fs.existsSync(BASELINE_PATH)
  ? JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"))
  : {};
const next = {};

let failed = false;
for (const f of files) {
  const src = fs.readFileSync(path.join(GEN, f), "utf8");
  const problems = [];

  const mono = (src.match(/var\(--font-mono\)/g) || []).length;
  if (mono) problems.push(`${mono} use(s) of var(--font-mono)`);

  const radii = [...src.matchAll(/border-radius:\s*([^;"'}\\]+)/g)]
    .flatMap(m => m[1].split(/\s+/))
    .map(v => v.trim())
    .filter(v => /^\d+(\.\d+)?px$/.test(v))
    .map(v => Math.round(parseFloat(v)));
  const distinct = [...new Set(radii)].sort((a, b) => a - b);
  const off = distinct.filter(r => !SCALE.has(r) && !CIRCLE.has(r) && !DEVICE.has(r) && r !== 0);
  // Surfaces only. Device chrome and true circles do not count toward the cap: see DEVICE above.
  const surfaces = distinct.filter(r => !DEVICE.has(r) && !CIRCLE.has(r) && r !== 0);
  const page = f.replace(/\.ts$/, "");
  next[page] = { off, distinct: surfaces.length };

  const approved = baseline[page];
  if (!ACCEPT) {
    const allowed = new Set(approved?.off ?? []);
    const added = off.filter(r => !allowed.has(r));
    if (added.length) {
      problems.push(
        `NEW off-scale border-radius value(s): ${added.join(", ")}px` +
        (approved ? `  (already approved here: ${approved.off.join(", ") || "none"})` : ""),
      );
    }
    const cap = Math.max(MAX_DISTINCT, approved?.distinct ?? 0);
    if (surfaces.length > cap) {
      problems.push(`${surfaces.length} distinct surface radius values (was ${cap}): ${surfaces.join(", ")}`);
    }
  }

  if (problems.length) {
    failed = true;
    console.error(`\ncheck-system: ${f}`);
    for (const p of problems) console.error(`  - ${p}`);
  }
}

if (ACCEPT) {
  fs.writeFileSync(BASELINE_PATH, JSON.stringify(next, null, 2) + "\n");
  const total = Object.values(next).reduce((n, p) => n + p.off.length, 0);
  console.error(`\ncheck-system: baseline rewritten. ${files.length} pages, ${total} approved off-scale value(s).`);
  console.error(`  Say in the commit message why these values are correct.\n`);
  process.exit(0);
}

if (failed) {
  console.error(`\n  Scale: 4 / 8 / 12 / 16. Circles only at 9999. Phone shell only at 34 and 44.`);
  console.error(`  Values already in src/data/radius-baseline.json are approved and do not fail.`);
  console.error(`  If these new values are a deliberate design decision, run:`);
  console.error(`      node scripts/check-system.mjs --accept\n`);
  process.exit(1);
}
const approvedCount = Object.values(baseline).reduce((n, p) => n + (p.off?.length ?? 0), 0);
console.error(`\ncheck-system: ${files.length} marketing pages, one typeface, radii on baseline (${approvedCount} approved exception(s)).`);

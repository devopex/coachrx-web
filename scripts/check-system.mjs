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
const PHONE = new Set([34, 44]);
const MAX_DISTINCT = 8;

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
  const off = distinct.filter(r => !SCALE.has(r) && !CIRCLE.has(r) && !PHONE.has(r) && r !== 0);
  if (off.length) problems.push(`off-scale border-radius value(s): ${off.join(", ")}px`);
  if (distinct.length > MAX_DISTINCT) problems.push(`${distinct.length} distinct radius values (max ${MAX_DISTINCT}): ${distinct.join(", ")}`);

  if (problems.length) {
    failed = true;
    console.error(`\ncheck-system: ${f}`);
    for (const p of problems) console.error(`  - ${p}`);
  }
}

if (failed) {
  console.error(`\n  The v3 design system was not fully applied. Run the system-pass prompt on the design file.`);
  console.error(`  Scale: 4 / 8 / 12 / 16. Circles only at 9999. Phone shell only at 34 and 44.\n`);
  process.exit(1);
}
console.error(`\ncheck-system: ${files.length} marketing pages, one typeface, radii on scale.`);

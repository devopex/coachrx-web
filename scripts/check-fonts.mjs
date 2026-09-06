/**
 * The site must ship in the typeface the brand actually chose, in a format worth serving.
 *
 * WHY THIS EXISTS
 * Casey's first and loudest note on the whole redesign was, verbatim: "AI-generated
 * characteristics: Geist / Geist Mono fonts, monospaced fonts." Carl answered the follow-up on
 * 2026-09-01 with "Mona Sans site and brand."
 *
 * What then happened is that every monospace USAGE was removed, 230 of them, and the TYPEFACE was
 * never touched. On 2026-09-06 the staging deploy was still serving nine Geist @font-face blocks
 * and computing `Geist` on every h1 and every paragraph on the site. Nothing caught it, because
 * every gate was looking for the string "mono" and the design files never name a font at all: they
 * all use var(--font-sans), which resolved to Geist in one CSS file nobody re-read.
 *
 * A gate that greps compiled pages could never have found this. It has to read the design system.
 *
 * WHAT IT CHECKS, in public/design/_ds/colors_and_type.css
 *   1. No @font-face declares a family outside APPROVED.
 *   2. --font-sans and --font-display both resolve to an approved family first.
 *   3. Every @font-face src is woff2. TTF is uncompressed and roughly double the bytes for the
 *      same glyphs; five Geist TTFs were costing about 385 KB on every page load.
 */
import fs from "node:fs";
import path from "node:path";

const CSS = path.join(process.cwd(), "public", "design", "_ds", "colors_and_type.css");

/**
 * The brand face, decided by Carl on 2026-09-01. Add to this list only when the brand actually
 * changes, never to make a failure go away.
 */
const APPROVED = ["Mona Sans"];

if (!fs.existsSync(CSS)) {
  console.error(`check-fonts: cannot find ${CSS}`);
  process.exit(1);
}
const css = fs.readFileSync(CSS, "utf8");
const problems = [];

const faces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);
const families = new Set();
for (const body of faces) {
  const fam = /font-family\s*:\s*["']?([^"';]+)["']?/.exec(body);
  if (fam) families.add(fam[1].trim());
}
const unapproved = [...families].filter((f) => !APPROVED.includes(f));
if (unapproved.length) {
  problems.push(
    `@font-face declares ${unapproved.length} unapproved famil${unapproved.length === 1 ? "y" : "ies"}: ${unapproved.join(", ")}`,
  );
}

for (const v of ["--font-sans", "--font-display"]) {
  const m = new RegExp(`${v}\\s*:\\s*([^;]+)`).exec(css);
  if (!m) { problems.push(`${v} is not defined`); continue; }
  const first = m[1].split(",")[0].replace(/["']/g, "").trim();
  if (!APPROVED.includes(first)) problems.push(`${v} resolves to "${first}", not the brand face`);
}

const nonWoff2 = faces
  .map((b) => /src\s*:\s*url\(["']?([^"')]+)/.exec(b)?.[1])
  .filter((u) => u && !/\.woff2(\?|$)/i.test(u));
if (nonWoff2.length) {
  problems.push(
    `${nonWoff2.length} @font-face src(s) are not woff2: ${[...new Set(nonWoff2.map((u) => u.split("/").pop()))].slice(0, 4).join(", ")}${nonWoff2.length > 4 ? ", ..." : ""}`,
  );
}

/**
 * The Tailwind config has to agree with the design system.
 *
 * Tailwind's preflight emits `html, :host { font-family: <theme sans> }` and the body carries
 * .font-sans, so this file decides what every element the design CSS does not explicitly reach
 * renders in. On 2026-09-06 colors_and_type.css moved to Mona Sans, tailwind.config.ts still said
 * Geist, and the Geist files had been deleted, so `html` resolved to a 404'd font and fell through
 * to the OS default. The marketing copy looked right because the compiled pages set
 * var(--font-sans) on their own containers; everything else did not.
 *
 * Checking one of the two files is checking half the site.
 */
const TW = ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs"]
  .map((f) => path.join(process.cwd(), f))
  .find((f) => fs.existsSync(f));
if (TW) {
  const tw = fs.readFileSync(TW, "utf8");
  const sans = /sans\s*:\s*\[\s*["']([^"']+)["']/.exec(tw);
  if (!sans) problems.push(`${path.basename(TW)} does not set theme.fontFamily.sans`);
  else if (!APPROVED.includes(sans[1]))
    problems.push(`${path.basename(TW)} sets fontFamily.sans to "${sans[1]}", not the brand face`);
  const twMono = /mono\s*:\s*\[\s*["']([^"']+)["']/.exec(tw);
  if (twMono && /geist|mona/i.test(twMono[1]))
    problems.push(`${path.basename(TW)} still names a webfont for fontFamily.mono ("${twMono[1]}"); nothing on the site uses monospace`);
}

if (problems.length) {
  console.error(`\ncheck-fonts: the site is not set in the brand typeface.\n`);
  for (const p of problems) console.error(`  ! ${p}`);
  console.error(`\n  Approved: ${APPROVED.join(", ")}.`);
  console.error(`  Fix ${path.relative(process.cwd(), CSS)}. The design files never name a font;`);
  console.error(`  they all use var(--font-sans), so this one file changes the whole site.\n`);
  process.exit(1);
}
console.error(`check-fonts: ${[...families].join(", ")}, woff2, brand variables correct.`);

/**
 * Every image a compiled page asks for must exist on disk.
 *
 * WHY THIS EXISTS
 * A missing image is the quietest possible failure. The page still renders, the layout still
 * holds, every other gate passes, and the only symptom is that the design looks subtly wrong in a
 * way nobody can point at. There is nothing in the build output to explain it.
 *
 * Found on 2026-10-02. Kevin's refinement pass set a page-wide background on the root div of all
 * thirteen pages:
 *
 *   background-color:#030409;background-image:url("uploads/BackgroundNoNoise.png")
 *
 * Two separate bugs stacked:
 *
 *   1. dc-compile's rewriteAsset() was wired to `src` and `href` only, so the url() shipped as a
 *      RELATIVE path and resolved against the current route: /uploads/... on "/" and
 *      /features/uploads/... on "/features". Both 404. Fixed by rewriteCssUrls().
 *   2. The file was never in the repo at all. It lives in the designer's Claude Design workspace,
 *      which the export does not carry.
 *
 * Carl's report was "it doesn't match Kevin's designs," and the background texture was one of the
 * things he meant. Neither existing gate could see it: check-screens reads pinned hashes of files
 * that ARE present, and nothing walked the reference the other way.
 *
 * WHAT IT CHECKS
 * Every url() in compiled CSS and every <img src> in compiled HTML, for all generated pages.
 * Absolute, data: and remote URLs are skipped. A reference to a file that is not on disk fails
 * the build, naming the page and the path.
 *
 * PENDING is for an asset we know is missing and have asked the designer for. It reports loudly
 * every build but does not block, so the site can ship while the file is chased. Delete the entry
 * the moment the file lands. Do not add to this list to silence a failure: a missing asset is a
 * visible defect, and the only correct fix is the file.
 */
import fs from "node:fs";
import path from "node:path";

const GEN = path.join(process.cwd(), "src", "generated");
const PUB = path.join(process.cwd(), "public");

const PENDING = [
  // Empty on purpose. The two entries that lived here (BackgroundNoNoise.png and
  // "Features Background.png") were page-background textures created inside Claude Design that
  // never existed as files anywhere. They were replaced on 2026-10-02 with an equivalent CSS
  // gradient in the design files, which is cheaper (no request), scales to any viewport without
  // banding, and cannot go missing. Add an entry only for an asset genuinely being chased.
];
const pendingSet = new Set(PENDING.map((p) => p.file));

const files = fs.readdirSync(GEN).filter((f) => f.endsWith(".ts") && !/manifest|topic-pages/.test(f));

function strOf(src, name) {
  const m = src.match(new RegExp(`export const ${name} = ("(?:[^"\\\\]|\\\\.)*");`, "s"));
  return m ? JSON.parse(m[1]) : "";
}

const missing = new Map(); // path -> Set(pages)
let checked = 0;

for (const f of files) {
  const src = fs.readFileSync(path.join(GEN, f), "utf8");
  const html = strOf(src, "html");
  const css = strOf(src, "css");
  /**
   * Decode HTML entities FIRST. The compiler writes inline styles back through cheerio, which
   * escapes the quotes inside url("..."), so a reference arrives as
   * `url(&quot;/design/uploads/X.png&quot;)`. Scanning the raw string silently matches nothing,
   * and the gate passes while the asset is missing. That is the exact failure this gate exists to
   * prevent, so it is worth the extra pass.
   */
  const blob = (html + css)
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");

  const refs = new Set();
  for (const m of blob.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) refs.add(m[1].trim());
  for (const m of blob.matchAll(/<img\b[^>]*?\ssrc="([^"]+)"/g)) refs.add(m[1].trim());

  for (const r of refs) {
    if (!r || /^(https?:|data:|blob:|#)/.test(r)) continue;
    if (!/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(r)) continue; // skip SVG fragment refs like url(#grad)
    checked++;
    const rel = decodeURIComponent(r.replace(/^\//, ""));
    if (!fs.existsSync(path.join(PUB, rel))) {
      const key = r.startsWith("/") ? r : "/" + r;
      if (!missing.has(key)) missing.set(key, new Set());
      missing.get(key).add(f.replace(/\.ts$/, ""));
    }
  }
}

const hard = [...missing].filter(([p]) => !pendingSet.has(decodeURIComponent(p)));
const soft = [...missing].filter(([p]) => pendingSet.has(decodeURIComponent(p)));

for (const [p, pages] of soft) {
  const note = PENDING.find((x) => x.file === decodeURIComponent(p));
  console.error(`check-assets: PENDING  ${p}`);
  console.error(`  ${note.why}`);
  console.error(`  Referenced by ${pages.size} page(s): ${[...pages].sort().join(", ")}`);
  console.error(`  Drop the file into public${path.dirname(decodeURIComponent(p))}/ and remove the PENDING entry.\n`);
}

if (hard.length) {
  console.error(`\ncheck-assets: ${hard.length} referenced image(s) do not exist on disk.\n`);
  for (const [p, pages] of hard) {
    console.error(`  ${p}`);
    console.error(`     wanted by: ${[...pages].sort().join(", ")}`);
  }
  console.error(`\n  A missing image does not break the page, it just silently removes part of the`);
  console.error(`  design, which is why this gate exists. Get the file from the designer and put it`);
  console.error(`  in public/design/. Do not delete the reference to make this pass.\n`);
  process.exit(1);
}

console.error(
  `\ncheck-assets: ${checked} image reference(s) across ${files.length} pages all resolve` +
  (soft.length ? `, ${soft.length} pending.` : `.`),
);

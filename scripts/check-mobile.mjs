/**
 * MOBILE REGRESSION GATE. Runs on every build. Fails the build on any regression.
 *
 * WHY THIS EXISTS. Carl's single most repeated instruction across this whole project is "do not
 * break mobile" — 90% of CoachRx traffic is phones. It broke three times anyway, and every time
 * the build was green, the typecheck was clean and the markup looked right:
 *
 *   1. A carousel silently rendered as a stack, because the responsive backstop force-collapsed
 *      any inline grid-template-columns to one column.
 *   2. Tall boxes collapsed that were crop frames and positioning contexts, so screenshots
 *      un-cropped and absolutely positioned children escaped onto the text below.
 *   3. An !important backstop rule overrode the design's own mobile work on 64 elements, which is
 *      why the same Custom Theming complaint survived three design passes.
 *
 * None of those are catchable by looking at a diff. They are only catchable by measuring the
 * compiled output and comparing it with a known-good state. So that comparison is now part of the
 * build rather than something anyone has to remember to do.
 *
 * HOW IT WORKS
 *   src/data/mobile-baseline.json holds the metrics from the last state Carl approved.
 *   Three kinds of rule:
 *     MUST_NOT_DROP   mobile CSS blocks, collapsed tall boxes, object-fit images.
 *                     Fewer than before means mobile handling was removed.
 *     MUST_STAY       burger, sheet, burger JS, the overflow-x guard. Exact match.
 *     MUST_STAY_ZERO  margin crops, unsafe collapses, carousel-as-grid, min-width cards,
 *                     setState handlers, intrinsic dimensions on a cropped image.
 *                     Any of these above zero is a known-bad pattern returning.
 *
 * A page disappearing is also a failure.
 *
 * TO ACCEPT A DELIBERATE CHANGE: `npm run mobile:accept`, and say in the commit why the new
 * numbers are correct. Never accept a baseline to make a red build go green.
 */
import fs from "node:fs";
import { snapshot } from "./mobile-metrics.mjs";

const BASELINE = "src/data/mobile-baseline.json";
const MUST_NOT_DROP = ["mobileBlocks", "tallCollapsed", "objectFitImgs"];
const MUST_STAY = ["burger", "sheet", "burgerJS", "overflowGuard"];
const MUST_STAY_ZERO = ["marginCrops", "unsafeCollapsed", "carouselAsGrid", "cardsWithMinWidth",
                        "stateHandlers", "imgWithIntrinsicOnCrop"];

const now = snapshot();

if (process.argv.includes("--accept")) {
  fs.writeFileSync(BASELINE, JSON.stringify(now, null, 1) + "\n");
  console.log(`\ncheck-mobile: baseline updated for ${Object.keys(now).length} pages.`);
  console.log("  Say in the commit message why the new numbers are correct.");
  process.exit(0);
}

if (!fs.existsSync(BASELINE)) {
  fs.writeFileSync(BASELINE, JSON.stringify(now, null, 1) + "\n");
  console.log("\ncheck-mobile: no baseline, wrote the current state as the first one.");
  process.exit(0);
}

const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
const fail = [];
for (const [page, cur] of Object.entries(now)) {
  const was = base[page];
  if (!was) continue;                                   // a genuinely new page is not a regression
  for (const k of MUST_NOT_DROP) if (cur[k] < was[k]) fail.push(`${page}.${k} dropped ${was[k]} -> ${cur[k]}`);
  for (const k of MUST_STAY) if (cur[k] !== was[k]) fail.push(`${page}.${k} changed ${was[k]} -> ${cur[k]}`);
  for (const k of MUST_STAY_ZERO) if (cur[k] > 0) fail.push(`${page}.${k} is ${cur[k]}, must be 0`);
}
for (const page of Object.keys(base)) if (!now[page]) fail.push(`${page}: page disappeared`);

if (fail.length) {
  console.error("\ncheck-mobile: MOBILE REGRESSION. Build stopped.\n");
  for (const f of fail) console.error("  ! " + f);
  console.error("\n  Fix it, or run `npm run mobile:accept` if the change is deliberate and");
  console.error("  you can say why the new numbers are correct.\n");
  process.exit(1);
}
console.log(`\ncheck-mobile: ${Object.keys(now).length} pages, no mobile regression.`);

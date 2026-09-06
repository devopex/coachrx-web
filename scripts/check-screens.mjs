/**
 * Blocks known-bad product screenshots from shipping.
 *
 * WHY THIS EXISTS
 * Every other gate reads text. A screenshot is pixels, so a retired feature or a real client's
 * personal data can sit in the single largest image on the home page and pass all fifteen text
 * gates without a murmur.
 *
 * That is exactly what happened. calendar.png is the hero image on Home (4 uses) and on Features
 * (2 uses). Its toolbar shows an "RxBot" button. RxBot was retired and removed from the product
 * on 2026-08-19, and checkRetired has been failing the build on the *word* RxBot since. The
 * picture of the button sailed through.
 *
 * HOW IT WORKS
 * Each entry pins the SHA-256 of a file we know is wrong and says why. When the screenshot is
 * retaken the hash changes and the entry stops matching, which is the pass condition. Do not
 * "fix" a failure by deleting the entry. Retake the screenshot.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SCREENS = path.join(process.cwd(), "public", "design", "assets", "screens");

const BLOCKED = [
  {
    file: "calendar.webp",
    sha: "dac9b670c927d67c0672b3105d49fd18e5e6c83ec88ba1f053e6fc8291fae248",
    why: 'toolbar shows an "RxBot" button. RxBot was retired 2026-08-19.',
    fix: "Retake the program design calendar with the current toolbar, same crop, 1677x1232, and save as WebP.",
    // Carl, 2026-09-05: "rxbot in the screen is fine for now." Accepted so v3.2 can be built
    // and reviewed. This does NOT clear the item, it defers it. Remove `accepted` to make it
    // block again, which is the right move before the DNS cutover: this image is the hero on
    // Home (4 uses) and Features (2 uses), so it is the most-seen picture on the whole site.
    accepted: "Carl, 2026-09-05, pre-launch only",
  },
];

/**
 * Advisory, not blocking: screenshots that show a named individual's personal data.
 * Flagged on every build so it stays visible, but it does not fail the build because
 * whether the account is a real client or a demo profile is Carl's call, not a script's.
 */
const PRIVACY_NOTES = [
  {
    file: "messages.webp",
    sha: "8881b514e36f86fbcce58e221cdeb366899773afc2845bf760d74d58c59ca658",
    why: 'shows "Ken Hardaway", age, height, body weight and a client-since date.',
  },
];

const sha256 = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

let failed = false;

for (const b of BLOCKED) {
  const p = path.join(SCREENS, b.file);
  if (!fs.existsSync(p)) continue;
  if (sha256(p) !== b.sha) continue;
  if (b.accepted) {
    console.error(`\ncheck-screens: DEFERRED  ${b.file} ${b.why}`);
    console.error(`  Accepted by ${b.accepted}. Still shipping. ${b.fix}`);
    continue;
  }
  failed = true;
  console.error(`\ncheck-screens: ${b.file}`);
  console.error(`  - ${b.why}`);
  console.error(`    ${b.fix}`);
}

for (const n of PRIVACY_NOTES) {
  const p = path.join(SCREENS, n.file);
  if (fs.existsSync(p) && sha256(p) === n.sha) {
    console.error(`\ncheck-screens: NOTE  ${n.file} ${n.why}`);
    console.error(`  Not blocking. Confirm this is a demo profile, or blur it, before launch.`);
  }
}

if (failed) {
  console.error(`\n  A screenshot shows something that is no longer in the product.`);
  console.error(`  Text gates cannot see inside a PNG. Retake the image; the hash will change.\n`);
  process.exit(1);
}
console.error(`check-screens: no blocked screenshots.`);

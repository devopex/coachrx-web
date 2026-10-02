# CASEY: START HERE

Handover for `coachrx-web`, the CoachRx marketing site. Written 2026-10-02 against the repo
as it actually is, not from memory. Every number, path and command below was verified.

Read sections 1 through 4 before you touch anything. The rest is reference.

---

## 1. What this is and where it stands

This replaces the Squarespace site at `www.coachrx.app`. It is built, gated and deployed to
staging. It has not been cut over to the live domain yet.

| | |
|---|---|
| **Repo** | `github.com/devopex/coachrx-web` |
| **Staging** | https://coachrx-web.carl-a22.workers.dev/ |
| **Live (still Squarespace)** | https://www.coachrx.app |
| **Host** | Cloudflare Workers, project `coachrx-web` |
| **Stack** | Next.js 16 App Router, React 19, TypeScript, Tailwind 3, `@opennextjs/cloudflare` |
| **Current HEAD** | `c639c3d` |
| **Pages** | 24 compiled routes |
| **Articles** | 340 MDX posts |
| **Changelog** | 44 releases |
| **Redirects** | 299 rules, all 301, 36 distinct destinations |

**The site is done. What remains is DNS, analytics and ownership, not building.**

### Access problem to fix first

The repo lives under `devopex`, which is **Carl's personal GitHub account**, not the `OPEXFit`
organization. That is wrong for a business-critical asset and it is why you cannot just be
added as an org member.

Fix before anything else: transfer the repo to `OPEXFit`, then re-point the Cloudflare Workers
build integration at the new location. Carl does this from GitHub > Settings > Transfer
ownership. Budget 15 minutes including the Cloudflare reconnect.

---

## 2. First 30 minutes

```bash
git clone https://github.com/devopex/coachrx-web.git
cd coachrx-web
npm install
npm run generate     # runs the full compile + all 8 gates. ~60s.
npm run dev          # localhost:3000
```

`npm run generate` is the one that matters. If it exits 0, the repo is healthy. If it fails,
read the error: every gate prints why it exists and what to do about it.

To verify the actual Worker rather than the dev server:

```bash
npm run cf:build
npx opennextjs-cloudflare populateCache local
npx wrangler dev --port 8787 --local
```

Do not use bare `wrangler dev` without `populateCache`. Every statically generated route
returns 404 and it looks exactly like a routing bug. That has cost time twice.

### One environment variable

`NOTION_TOKEN` is read at build time by `scripts/fetch-roadmap.mjs` to bake the public roadmap
into `/roadmap`. It lives in Cloudflare's build environment variables. Without it locally, the
roadmap build falls back to the committed `src/data/roadmap.json` and everything else works
fine, so you do not need it to develop.

**Note:** this token was once pasted into a chat and has not been rotated. Rotate it when you
take ownership. Tracked but not done.

---

## 3. The mental model: three systems, and who owns what

This is the thing most likely to confuse people. Say it out loud once and it stops being
confusing.

```
  Claude Design              GitHub                    Cloudflare
  ─────────────              ──────                    ──────────
  Owns look and feel   →     Owns the record     →     Owns build and deploy
  The .dc.html files         Commits, history          Runs the gates, ships the Worker
```

**Claude Design owns the visual.** The thirteen `.dc.html` files in `design/Pages/` are the
visual source of truth for the site. Carl refines pages there, exports the file, and the export
gets installed into the repo.

**The repo owns wiring and enforcement.** Routes, components, data, the compiler, the gates,
the redirect map. Everything that is not "how it looks."

**Cloudflare owns whether it ships.** On push to `main`, Cloudflare runs `npm run cf:build`.
Because `precf:build` is wired to `npm run generate`, that means **every gate runs on every
deploy**. A failing gate stops the deploy. This is the single most important line in
`package.json`:

```json
"precf:build": "npm run generate"
```

Do not remove it. It is the only thing preventing an ungated deploy.

### Cloudflare project settings (easy to get wrong)

- **Build command:** `npm run cf:build`
- **Deploy command:** `npx opennextjs-cloudflare deploy`

Plain `npm run build` is not enough. `next build` alone does not produce
`.open-next/.build/open-next.config.mjs` and the deploy fails with "Could not find compiled
Open Next config."

Harmless noise: `cf:build` prints a wall of `ERROR Failed to copy node_modules/...` lines for
MDX packages and still succeeds. Look for `Worker saved in .open-next/worker.js` rather than
trusting the absence of the word ERROR.

---

## 4. The golden rule

**Visual changes go into the design file first. Never into the repo.**

```
design/Pages/CoachRx Home.dc.html  ──dc-compile.mjs──▶  src/generated/home.ts
                                                         { html, css, script, data }
src/app/page.tsx  is a four-line wrapper around <DcPage />
```

If you "fix" a visual problem by editing `src/generated/` or by writing JSX, the next design
export silently reverts it. This has happened repeatedly and cost days. The Geist font bug
came back in **four consecutive exports** because it kept being fixed in the repo instead of at
source.

The split in practice:

| Change | Where |
|---|---|
| Color, spacing, type, layout, copy on a page, animation | Design file |
| Routes, redirects, data wiring, components, gates, build scripts | Repo |
| A bug in how the compiler handles something | Repo (`scripts/dc-compile.mjs`) |

When a design export contains a defect that blocks the build (a wrong font, an off-scale
radius), fix it in the repo to unblock **and** tell Carl so it gets fixed in Claude Design.
Otherwise it returns next export.

### The hard constraint inside design files

`DcRuntime.setState` is a **deliberate no-op**:

```ts
// src/components/DcRuntime.tsx:21
setState() { /* the compiled markup is static; state changes are handled in-DOM */ }
```

There is no React tree to re-render. So anything gated on component state compiles to nothing
and vanishes **with no error**:

```html
<!-- DEAD. Silently. -->
<sc-if value="{{ isOpen }}">…</sc-if>
<div class="{{ activeTab }}">…</div>
<span onClick="{{ () => this.setState({ tab: 2 }) }}">Program Design</span>
```

This has broken four separate features, including every topic chip on the blog index and every
poster image in the testimonial bar. Interactivity must be CSS-only (`:hover`,
`:focus-within`, `<details>`, peer-checked radios) or driven through `classList` in the page's
own script. `check-mobile` fails the build if `setState` handlers reappear.

---

## 5. Repo map

```
coachrx-web/
├── CLAUDE.md                 Claude Code context. Read it, it carries hard-won detail.
├── CASEY-START-HERE.md       This file.
├── design/Pages/*.dc.html    13 design files. Visual source of truth.
├── scripts/
│   ├── dc-compile.mjs        The compiler. 118 KB. Design file → generated TS module.
│   ├── build-blog.mjs        Compiles blog templates with the real 340 posts.
│   ├── build-roadmap.mjs     Roadmap page from Notion data.
│   ├── build-changelog.mjs   44 releases.
│   ├── build-updates.mjs     /roadmap, /changelog, /feature-requests shells.
│   ├── fetch-roadmap.mjs     Pulls the Feature Hub from Notion at build time.
│   ├── generate-posts.mjs    340 post frontmatter → src/data/posts.json.
│   └── check-*.mjs           The 8 gates. See section 7.
├── src/
│   ├── app/                  Routes. Mostly thin wrappers around <DcPage />.
│   ├── components/           DcPage, DcRuntime, and hand-built pieces.
│   ├── data/                 redirects.json, mobile-baseline.json, topics, authors, pricing.
│   ├── generated/            BUILD OUTPUT. Gitignored. Never edit.
│   └── lib/                  posts, body, dc, changelog helpers.
├── content/
│   ├── posts/*.mdx           340 articles.
│   └── changelog/*.mdx       44 releases.
├── public/
│   ├── design/_ds/           colors_and_type.css + Mona Sans woff2. The design system.
│   ├── design/assets/        Screenshots and device renders used by design files.
│   └── images/               Article featured images and content images, pre-sized WebP.
└── ../site-migration/        OUTSIDE the repo, in the project folder. The archive,
                              redirect-map.csv with a reason per row, triage decisions.
```

`src/generated/` is gitignored. It is rebuilt on every build. If you ever find yourself editing
a file in there, stop, you are in the wrong place.

---

## 6. The build chain

`npm run generate` runs 14 steps in order. The first six build, the last eight verify.

```
 1  fetch-roadmap     Notion → src/data/roadmap.json
 2  generate-posts    340 MDX frontmatter → src/data/posts.json
 3  dc-compile        13 design files → src/generated/*.ts
 4  build-blog        blog templates + real posts → blog-index, topic-*, blog-post
 5  build-roadmap     roadmap page
 6  build-changelog   changelog index + entries
 7  build-updates     the three Updates routes
 8  check-runtime     ← gates begin
 9  check-mobile
10  check-footer
11  check-pillars
12  check-system
13  check-screens
14  check-quotes
15  check-fonts
```

Useful subsets:

```bash
npm run dc              # compile only, no gates. Fast loop while iterating.
npm run generate        # everything including gates. What CI runs.
npm run roadmap         # refresh roadmap data only.
npm run mobile:accept   # accept current mobile metrics as the new baseline. See below.
npm run typecheck
```

---

## 7. The eight gates, and why each one exists

**Every one of these is a scar.** Each was added after something shipped broken and no existing
check caught it. When a gate fails, the fix is almost never to weaken the gate.

### `check-runtime`
Loads every compiled design script the exact way `DcRuntime` does, in a sandbox with the same
injected globals, and fails if construction or `renderVals()` throws.

*Why:* a single `React.createElement` inside home's `renderVals()` shipped to staging. React is
a global in Claude Design but not in the compiled bundle, so it threw, `DcRuntime` caught it,
`componentDidMount` never ran, and **every animation and scroll behavior on the home page was
silently dead**. The page looked fine and every other check passed.

### `check-mobile`
Measures the compiled output and compares against `src/data/mobile-baseline.json`. Three rule
types: metrics that must not drop, things that must stay exactly, and known-bad patterns that
must stay at zero.

*Why:* 90% of CoachRx traffic is phones, and mobile broke three times with a green build each
time. A carousel silently rendered as a stack. Crop frames collapsed so screenshots un-cropped
and absolutely positioned children escaped onto the text below. An `!important` backstop
overrode the design's own mobile work on 64 elements.

*If it fails legitimately* (you intentionally changed mobile layout), run `npm run mobile:accept`
to rebaseline, and say so in the commit. Do not rebaseline to make a red build green.

### `check-footer`
Fails if the footer drifts between pages, or if the oversized cropped wordmark returns.

*Why:* `dc-compile` sees one page at a time and structurally cannot notice that page A and page
B disagree. Ten hand-maintained copies of one footer drifted badly. The home page footer is
deliberately allowed one extra CTA.

### `check-pillars`
Guards the five pillars (Assess, Communicate, Program, Operate, Client Experience) across every
page, in prose, in metadata, and in the Features page anchors. Also fails on em dashes in page
metadata.

*Why:* on 2026-09-01 Consult became Communicate and Design became Program. The pillars appear in
six design files, in the compiler's footer columns, and in three places in the Features page
JavaScript. A partial rename makes the sticky nav scroll nowhere, silently. Separately, the
homepage shipped with an em dash in `<title>`, which is what every Google result and every
Slack share displays, and no gate was reading page metadata at all.

### `check-system`
Per marketing page: zero monospace, every border radius on the scale (4, 8, 12, 16 for
surfaces; 9999 for true circles; 34, 44, 24, 2 for device chrome), at most 8 distinct radius
values.

*Why:* the v3 system pass was applied to Features and Pricing and skipped on Home. Home came
back with 24 distinct corner radii and 108 pill shapes against Features' 9 and 80. Nobody
noticed until the pages were rendered side by side.

### `check-screens`
Pins the SHA-256 of screenshots known to contain something that must not ship, and fails if
the file still matches.

*Why:* every other gate reads text. A screenshot is pixels. `calendar.webp` is the hero image on
Home and Features and its toolbar showed an "RxBot" button. RxBot was retired 2026-08-19 and the
*word* RxBot had been failing the build since. The picture sailed through fifteen text checks.

**When a failure fires, retake the screenshot. Do not delete the entry.**

### `check-quotes`
Collects every quote attributed to each coach across every page. Fails if a coach has more than
one version of the same quote, or if any version names a competitor.

*Why:* two failures found the same day. Brandon Wilton's testimonial ended differently on two
pages, so at most one was what he said. And Kyle Krancher's quote on Features had the clause
"as the subscription is more affordable than TrueCoach" inserted into it, a competitor price
claim put in a coach's mouth.

**Fix by finding what the coach actually said. Never pick whichever reads better.** Carl's
standing rule: coach quotes ship verbatim.

### `check-fonts`
Reads `public/design/_ds/colors_and_type.css`. No `@font-face` outside the approved families,
`--font-sans` and `--font-display` resolve to an approved family first, every src is woff2. Also
scans compiled pages for hard-coded non-brand font families.

*Why:* Casey's loudest note on the whole redesign was "AI-generated characteristics: Geist /
Geist Mono fonts." Every monospace *usage* was then removed, 230 of them, and the *typeface* was
never touched. Staging served nine Geist `@font-face` blocks and computed Geist on every h1 on
the site. No gate could find it by grepping pages, because the design files never name a font,
they all use `var(--font-sans)` which resolved to Geist in one CSS file nobody re-read.

**Mona Sans is declared in two files that must agree:** `public/design/_ds/colors_and_type.css`
and `tailwind.config.ts`. A stale value in either leaves elements rendering in a font that no
longer exists on the server.

---

## 8. Things that will bite you

**The Worker has no filesystem.** `next build` and `npm run dev` both have one, so code that
reads content off disk works perfectly right up until it is in a Worker and throws `ENOENT`.
Post metadata comes from generated JSON (`src/data/posts.json`). Post bodies stay on disk and
are only read while prerendering. Inlining all 340 bodies pushed the Worker to 3.03 MB gzipped,
over the 3 MB limit, to carry text the Worker never reads.

**Prerendered pages come from the incremental cache.** `open-next.config.ts` sets
`incrementalCache: staticAssetsIncrementalCache`. Without it OpenNext renders on demand in the
Worker and everything 500s. `opennextjs-cloudflare deploy` handles cache population
automatically; bare `wrangler dev` does not.

**cheerio lowercases attribute names.** Match `onclick`, not `onClick`. Matching camelCase
silently dropped every handler once.

**jsdom cannot parse these design files.** It eagerly parses inline `style` and throws on some
gradient shorthands. The compiler uses cheerio for this reason.

**Never put `width`/`height` on a cropped screenshot.** Nine screenshots are deliberately scaled
past their frame and clipped. Adding intrinsic dimensions un-crops all of them and pushes the
page into horizontal overflow. Use `aspect-ratio` on the frame plus `object-fit: cover`.

**Exactly one `<h1>` per page.** Home, Features and Why CoachRx all shipped with zero on the
first pass.

**This sandbox cannot run headless Chrome.** Visual and mobile QA has to happen in a real
browser against the deployed preview. Do not claim a layout is correct from markup alone.

---

## 9. Copy and content rules that are enforced or expected

These are Carl's standing rules. Some are gated, some are not yet.

| Rule | Enforced by |
|---|---|
| No em dashes anywhere | `check-pillars` for metadata; by hand elsewhere |
| US spelling only | `checkSpelling` in the build |
| Coach quotes verbatim, never paraphrased | `check-quotes` |
| No competitor pricing or comparison tables | `check-quotes` partially. One approved exception: the Features page "12 Comparison" section (Carl, 2026-08-30) |
| RxBot is retired and must not appear | text gate + `check-screens` |
| The AI feature is called **Rex**, never "Agent" | by hand |
| Approved scale claim is "Thousands of coaches in 40+ countries" | by hand. `8,000+`, `10,000+` and `20,000+` are banned |
| Retired: the 3-client / 50% off first month offer | by hand. Do not build copy around it |
| No hard edges. Nothing meets the page or the footer with a visible straight line | by eye, and it is the thing Carl spots first |

---

## 10. Working with Claude Code on this repo

What works well:

- "Run `npm run generate` and tell me what failed and why."
- "Install this design export and verify nothing else changed." (Fingerprint the file first.)
- Compiler and gate changes. These are real code with real tests in the failing direction.
- Redirect, route and link sweeps.
- Anything in `src/lib`, `src/data`, `scripts/`.

What to avoid:

- Asking it to rebuild a page's visual in JSX. The result matches the design system but is not
  the design, which is the exact failure that made us abandon Framer.
- Editing `src/generated/`.
- Weakening a gate to make a build pass.
- Trusting a green build as proof the deployed Worker is correct. Crawl the preview.

**Always fingerprint a design export before installing it.** Stale exports have reverted days of
work more than once. Check the file is newer than what is in the repo and that the change you
expected is actually present before you overwrite.

---

## 11. What is NOT done

Ordered by what blocks launch.

### Blocking the DNS cutover

1. **Replicate the `coachrx.app` zone in Cloudflare.** This is a nameserver migration from
   GoDaddy, not an A-record swap, so rollback takes hours. Full runbook:
   `../DNS-CUTOVER-RUNBOOK.md`.

   **The one that can take the product down:** `dashboard.coachrx.app A 143.198.104.116`. That
   is CoachRx itself. If that record is not in Cloudflare before nameservers move, every paying
   customer loses the app while DNS propagates. Five TXT records also have to survive, including
   the Facebook domain verification.

2. **Meta pixel and canonical GA4.** Kandace's item. Three GA4 properties are in the GTM
   container (`G-RT01M0WZP5`, `G-RJQGQHD06P`, `G-SFSVQM16F1`) and one needs to be canonical.
   Do this before cutover or the baseline is lost.

### Not blocking, but overdue

3. **Transfer the repo to the OPEXFit org.** See section 1.
4. **Rotate `NOTION_TOKEN`.**
5. **Hand the blog to marketing.** Keystatic is wired at `/keystatic` and commits to git. Needs
   a deploy Action and a walkthrough so Kandace can publish without a developer.
6. **Rebuild the 13 dead lead-magnet funnels.** Live revenue leakage today. Marketing work.
7. **Two missing client app screenshots** still need to be taken and saved.
8. **Port the `check-system` fix back from `opexfit-web`.** The gate was extended there; the
   off-system values in `globals.css` were only fixed in that fork.

### Deliberately deferred

9. **The live activity map.** Good idea, wrong architecture as proposed, and it should not ride
   along with a launch. Summary of the position: do not push real per-user events to a public
   page (privacy exposure, and the coach-to-client lines reveal a relationship in a health
   context). Do not open a WebSocket from the marketing site to the Rails app (couples marketing
   traffic to product availability on the box that must never go down). Instead, aggregate
   server-side into time buckets, coarsen to city with jitter, suppress cities below about five
   active accounts, write a snapshot to Cloudflare KV every 60 seconds, and have the page poll.
   2D equal-earth dot matrix, not a 3D globe. Revisit after launch.

### After cutover

10. Keep Squarespace live and paid for **two weeks**. It is the only fast rollback.
11. Watch Search Console for 404 spikes for two weeks. 299 redirects is a lot of surface.

---

## 12. Launch sequence

```
Phase 1  Prepare, change nothing
         Export the GoDaddy zone. Add coachrx.app to Cloudflare. Add every record
         Cloudflare's scan missed, by hand, against the export. Verify dashboard.coachrx.app
         and all five TXT records. Do not touch nameservers.

Phase 2  Analytics
         Canonical GA4 settled. Pixel verified firing.

Phase 3  Cutover
         Add coachrx.app and www.coachrx.app as custom domains on the Worker.
         Change nameservers at GoDaddy. Keep the apex → www 301.

Phase 4  Verify, in this order
         1. dashboard.coachrx.app resolves and the app loads.  ← check this FIRST
         2. www returns 200 with cf-ray and server: cloudflare.
         3. apex 301s to www.
         4. Spot-check redirects. 299 rules, verified on staging.
         5. All five TXT records answer.
         6. GA4 and pixel receiving events.

Phase 5  After
         Squarespace stays paid two weeks. Watch 404s. Then cancel.
```

Rollback is changing the nameservers back at GoDaddy, which takes hours, not minutes. That is
exactly why Phase 1 is the phase that matters.

---

## 13. Who to ask

| Topic | Person |
|---|---|
| Product direction, copy sign-off, anything visual | Carl |
| Design file changes, Figma | Kevin, through Carl |
| Analytics, pixel, funnels, blog publishing | Kandace |
| Everything in this document | You, now |

### A note on Figma

Kevin has been trying to mirror a refined Figma homepage into Claude Design and it keeps landing
off. The position Carl is taking into the team call: **the Claude Design file is the source of
truth for the live site; Figma is where Kevin explores and specs named deltas.** The homepage
carries interaction, breakpoints, a FLIP morph animation, focus traps and localStorage that a
Figma frame structurally cannot hold, so compiling from Figma will keep failing. If that
decision lands differently, this document needs updating.

---

## 14. `CLAUDE.md`

Read it. Claude Code loads it automatically, and it carries detail this file does not: the
compiler internals, the blog compilation approach, the Worker filesystem constraints, the
authors decision, and the reasoning behind the redirect map.

It was written during scaffolding in August and had drifted. It was corrected on 2026-10-02:
Next 16 not 15, the real npm scripts, 299 redirects not 265/298, the `design/Pages/` path, the
removal of the `(chrome)` route group and `/why-coachrx`, the monospace ban, the Mona Sans
two-file rule, the radius scale, the reversed chrome contract, the banned scale claims, a
current page inventory, and a new section covering all eight gates.

If you find anything else in it that does not match the repo, fix it in the same commit as
whatever you were doing. A context file nobody trusts is worse than none.

---

## 15. Verified state at handover

Run on 2026-10-02 against `c639c3d`:

```
check-runtime:  24 scripts load and initialise cleanly.
check-mobile:   24 pages, no mobile regression.
check-footer:   24 pages, one identical footer, no oversized wordmark.
check-pillars:  24 pages, five pillars consistent, every anchor resolves.
check-system:   9 marketing pages, one typeface, radii on scale.
check-screens:  no blocked screenshots.
check-quotes:   5 coaches, one version of each quote, no competitor names.
check-fonts:    Mona Sans, woff2, brand variables correct.
```

`check-screens` prints one DEFERRED line about an RxBot button visible in the toolbar of
`calendar.webp`. **That is expected, not a failure.** Carl accepted it permanently on
2026-09-06. It resolves when someone retakes the program design calendar screenshot with the
current toolbar, same crop, 1677x1232, saved as WebP. Do not raise it with him again.

The tree is clean and `origin/main` is level with local.

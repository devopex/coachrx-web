# CoachRx Web

Marketing site and article library for CoachRx. Replaces the Squarespace site at
`www.coachrx.app`. Next.js App Router on Cloudflare Workers.

> **New here? Read `CASEY-START-HERE.md` first.** It covers the pipeline, the gates, the
> launch sequence and what is still open. This file is the detail underneath it.

## Stack

- **Next.js 16 App Router** + React 19 + TypeScript + Tailwind 3
- **MDX** article bodies in `content/posts/*.mdx`, rendered with `next-mdx-remote/rsc`
- **Keystatic** visual editor at `/keystatic`, commits to git. No CMS bill, no database.
- **Cloudflare Workers** via `@opennextjs/cloudflare`. Not Pages, and not
  `@cloudflare/next-on-pages` — that one is edge-runtime only and lags Next releases.
- Images: pre-sized WebP committed to `public/images`. **No Cloudflare R2.** 1,124
  static files that never change do not need object storage, and Keystatic commits
  new uploads to git anyway.

## Commands

```
npm run dev            # localhost:3000, Keystatic at /keystatic in local mode
npm run dc             # compile design files only, no gates. Fast loop.
npm run generate       # full chain: 7 build steps + 8 gates. What CI runs.
npm run build          # next build (prebuild runs generate first)
npm run typecheck
npm run cf:build       # build for Cloudflare Workers
npm run cf:preview     # build for Workers and run it locally
npm run cf:deploy      # build and ship to Cloudflare
npm run mobile:accept  # rebaseline the mobile gate after an intentional change
npm run roadmap        # refresh Notion roadmap data only
```

**`precf:build` is wired to `npm run generate`.** That is the only thing making Cloudflare run
every gate before it deploys. Do not remove it.

## Design system — do not drift from this

Tokens live in `tailwind.config.ts` and `src/app/globals.css`. They come from the
CoachRx Home v7 Claude Design file, which is the visual source of truth.

| Token | Value | Use |
|---|---|---|
| `base` | `#0A0B0F` | page background |
| `band` | `#0C0E14` | lifted band |
| `card` / `card-hi` | `#101118` / `#14151A` | card surface, rest / hover |
| `hairline` | `rgba(255,255,255,.08)` | every border |
| `ink` | `#F8FCFF` | primary text |
| `secondary` / `tertiary` / `body` | 65% / 50% / 82% white | supporting text |
| `accent` | `#58FF7A` | **CTAs and active states only** |

Rules that are easy to break and obvious when broken:

- Green is never used in a headline, as decoration, or as a tag color.
- Two-tone headlines: the second clause drops to 55% white.
- **No monospace anywhere.** It was the single strongest "AI-generated" tell in Casey's review.
  230 usages were removed and `check-system` now fails the build on `var(--font-mono)`.
  Overlines are 11px, `.18em`, uppercase, 50% white, in the sans face. Class `.overline`.
- **The typeface is Mona Sans**, declared in *two* files that must agree:
  `public/design/_ds/colors_and_type.css` and `tailwind.config.ts`. A stale value in either
  leaves elements rendering in a font that no longer exists on the server. Enforced by
  `check-fonts`.
- **Radius scale is 4 / 8 / 12 / 16** for surfaces, 9999 for true circles, and 34 / 44 / 24 / 2
  for drawn device chrome. Nothing else. Max 8 distinct values per page. Enforced by
  `check-system`.
- No pills on rectangles.
- Motion: `cubic-bezier(.22,1,.36,1)`, rise-and-fade **once** at ~15% visibility.
  Nothing rests at opacity 0 and nothing loops.
- Sections blend into the base. No hard seams between sections.
- Article body is a 680px column, 18px/1.75, 82% white. Class `.prose-crx`.

## The eight gates

`npm run generate` runs seven build steps then eight verification gates, and `precf:build`
means Cloudflare runs all of it before every deploy. **Each gate was added after something
shipped broken that no existing check caught.** Full rationale for each is in the header comment
of its own script, and a summary is in `CASEY-START-HERE.md`.

| Gate | Catches |
|---|---|
| `check-runtime` | A compiled design script that throws, killing every animation on a page silently |
| `check-mobile` | Mobile regressions, measured against `src/data/mobile-baseline.json` |
| `check-footer` | Footer drift between pages; the retired oversized wordmark |
| `check-pillars` | Partial pillar renames; em dashes in page metadata |
| `check-system` | Monospace; off-scale corner radii; radius proliferation |
| `check-screens` | Pinned SHA-256 of screenshots containing something retired (RxBot in `calendar.webp`) |
| `check-quotes` | A coach quote that differs between pages, or that names a competitor |
| `check-fonts` | A non-brand typeface in the design system, or a non-woff2 font file |

**Do not weaken a gate to make a build pass.** The two legitimate exceptions:

- `check-mobile` after an intentional mobile change: run `npm run mobile:accept` to rebaseline
  and say so in the commit message.
- `check-screens` when the screenshot has genuinely been retaken: the hash changes and the entry
  stops matching on its own. Never delete the entry to silence it.

## Content model

Frontmatter contract is in `site-migration/CONTENT-MODEL.md`. Every post has
`title, slug, description, date, author, tags[], primaryTag, featuredImage,
readingTime, wordCount, draft, legacyUrl`.

- `primaryTag` must be one of the 10 real topics. `Education`, `Career Development`,
  `Podcasts` and `Features` are **demoted**: they may appear in `tags[]` but they
  never drive a topic page, because a tag covering 60% of the library is not an
  authority claim.
- A topic needs `MIN_POSTS` (3) posts to get an archive page, and every topic page
  needs real intro copy in `src/data/topics.ts`. A bare filtered grid earns nothing.
- The post title is the only `h1`. Body headings start at `h3`.
- Video embeds go through `<YouTube id="..." />`, never a raw iframe.

## Migration facts worth knowing

- 340 posts survived triage from 446. **299 URLs** are 301'd via `src/data/redirects.json`,
  loaded in `next.config.mjs` (source of truth and rationale:
  `../site-migration/redirect-map.csv`, which sits in the project folder, not the repo).
- 22 of those redirects go to a specific replacement article; the rest go to a
  topic archive. Each was reviewed by hand. A wrong specific 301 is worse than a
  correct topic archive, so when in doubt the map points at the topic.
- Squarespace injected promo banners and a footer graphic into post bodies. 358 of
  those were stripped during conversion. If you ever re-run the converter, keep
  `CHROME_IMG` in place.
- RxBot is a **retired product**. It must not appear anywhere on this site. 50
  RxBot-primary posts were cut and 25 incidental mentions stripped from 22 posts.
- Body image alt text is only set where the source filename actually described
  something. Empty alt on a decorative screenshot is correct; a UUID as alt is not.

## Conventions

- `@/*` maps to `src/*`.
- Components are server components unless they need state. Only `/keystatic` is client.
- No `localStorage` in anything rendered server-side.
- Add new routes to `src/app/sitemap.ts`.

## Cloudflare build settings (easy to get wrong)

In the Cloudflare Workers project, the commands must be:

- **Build command:** `npm run cf:build`
- **Deploy command:** `npx opennextjs-cloudflare deploy`

`npm run build` alone is **not** enough. Plain `next build` does not produce
`.open-next/.build/open-next.config.mjs`, and the deploy step fails with
"Could not find compiled Open Next config". `cf:build` runs `next build` internally
and then transforms the output into a Worker, so it replaces the plain build, it
does not run after it.

Harmless noise: `cf:build` prints a wall of `ERROR Failed to copy node_modules/...`
lines for MDX packages and still completes with "Worker saved in `.open-next/worker.js`".
Check for that line rather than trusting the absence of the word ERROR.

## The Worker has no filesystem

This bit the first two deploys. `next build` and `npm run dev` both have a real
filesystem, so code that reads content off disk works perfectly right up until it
is running in a Worker, where it throws:

```
ENOENT: no such file or directory, readdir '/bundle/content/posts'
```

The rules that keep this fixed:

- **Post metadata comes from a generated JSON module**, `src/data/posts.json`,
  written by `scripts/generate-posts.mjs` via the `prebuild` npm script. It is
  gitignored — it is build output, not source. `src/lib/posts.ts` imports it and
  must never use `fs`.
- **Post bodies stay on disk** and are read by `src/lib/body.ts`, which is only
  called while prerendering `/articles/[slug]`. Inlining all 340 bodies into the
  JSON pushed the Worker to **3.03 MB gzipped**, over the 3 MB limit, to carry text
  the Worker never reads. Frontmatter-only is 263 KB.
- If you add a route that lists posts, use `@/lib/posts`. If you add one that needs
  a body, it must be statically generated.

## Prerendered pages come from the incremental cache

`open-next.config.ts` sets `incrementalCache: staticAssetsIncrementalCache`. Without
it, OpenNext tries to render pages on demand in the Worker and everything 500s.

The prerendered output lands in `.open-next/cache/`, which the assets binding cannot
see. `populateCache` copies it to `.open-next/assets/cdn-cgi/_next_cache/`.

- `opennextjs-cloudflare deploy` runs `populateCache` with `target: "remote"` first,
  so **deploys handle this automatically**.
- Bare `wrangler dev` does **not**. Testing that way returns 404 on every SSG route
  and looks like a routing bug. Use `npm run cf:preview`, or run
  `npx opennextjs-cloudflare populateCache local` before `wrangler dev`.

## Page inventory

All 24 routes are compiled from one of the thirteen design files in `design/Pages/`.

| Route | Design file | Notes |
|---|---|---|
| `/` | CoachRx Home | Copy in `src/data/home.ts` |
| `/features` | CoachRx Features | Copy in `src/data/features.ts`. Defines the five pillar anchors every footer links to |
| `/pricing` | CoachRx Pricing | Real tiers recovered from the archived Squarespace page, `src/data/pricing.ts` |
| `/about` | CoachRx About | |
| `/podcasts` | CoachRx Podcasts | Covers in `src/data/podcast-covers.json` |
| `/articles` | CoachRx Blog Index | All 340 posts as rows |
| `/topics/[topic]` | CoachRx Tag Archive | 10 topic pages, one compiled module each |
| `/articles/[slug]` | CoachRx Blog Post | Compiled once with `@@token@@` placeholders, filled per post |
| `/changelog`, `/changelog/[slug]` | CoachRx Changelog, Changelog Entry | 44 releases in `content/changelog/*.mdx` |
| `/roadmap` | CoachRx Roadmap | Built from Notion at build time via `NOTION_TOKEN` |
| `/feature-requests` | CoachRx Updates | |
| 404 | CoachRx 404 | Article count substituted at render |
| `/keystatic` | n/a | The CMS editor. The only client-rendered route |

`/why-coachrx` was removed. Its content was folded into `/features`.

## Headline levels

`TwoTone` renders an `h2` by default. The one headline that says what a page is about
must pass `as="h1"`. Home, Features and Why CoachRx shipped with **zero** h1 tags on
the first pass because of this — check `<h1>` count is exactly 1 on any new page.

## Redirects: 299 rules

`../site-migration/redirect-map.csv` is the source of truth and carries a reason per row.
They emit **301**, not Next's default 308 — Google treats them the same but plenty of
legacy SEO tooling and CDN log analysis only understands 301, so `redirects.json` sets
`statusCode: 301` explicitly rather than `permanent: true`.

Covered: 257 cut articles/videos, 32 retired marketing URLs, the 5 IA collapses,
`/resources`, `/change-log` → `/changelog`, and the Squarespace `/home` and `/404-error`.
Every old marketing URL now resolves. Verified end to end on staging 2026-09-08: 299 rules, all
301, 36 distinct destinations, all 33 testable destinations return 200, and 10 sampled sources
redirect and land on a 200. The heaviest targets are `/topics/program-design-pro-tip` (88 rules)
and `/articles` (72).

Rows whose `cut_reason` starts with **FLAG** are judgment calls Carl should review —
mostly lead-magnet pages and the glossary, which had no replacement built.

## Verifying before you claim it works

A green `next build` proves almost nothing about the deployed Worker. The sequence that
actually catches problems:

```
npm run cf:build
npx opennextjs-cloudflare populateCache local
npx wrangler dev --port 8787 --local
```

then crawl it. Status codes alone are not enough either — the h1 bug and the
`/resources` dead end both returned 200-shaped results. Check internal links resolve,
asset `src` paths exist on disk, one h1 per page, `<title>` and meta description
present, and JSON-LD parses.

Note: this sandbox is ARM and cannot run headless Chrome, so **visual and mobile QA has
to happen in a real browser against the deployed preview.** Do not claim a layout is
correct from markup alone.

## Exact ports: the .dc.html compiler

`/` and `/features` are **not** hand-written React. They are compiled from the Claude
Design files, which are the visual source of truth.

```
design/Pages/CoachRx Home.dc.html  ──scripts/dc-compile.mjs──▶  src/generated/home.ts
                                                                { html, css, script, data }
```

All thirteen design files live in `design/Pages/`. `src/generated/` is **build output and is
gitignored.** Never edit it.

`src/app/page.tsx` is a four-line wrapper around `<DcPage />`. **To change these pages,
edit the design file and re-run `npm run dc`** — never patch the generated output, and
never re-implement a design in JSX. Rebuilding by hand produces something that matches
the design system but is not the design, which is the exact failure mode that made us
abandon Framer.

The compiler handles `<sc-for>`, `<sc-if>`, `{{ }}`, `style-hover` (turned into real
CSS rules) and `onClick`/`onMouseEnter`/`onMouseLeave` (turned into `data-dc-on-*` that
`DcRuntime` binds). It gets the page data by *executing* the file's own `renderVals()`
against a `DCLogic` stub, so data can never drift from the design.

It fails the build if any `{{ }}` or `<sc-*>` survives compilation.

Gotchas that already bit once:
- **cheerio lowercases attribute names**, so match `onclick`, not `onClick`. Matching
  camelCase silently dropped every handler.
- **jsdom cannot parse these files** — it eagerly parses inline `style` and throws on
  some gradient shorthands. Use cheerio.
- Per-item handlers inside `sc-for` compile to a concrete path (`tabs.3.onSelect`) so
  the runtime can resolve them.

Design pages carry their own nav and footer, so they sit **outside** the `(chrome)`
route group. Pages still awaiting an exact port live inside it and get `SiteNav` /
`SiteFooter` from `(chrome)/layout.tsx`.

Design assets live in `public/design/` (`assets/`, `_ds/colors_and_type.css`,
`_ds/fonts/*.ttf`) and are referenced by the compiled markup as `/design/…`.

## Authors: decided, do not re-litigate

All 340 posts are company-authored, so **per-post bylines are not being built.** Every
post carries `author: "CoachRx Team"` and that is the intended end state, not a
placeholder. `src/data/authors.ts` holds the org entity with a real bio; the post
template's author card renders that.

The exception worth doing later is a named expert byline on the 20 or so highest-value
posts (coach spotlights, the framework explainers), because models weight named
credentialed humans when deciding who to cite. That is Carl's call and needs real names
and headshots. Nobody should invent bylines to fill the card.

## Scale claims: all coach-count numbers are banned

Superseded note. There used to be an `8,000+` versus `10,000+` divergence here. **Both are now
banned claims**, along with `20,000+`. None of them could be substantiated.

The one approved line is:

> Thousands of coaches in 40+ countries.

Do not let any other scale number back onto the site, in copy, in metadata or in a design file.
If a count is ever added back it has to come from a query someone can re-run, not from memory.

## The blog is compiled too, with real data injected

`/articles`, `/topics/[topic]`, `/articles/[slug]` and the 404 are exact ports, not
hand-written pages. `scripts/build-blog.mjs` compiles the three blog design templates
with the real 340 posts in place of the design's sample articles:

| Route | Generated module | Approach |
|---|---|---|
| `/articles` | `blog-index.ts` | one page, all 340 posts as rows |
| `/topics/[topic]` | `topic-<slug>.ts` ×9 + `topic-pages.ts` | one compiled page per topic |
| `/articles/[slug]` | `blog-post.ts` | compiled once with `@@token@@` placeholders, filled per post |
| 404 | `notFound.ts` | article count substituted at render |

Post detail uses tokens rather than 340 compiled pages, which would bloat the bundle for
no gain. `src/lib/dc.ts` does the substitution and escaping, and renders the MDX body to
HTML with `marked`. The body lands inside the design's `.crx-body` container, so the
design's own prose CSS styles it — do not add prose styling anywhere else.

**Cards carry no images, deliberately.** Measured across the library: 340 posts share
only 121 distinct pieces of artwork, 256 posts (75%) reuse artwork that appears on
another post, and 32 posts carry the same "Behind the Design" banner. An image grid
showed the same banner thirty times on one topic page. The featured image is still used
for the social share preview and the post-detail hero.

The index is ~1.4 MB of HTML because the design uses per-row inline styles. It gzips to
135 KB. If that becomes a problem, the fix is to hoist repeated inline styles into
classes in the compiler, not to trim the row count — every article link being in the HTML
is what makes the library crawlable without JavaScript.

## Design files link to each other, so the compiler rewrites links

A design file's nav points at `CoachRx Features.dc.html`, and pages that did not exist
when it was designed use `href="#"`. Both are dead links live. `fixLinks()` in the
compiler maps design filenames to routes and resolves `href="#"` by the link's own text.
**Anything it cannot resolve is reported in the build output, never shipped silently** —
check that report after every design change.

Resolved this way: privacy and terms point at opexfit.com (taken from the old Squarespace
footer), "referral program" points at the surviving article, contact and transition-team
links go to `mailto:support@coachrx.app`, and Videos/Podcasts point at the library since
every video-only page was cut in the migration.

Still unresolved and needing Carl: **"Book a demo"** and **"watch the 3-minute demo"** on
the home page. There is no demo page or video.

## Route groups: gone, every page is now a design port

The `(chrome)/` route group and `SiteNav` / `SiteFooter` no longer exist. Every route is
compiled from a design file and carries its own chrome, normalized by the compiler. All 15
route files in `src/app/` are thin wrappers.

Historical note, because it explains the shape of `normalizeNav()`: ported pages used to sit at
the app root while hand-built pages sat in `(chrome)/` and inherited nav and footer from its
layout. Putting a ported page inside `(chrome)` rendered two navs, which happened once with
`/articles`. That whole category of bug is gone now that nothing is hand-built.

## The chrome contract: design files DO own the nav and footer

This reversed on 2026-09-14 and the old instruction is still in circulation, so be clear about
it. Design files **should** contain a real header and footer, built to look like the live site.

`normalizeNav()` harvests the logo, links, Log in, Start for free and burger and rebuilds the
header in canonical order **inheriting the styling from the links in the file**. It only
synthesises a header from scratch when the file gives it nothing (`ctx.navSynthesised`). So
handing it an empty `<nav>` makes it invent link styling, which is strictly worse. It also swaps
the wordmark for the canonical file, builds dropdowns from the route table, injects the mobile
sheet, and normalizes footer columns.

The build corrects drift. It does not replace the design work. Full statement of this is in
`../design-briefs/DESIGN-FILE-CONTRACT.md`, which gets pasted into every Claude Design prompt.

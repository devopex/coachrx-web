# CoachRx Web

Marketing site and article library for CoachRx. Replaces the Squarespace site at
`www.coachrx.app`. Next.js App Router on Cloudflare Workers.

## Stack

- **Next.js 15 App Router** + TypeScript + Tailwind
- **MDX** article bodies in `content/posts/*.mdx`, rendered with `next-mdx-remote/rsc`
- **Keystatic** visual editor at `/keystatic`, commits to git. No CMS bill, no database.
- **Cloudflare Workers** via `@opennextjs/cloudflare`. Not Pages, and not
  `@cloudflare/next-on-pages` — that one is edge-runtime only and lags Next releases.
- Images: pre-sized WebP committed to `public/images`. **No Cloudflare R2.** 1,124
  static files that never change do not need object storage, and Keystatic commits
  new uploads to git anyway.

## Commands

```
npm run dev         # localhost:3000, Keystatic at /keystatic in local mode
npm run build        # next build
npm run typecheck
npm run preview       # build for Workers and run it locally
npm run deploy        # build and ship to Cloudflare
```

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

- Green is never used in a headline, as decoration, or as a tag colour.
- Two-tone headlines: the second clause drops to 55% white.
- Mono overlines: 11px, `.18em`, uppercase, 50% white. Class `.overline`.
- Motion: `cubic-bezier(.22,1,.36,1)`, rise-and-fade **once** at ~15% visibility.
  Nothing rests at opacity 0 and nothing loops.
- Sections blend into the base. No hard seams between sections.
- Article body is a 680px column, 18px/1.75, 82% white. Class `.prose-crx`.

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

- 340 posts survived triage from 446. 265 URLs are 301'd in `next.config.mjs`
  (source of truth and rationale: `site-migration/redirect-map.csv`).
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

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

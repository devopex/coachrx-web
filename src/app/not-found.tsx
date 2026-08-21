import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { ArticleCard } from "@/components/ArticleCard";

/**
 * This page carries more weight than a normal 404: the Squarespace migration
 * retired 266 URLs. Redirect maps are never perfect, so for a while this catches
 * real traffic from search results, old newsletters and other people's links.
 * A recovery page, not a joke page — no mascot, no "oops", no humour. Someone who
 * lost the article they were reading is mildly annoyed and jokes make that worse.
 */
const ROUTES = [
  { label: "Read the articles", href: "/articles", note: "Most dead links here are old article URLs, so this is the likeliest recovery." },
  { label: "See the features", href: "/features", note: "If you were looking at the product rather than the writing." },
  { label: "Start for free", href: "/pricing", note: "If you were partway through signing up, pick it back up here." },
];

export default function NotFound() {
  const recent = getAllPosts().slice(0, 3);
  return (
    <main className="crx-pad mx-auto max-w-shell px-8 pt-[118px]">
      <span className="overline block font-semibold">404</span>
      <h1 className="mt-4 max-w-[760px] text-[clamp(30px,4.2vw,48px)] font-bold leading-[1.1] tracking-[-0.03em] [text-wrap:balance]">
        That page isn&rsquo;t here anymore.{" "}
        <span className="text-white/[0.55]">Here&rsquo;s where it probably went.</span>
      </h1>
      <p className="mt-4.5 max-w-[560px] text-[17px] leading-[1.6] text-white/[0.65] [text-wrap:pretty]">
        We rebuilt this site recently and some old links did not survive the move. These three cover
        almost everything people are looking for.
      </p>

      <div className="crx-routes mt-11 grid gap-[18px] md:grid-cols-3">
        {ROUTES.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="crx-card flex flex-col rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 text-inherit"
          >
            <span className="font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.45]">
              {r.label}
            </span>
            <span className="mt-3 text-[15px] leading-[1.55] text-white/[0.65]">{r.note}</span>
            <span className="mt-5 text-[14px] font-medium text-accent">Go &rarr;</span>
          </Link>
        ))}
      </div>

      {/* Recent posts rather than a search box: a query that returns nothing is a
          second dead end, and recent posts always resolve to something real. */}
      <section className="mt-[76px] pb-32">
        <span className="overline">Recent articles</span>
        <div className="crx-grid mt-6">
          {recent.map((p) => <ArticleCard key={p.slug} post={p} />)}
        </div>
      </section>
    </main>
  );
}

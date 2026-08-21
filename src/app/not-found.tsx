import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

/**
 * This page matters more than a normal 404: the Squarespace migration retired
 * 265 URLs. Redirect maps are never perfect, so for a while this catches real
 * traffic from search results, old newsletters and other people's links.
 * Treat it as a recovery page, not a joke page.
 */
const ROUTES = [
  { label: "Read the articles", href: "/articles", note: "Most dead links here are old article URLs." },
  { label: "See the features", href: "/features", note: "What CoachRx does, by coaching workflow." },
  { label: "Start for free", href: "/pricing", note: "Pick up where you left off." },
];

export default function NotFound() {
  const recent = getAllPosts().slice(0, 3);
  return (
    <main className="mx-auto max-w-[1100px] px-8 pb-32 pt-[104px]">
      <div className="overline">404</div>
      <h1 className="mt-4 text-[40px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[48px]">
        That page isn&rsquo;t here anymore.{" "}
        <span className="text-white/[0.55]">Here is where it probably went.</span>
      </h1>
      <p className="mt-5 max-w-xl text-[18px] text-secondary">
        We rebuilt the site recently and some old links did not survive the move. These three routes cover most of what people are looking for.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {ROUTES.map((r) => (
          <Link key={r.href} href={r.href}
            className="group rounded-xl border border-hairline bg-card p-6 transition-all duration-500 ease-crx hover:-translate-y-[3px] hover:border-white/[0.12]">
            <div className="overline">{r.label}</div>
            <p className="mt-3 text-[15px] text-secondary">{r.note}</p>
            <span className="mt-4 inline-block text-[15px] text-ink">Go &rarr;</span>
          </Link>
        ))}
      </div>

      <section className="mt-24">
        <div className="overline">Recent articles</div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {recent.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      </section>
    </main>
  );
}

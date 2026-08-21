import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import { PostCard } from "@/components/PostCard";

/**
 * PLACEHOLDER. The real home page is the CoachRx Home v7 Claude Design file,
 * which converts to React section components under src/components/home/.
 * Until that port lands this keeps the route valid and the build green.
 */
export default function Home() {
  const recent = getAllPosts().slice(0, 3);
  return (
    <main className="mx-auto max-w-shell px-6 pb-32 pt-[140px]">
      <div className="overline">CoachRx</div>
      <h1 className="mt-4 max-w-3xl text-[48px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[64px]">
        Coaching software for coaches who{" "}
        <span className="text-white/[0.55]">design for one person at a time.</span>
      </h1>
      <div className="mt-10 flex gap-4">
        <Link href="/pricing" className="rounded-full bg-accent px-6 py-3 text-[15px] font-medium text-base">
          Start for free
        </Link>
        <Link href="/features" className="rounded-full border border-hairline px-6 py-3 text-[15px] text-ink hover:border-white/[0.12]">
          See the features
        </Link>
      </div>
      <section className="mt-28">
        <div className="overline">Latest</div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {recent.map((p) => <PostCard key={p.slug} post={p} />)}
        </div>
      </section>
    </main>
  );
}

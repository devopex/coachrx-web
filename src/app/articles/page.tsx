import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { TOPICS } from "@/data/topics";
import { PostCard } from "@/components/PostCard";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Articles",
  description: "Program design, coaching frameworks, and the business of coaching, written down.",
  alternates: { canonical: "/articles" },
};

export default function ArticlesIndex() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;
  return (
    <main className="mx-auto max-w-shell px-6 pb-32 pt-[140px]">
      <div className="overline">Articles</div>
      <h1 className="mt-4 max-w-2xl text-[44px] font-semibold leading-[1.1] tracking-[-0.02em] md:text-[56px]">
        Coaching,{" "}<span className="text-white/[0.55]">written down.</span>
      </h1>
      <p className="mt-5 max-w-xl text-[18px] text-secondary">
        {posts.length} articles on individual program design, assessment, and building a coaching practice.
      </p>

      <nav className="mt-10 flex gap-2 overflow-x-auto pb-2" aria-label="Topics">
        {TOPICS.map((t) => (
          <Link key={t.slug} href={`/topics/${t.slug}`}
            className="whitespace-nowrap rounded-full border border-hairline px-4 py-2 text-[13px] text-tertiary transition-colors hover:border-white/[0.12] hover:text-ink">
            {t.title}
          </Link>
        ))}
      </nav>

      {featured ? (
        <div className="mt-12"><PostCard post={featured} /></div>
      ) : null}
      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {rest.slice(0, 14).map((p) => <PostCard key={p.slug} post={p} />)}
      </div>
    </main>
  );
}

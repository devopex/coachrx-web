import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";
import { FeaturedCard } from "@/components/ArticleCard";
import { PostGrid } from "@/components/PostGrid";
import { TagChips } from "@/components/TagChips";
import { ClosingCTA } from "@/components/ClosingCTA";

export const metadata: Metadata = {
  title: "Articles",
  description:
    "Program design, assessment, retention, and the business of coaching. Written by coaches who design for one person at a time.",
  alternates: { canonical: "/articles" },
};

export default function ArticlesIndex() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  return (
    <main>
      <header className="crx-pad mx-auto max-w-shell px-8 pt-[118px]">
        <span className="overline block font-semibold">Articles</span>
        <h1 className="mt-4 text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
          Coaching, written down.{" "}
          <span className="text-white/[0.55]">{posts.length} articles and counting.</span>
        </h1>
        <p className="mt-4 max-w-[600px] text-[16.5px] leading-[1.6] text-white/[0.65]">
          Program design, assessment, retention, and the business of coaching, from coaches who work
          with one client at a time.
        </p>
      </header>

      <TagChips />

      {featured ? (
        <div className="crx-pad mx-auto mt-11 max-w-shell px-8">
          <FeaturedCard post={featured} />
        </div>
      ) : null}

      <div className="crx-pad mx-auto mt-11 max-w-shell px-8">
        <PostGrid posts={rest} />
      </div>

      <ClosingCTA />
    </main>
  );
}

"use client";
import { useState } from "react";
import type { Post } from "@/lib/posts";
import { ArticleCard } from "@/components/ArticleCard";

const BATCH = 15;

/**
 * Load-more rather than numbered pages or infinite scroll. With 340 posts,
 * numbered pagination buries post 200 four clicks deep, and infinite scroll makes
 * the footer unreachable and hurts crawling.
 */
export function PostGrid({ posts }: { posts: Post[] }) {
  const [shown, setShown] = useState(BATCH);
  const visible = posts.slice(0, shown);
  const left = posts.length - visible.length;

  return (
    <>
      <div className="crx-grid">
        {visible.map((p) => <ArticleCard key={p.slug} post={p} />)}
      </div>
      {left > 0 ? (
        <div className="mt-11 flex flex-col items-center gap-3.5">
          <button type="button" className="crx-more" onClick={() => setShown((s) => s + BATCH)}>
            Load more articles
          </button>
          <span className="text-[13px] text-white/[0.4]">
            Showing {visible.length} of {posts.length}
          </span>
        </div>
      ) : null}
    </>
  );
}

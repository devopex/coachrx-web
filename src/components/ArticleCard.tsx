import Link from "next/link";
import type { Post } from "@/lib/posts";

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Grid card. Spec transcribed from the Blog Index design file. */
export function ArticleCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/articles/${post.slug}`}
      className="crx-card flex flex-col overflow-hidden rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] text-inherit"
    >
      <div className="relative aspect-video overflow-hidden border-b border-white/[0.07] bg-card">
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.featuredImageAlt || ""}
            loading="lazy"
            className="crx-shot absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col gap-2.5 p-5">
        <span className="font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.45]">
          {post.primaryTag}
        </span>
        <span className="crx-clamp3 text-[19px] font-semibold leading-[1.32] tracking-[-0.012em] text-ink">
          {post.title}
        </span>
        <span className="crx-clamp2 text-[14px] leading-[1.55] text-white/[0.6]">{post.description}</span>
        <span className="mt-0.5 text-[13px] text-white/[0.45]">{fmt(post.date)}</span>
      </div>
    </Link>
  );
}

/** The "start here" card at the top of the index. Wider image, larger type. */
export function FeaturedCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/articles/${post.slug}`}
      className="crx-card crx-feat overflow-hidden rounded-2xl border border-hairline bg-gradient-to-b from-white/[0.035] to-white/[0.01] text-inherit"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-card">
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.featuredImageAlt || ""}
            className="crx-shot absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="flex flex-col justify-center gap-3.5 px-10 py-11">
        <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-white/[0.5]">
          Start here · {post.primaryTag}
        </span>
        <span className="text-[28px] font-bold leading-[1.18] tracking-[-0.02em] text-ink">{post.title}</span>
        <span className="text-[15.5px] leading-[1.6] text-white/[0.65]">{post.description}</span>
        <span className="text-[13px] text-white/[0.45]">{fmt(post.date)}</span>
      </div>
    </Link>
  );
}

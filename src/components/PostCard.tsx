import Link from "next/link";
import type { Post } from "@/lib/posts";

/** One card language across the blog index, topic archives and related posts. */
export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/articles/${post.slug}`}
      className="group block rounded-xl border border-hairline bg-card transition-all duration-500 ease-crx hover:-translate-y-[3px] hover:border-white/[0.12] hover:bg-card-hi"
    >
      <div className="aspect-video overflow-hidden rounded-t-xl">
        {post.featuredImage ? (
          <img
            src={post.featuredImage}
            alt={post.featuredImageAlt || ""}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-crx group-hover:scale-[1.03]"
          />
        ) : null}
      </div>
      <div className="p-5">
        <div className="overline">{post.primaryTag}</div>
        <h3 className="mt-2 line-clamp-3 text-[19px] font-semibold leading-snug text-ink">{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-secondary">{post.description}</p>
        <div className="mt-4 text-[13px] text-tertiary">
          {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
    </Link>
  );
}

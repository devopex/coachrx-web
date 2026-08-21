import Link from "next/link";
import type { Post } from "@/lib/posts";

/** Card spec from the design file: 14px radius, hairline border, 20px grid gap. */
export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/articles/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-[14px] border border-hairline bg-card transition-all duration-500 ease-crx hover:-translate-y-[3px] hover:border-white/[0.12] hover:bg-card-hi">
      <div className="aspect-video overflow-hidden">
        {post.featuredImage ? (
          <img src={post.featuredImage} alt={post.featuredImageAlt || ""} loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-crx group-hover:scale-[1.03]" />
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="overline">{post.primaryTag}</div>
        <h3 className="mt-2.5 line-clamp-3 text-[19px] font-semibold leading-[1.3] tracking-[-0.01em] text-ink">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-[14.5px] leading-relaxed text-white/[0.6]">{post.description}</p>
        <div className="mt-4 text-[13px] text-white/[0.45]">
          {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>
    </Link>
  );
}

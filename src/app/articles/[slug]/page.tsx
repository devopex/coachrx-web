import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPost, getRelated } from "@/lib/posts";
import { getPostBody } from "@/lib/body";
import { getAuthor } from "@/data/authors";
import { topicByTag } from "@/data/topics";
import { PostCard } from "@/components/PostCard";
import { AuthorCard } from "@/components/AuthorCard";
import { ClosingCTA } from "@/components/ClosingCTA";
import { YouTube } from "@/components/YouTube";

export const dynamicParams = false;
export const generateStaticParams = async () => getAllPosts().map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/articles/${post.slug}` },
    openGraph: {
      title: post.title, description: post.description, type: "article",
      publishedTime: post.date, modifiedTime: post.updated || post.date,
      images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const related = getRelated(post);
  const topic = topicByTag(post.primaryTag);
  const author = getAuthor(post.author);
  const dateLong = new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: post.title, description: post.description,
    datePublished: post.date, dateModified: post.updated || post.date,
    author: { "@type": author.name === "CoachRx Team" ? "Organization" : "Person", name: author.name },
    publisher: { "@type": "Organization", name: "CoachRx", url: "https://www.coachrx.app" },
    image: post.featuredImage ? [`https://www.coachrx.app${post.featuredImage}`] : [],
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.coachrx.app/articles/${post.slug}` },
    wordCount: post.wordCount, articleSection: post.primaryTag,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="pt-[104px]">
        {/* 680px column, 32px gutters — .crx-col in the design file */}
        <header className="crx-col mx-auto max-w-[680px] px-8">
          {topic ? (
            <Link href={`/topics/${topic.slug}`} className="overline inline-block font-semibold hover:text-ink">
              {post.primaryTag}
            </Link>
          ) : (
            <span className="overline inline-block font-semibold">{post.primaryTag}</span>
          )}
          <h1 className="mt-4 text-[clamp(30px,4vw,44px)] font-bold leading-[1.15] tracking-[-0.025em] text-ink [text-wrap:balance]">
            {post.title}
          </h1>
          <div className="mt-[18px] flex flex-wrap items-center gap-2 text-[13px] text-white/[0.55]">
            <span>{author.name}</span>
            <span className="text-white/30">·</span>
            <time dateTime={post.date}>{dateLong}</time>
            <span className="text-white/30">·</span>
            <span>{post.readingTime} min read</span>
          </div>
          <p className="mt-[26px] text-[19px] leading-[1.6] text-white/[0.75] [text-wrap:pretty]">
            {post.description}
          </p>
        </header>

        {post.featuredImage ? (
          <div className="crx-col mx-auto mt-9 max-w-[680px] px-8">
            <figure className="m-0">
              <img src={post.featuredImage} alt={post.featuredImageAlt || ""}
                className="w-full rounded-xl border border-hairline" />
            </figure>
          </div>
        ) : null}

        <div className="crx-col prose-crx mx-auto mt-2 max-w-[680px] px-8">
          <MDXRemote source={getPostBody(post.slug)} components={{ YouTube }} />
        </div>

        <div className="crx-col mx-auto mt-16 max-w-[680px] px-8">
          <AuthorCard author={post.author} />
        </div>

        {related.length ? (
          <div className="mx-auto max-w-[1100px] px-8 pt-[88px]">
            <span className="overline">Keep reading</span>
            <div className="crx-related mt-[22px] grid gap-5 md:grid-cols-3">
              {related.map((r) => <PostCard key={r.slug} post={r} />)}
            </div>
          </div>
        ) : null}

        <ClosingCTA />
      </article>
    </>
  );
}

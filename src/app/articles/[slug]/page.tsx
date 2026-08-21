import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllPosts, getPost, getRelated } from "@/lib/posts";
import { topicByTag } from "@/data/topics";
import { PostCard } from "@/components/PostCard";
import { YouTube } from "@/components/YouTube";

export const dynamicParams = false;
export const generateStaticParams = async () =>
  getAllPosts().map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/articles/${post.slug}` },
    openGraph: {
      title: post.title, description: post.description, type: "article",
      publishedTime: post.date, images: post.featuredImage ? [post.featuredImage] : [],
    },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug);
  if (!post) notFound();
  const related = getRelated(post);
  const topic = topicByTag(post.primaryTag);

  const jsonLd = {
    "@context": "https://schema.org", "@type": "Article",
    headline: post.title, description: post.description,
    datePublished: post.date, dateModified: post.updated || post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: { "@type": "Organization", name: "CoachRx", url: "https://www.coachrx.app" },
    image: post.featuredImage ? [`https://www.coachrx.app${post.featuredImage}`] : [],
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.coachrx.app/articles/${post.slug}` },
    wordCount: post.wordCount,
  };

  return (
    <article className="pb-32">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="mx-auto max-w-prose px-6 pt-[140px]">
        {topic ? (
          <Link href={`/topics/${topic.slug}`} className="overline hover:text-ink">{post.primaryTag}</Link>
        ) : (
          <span className="overline">{post.primaryTag}</span>
        )}
        <h1 className="mt-4 text-[40px] font-semibold leading-[1.15] tracking-[-0.02em] md:text-[48px]">
          {post.title}
        </h1>
        <p className="mt-5 text-[19px] leading-relaxed text-secondary">{post.description}</p>
        <div className="mt-6 flex items-center gap-3 text-[13px] text-tertiary">
          <span>{post.author}</span><span aria-hidden>·</span>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </time>
          <span aria-hidden>·</span><span>{post.readingTime} min read</span>
        </div>
      </header>

      {post.featuredImage ? (
        <div className="mx-auto mt-12 max-w-shell px-6">
          <img src={post.featuredImage} alt={post.featuredImageAlt || ""}
               className="w-full rounded-2xl border border-hairline" />
        </div>
      ) : null}

      <div className="prose-crx mx-auto mt-14 px-6">
        <MDXRemote source={post.body} components={{ YouTube }} />
      </div>

      {related.length ? (
        <section className="mx-auto mt-28 max-w-shell px-6">
          <div className="overline">Keep reading</div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {related.map((r) => <PostCard key={r.slug} post={r} />)}
          </div>
        </section>
      ) : null}
    </article>
  );
}

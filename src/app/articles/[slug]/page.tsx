import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { html, css, script } from "@/generated/blog-post";
import { DcPage } from "@/components/DcPage";
import { getAllPosts, getPost, getRelated } from "@/lib/posts";
import { getPostBody } from "@/lib/body";
import { getAuthor } from "@/data/authors";
import { topicByTag } from "@/data/topics";
import { fill, renderBody } from "@/lib/dc";

/**
 * Exact port of "CoachRx Blog Post.dc.html". The design is compiled once with
 * @@token@@ placeholders and filled per post here, rather than compiling 340 copies.
 */
export const dynamicParams = false;
export const generateStaticParams = async () => getAllPosts().map((p) => ({ slug: p.slug }));

const longDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const initials = (tag: string) =>
  tag.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "CR";

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

  const author = getAuthor(post.author);
  const topic = topicByTag(post.primaryTag);
  const related = getRelated(post);

  const values: Record<string, string> = {
    tag: post.primaryTag,
    tagHref: topic ? `/topics/${topic.slug}` : "/articles",
    title: post.title,
    author: author.name,
    date: longDate(post.date),
    readingTime: `${post.readingTime} min read`,
    lede: post.description,
    img: post.featuredImage,
    alt: post.featuredImageAlt || "",
    authorName: author.name,
    authorRole: author.role,
    authorBio: author.bio,
    authorInitials: initials(author.name),
    BODY: renderBody(getPostBody(post.slug)),
  };

  // The design shows exactly three related posts. Blank out any slot we cannot fill
  // rather than leaving a token visible.
  for (let i = 0; i < 3; i++) {
    const r = related[i];
    values[`rel${i}Tag`] = r ? r.primaryTag : "";
    values[`rel${i}Title`] = r ? r.title : "";
    values[`rel${i}Date`] = r ? longDate(r.date) : "";
    values[`rel${i}Initials`] = r ? initials(r.primaryTag) : "";
    values[`rel${i}Href`] = r ? `/articles/${r.slug}` : "/articles";
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    author: { "@type": "Organization", name: author.name },
    publisher: { "@type": "Organization", name: "CoachRx", url: "https://www.coachrx.app" },
    image: post.featuredImage ? [`https://www.coachrx.app${post.featuredImage}`] : [],
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.coachrx.app/articles/${post.slug}` },
    wordCount: post.wordCount,
    articleSection: post.primaryTag,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DcPage html={fill(html, values, ["BODY"])} css={css} script={script} />
    </>
  );
}

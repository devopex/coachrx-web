import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TOPIC_PAGES } from "@/generated/topic-pages";
import { TOPICS, topicBySlug } from "@/data/topics";
import { DcPage } from "@/components/DcPage";
import { getPostsByTag } from "@/lib/posts";

/** Exact port of "CoachRx Tag Archive.dc.html", one compiled page per topic. */
export const dynamicParams = false;
export const generateStaticParams = async () => TOPICS.map((t) => ({ topic: t.slug }));

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const t = topicBySlug((await params).topic);
  if (!t) return {};
  return {
    title: t.title,
    description: t.intro.slice(0, 155),
    alternates: { canonical: `/topics/${t.slug}` },
  };
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const slug = (await params).topic;
  const t = topicBySlug(slug);
  const page = TOPIC_PAGES[slug];
  if (!t || !page) notFound();

  const posts = getPostsByTag(t.tag);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t.title,
    description: t.intro,
    url: `https://www.coachrx.app/topics/${t.slug}`,
    hasPart: posts.slice(0, 20).map((p) => ({
      "@type": "Article",
      headline: p.title,
      url: `https://www.coachrx.app/articles/${p.slug}`,
      datePublished: p.date,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <DcPage html={page.html} css={page.css} script={page.script} />
    </>
  );
}

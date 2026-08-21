import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostsByTag } from "@/lib/posts";
import { TOPICS, topicBySlug } from "@/data/topics";
import { ArticleCard } from "@/components/ArticleCard";
import { PostGrid } from "@/components/PostGrid";
import { TagChips } from "@/components/TagChips";
import { ClosingCTA } from "@/components/ClosingCTA";

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
  const t = topicBySlug((await params).topic);
  if (!t) notFound();
  const posts = getPostsByTag(t.tag);

  // A three-post grid at three-up reads as broken. Below eight, go two-up.
  const small = posts.length < 8;

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
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <header className="crx-pad mx-auto max-w-shell px-8 pt-[118px]">
        <span className="overline block font-semibold">Topic</span>
        <h1 className="mt-4 text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.08] tracking-[-0.03em] text-ink">
          {t.title}
        </h1>
        {/* Required editorial copy. A bare filtered grid earns nothing from crawlers or models. */}
        <p className="mt-5 max-w-prose text-[18px] leading-[1.68] text-white/[0.75] [text-wrap:pretty]">
          {t.intro}
        </p>
        <div className="mt-4 text-[13px] text-white/[0.45]">{posts.length} articles</div>
      </header>

      <TagChips activeSlug={t.slug} />

      <div className="crx-pad mx-auto mt-11 max-w-shell px-8">
        {small ? (
          <div className="grid gap-[22px] md:grid-cols-2">
            {posts.map((p) => <ArticleCard key={p.slug} post={p} />)}
          </div>
        ) : (
          <PostGrid posts={posts} />
        )}
      </div>

      <section className="crx-pad mx-auto mt-24 max-w-shell border-t border-hairline px-8 pt-8">
        <span className="overline">Related topics</span>
        <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2">
          {TOPICS.filter((x) => x.slug !== t.slug).slice(0, 4).map((x) => (
            <Link key={x.slug} href={`/topics/${x.slug}`} className="text-[15px] text-white/[0.62] hover:text-ink">
              {x.title}
            </Link>
          ))}
        </div>
      </section>

      <ClosingCTA />
    </main>
  );
}

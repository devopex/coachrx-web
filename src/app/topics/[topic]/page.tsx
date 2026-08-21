import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getPostsByTag } from "@/lib/posts";
import { TOPICS, topicBySlug } from "@/data/topics";
import { PostCard } from "@/components/PostCard";

export const dynamicParams = false;
export const generateStaticParams = async () => TOPICS.map((t) => ({ topic: t.slug }));

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
  const t = topicBySlug((await params).topic);
  if (!t) return {};
  return { title: t.title, description: t.intro.slice(0, 155),
           alternates: { canonical: `/topics/${t.slug}` } };
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const t = topicBySlug((await params).topic);
  if (!t) notFound();
  const posts = getPostsByTag(t.tag);
  const wide = posts.length < 8;

  return (
    <main className="mx-auto max-w-shell px-6 pb-32 pt-[140px]">
      <div className="overline">Topic</div>
      <h1 className="mt-4 text-[44px] font-semibold leading-[1.1] tracking-[-0.02em]">{t.title}</h1>
      <p className="mt-6 max-w-prose text-[18px] leading-relaxed text-body">{t.intro}</p>
      <div className="mt-4 text-[13px] text-tertiary">{posts.length} articles</div>

      <div className={`mt-12 grid gap-6 ${wide ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`}>
        {posts.map((p) => <PostCard key={p.slug} post={p} />)}
      </div>

      <section className="mt-24 border-t border-hairline pt-8">
        <div className="overline">Related topics</div>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
          {TOPICS.filter((x) => x.slug !== t.slug).slice(0, 4).map((x) => (
            <Link key={x.slug} href={`/topics/${x.slug}`} className="text-[15px] text-secondary hover:text-ink">
              {x.title}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

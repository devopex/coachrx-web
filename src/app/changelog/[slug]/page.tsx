import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getRelease, getReleases } from "@/lib/changelog";
import { Shell } from "@/components/Section";
import { ClosingCTA } from "@/components/ClosingCTA";

export const dynamicParams = false;
export const generateStaticParams = async () => getReleases().map((r) => ({ slug: r.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const r = getRelease((await params).slug);
  if (!r) return {};
  return {
    title: r.title,
    description: r.description,
    alternates: { canonical: `/changelog/${r.slug}` },
  };
}

export default async function ReleasePage({ params }: { params: Promise<{ slug: string }> }) {
  const r = getRelease((await params).slug);
  if (!r) notFound();
  const all = getReleases();
  const i = all.findIndex((x) => x.slug === r.slug);
  const newer = all[i - 1];
  const older = all[i + 1];

  return (
    <main className="pb-24">
      <article className="pt-[104px]">
        <header className="crx-col mx-auto max-w-prose px-8">
          <Link href="/changelog" className="overline inline-block font-semibold hover:text-ink">
            Changelog
          </Link>
          <h1 className="mt-4 text-[clamp(30px,4vw,44px)] font-bold leading-[1.15] tracking-[-0.025em] text-ink">
            {r.title}
          </h1>
          <time dateTime={r.date} className="mt-4 block text-[13px] text-white/[0.55]">
            {new Date(r.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </time>
        </header>

        <div className="crx-col prose-crx mx-auto mt-10 max-w-prose px-8">
          <MDXRemote source={r.body} />
        </div>

        <nav className="crx-col mx-auto mt-16 flex max-w-prose justify-between gap-6 border-t border-hairline px-8 pt-6 text-[14px]">
          {older ? (
            <Link href={`/changelog/${older.slug}`} className="text-white/[0.6] hover:text-ink">
              &larr; {older.title}
            </Link>
          ) : <span />}
          {newer ? (
            <Link href={`/changelog/${newer.slug}`} className="text-white/[0.6] hover:text-ink">
              {newer.title} &rarr;
            </Link>
          ) : <span />}
        </nav>
      </article>
      <ClosingCTA />
    </main>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import * as entry from "@/generated/changelog-entry";
import * as entryLatest from "@/generated/changelog-entry-latest";
import { DcPage } from "@/components/DcPage";
import { getReleases } from "@/lib/changelog";
import { fill, renderBody } from "@/lib/dc";

/**
 * Exact port of "CoachRx Changelog Entry.dc.html".
 *
 * TWO compiled variants, not one. The design gates its Next link on `hasNext` / `isLatest`,
 * and sc-if resolves at COMPILE time, so a single template cannot serve both the newest release
 * (no Next link, a disabled placeholder instead) and the other 43. build-changelog.mjs emits
 * both and this picks per release.
 *
 * Releases are ordered newest first, so "previous" is the older neighbour at index + 1.
 */
export const dynamicParams = false;

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const monthName = (d: string) => `${MONTHS[parseInt(d.slice(5, 7), 10) - 1]} ${d.slice(0, 4)}`;
const longDate = (d: string) =>
  `${MONTHS[parseInt(d.slice(5, 7), 10) - 1].slice(0, 3).toUpperCase()} ${parseInt(d.slice(8, 10), 10)}, ${d.slice(0, 4)}`;

const ordered = () => getReleases().filter((r) => !r.draft);

export const generateStaticParams = async () => ordered().map((r) => ({ slug: r.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const release = ordered().find((r) => r.slug === slug);
  if (!release) return {};
  const title = `${monthName(release.date)} release`;
  return {
    title,
    description: release.description,
    alternates: { canonical: `/changelog/${release.slug}` },
    openGraph: { title, description: release.description, type: "article", publishedTime: release.date },
  };
}

export default async function ChangelogEntry({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const all = ordered();
  const i = all.findIndex((r) => r.slug === slug);
  if (i === -1) notFound();

  const release = all[i];
  const prev = all[i + 1];
  const next = all[i - 1];
  const isLatest = i === 0;
  const tpl = isLatest ? entryLatest : entry;

  const values: Record<string, string> = {
    month: monthName(release.date),
    dateLabel: longDate(release.date),
    description: release.description,
    BODY: renderBody(release.body),
    // The oldest release has no previous neighbour. The design always renders the Previous
    // slot, so point it back at the index rather than leaving a link to nowhere.
    prevMonth: prev ? monthName(prev.date) : "All releases",
    prevHref: prev ? `/changelog/${prev.slug}` : "/changelog",
    nextMonth: next ? monthName(next.date) : "",
    nextHref: next ? `/changelog/${next.slug}` : "/changelog",
  };

  return <DcPage html={fill(tpl.html, values, ["BODY"])} css={tpl.css} script={tpl.script} />;
}

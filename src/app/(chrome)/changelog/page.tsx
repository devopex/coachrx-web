import Link from "next/link";
import type { Metadata } from "next";
import { getReleases } from "@/lib/changelog";
import { Shell } from "@/components/Section";
import { ClosingCTA } from "@/components/ClosingCTA";

export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Every CoachRx release since 2021. What shipped, month by month, organized the way you coach.",
  alternates: { canonical: "/changelog" },
};

export default function ChangelogIndex() {
  const releases = getReleases();
  const [latest, ...rest] = releases;

  return (
    <main>
      <Shell className="pt-[118px]">
        <span className="overline block font-semibold">Changelog</span>
        <h1 className="mt-4 text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
          What shipped.{" "}
          <span className="text-white/[0.55]">{releases.length} releases and counting.</span>
        </h1>
        <p className="mt-4 max-w-[620px] text-[16.5px] leading-[1.6] text-white/[0.65]">
          Every month your coaching platform gets a little sharper. This is the record of it, from{" "}
          {releases[releases.length - 1]?.date.slice(0, 4)} to today.
        </p>
      </Shell>

      {latest ? (
        <Shell className="mt-11">
          <Link
            href={`/changelog/${latest.slug}`}
            className="crx-card block rounded-2xl border border-hairline bg-gradient-to-b from-white/[0.035] to-white/[0.01] p-8 text-inherit"
          >
            <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-accent">
              Latest release
            </span>
            <h2 className="mt-3 text-[28px] font-bold leading-[1.18] tracking-[-0.02em] text-ink">
              {latest.title}
            </h2>
            <p className="mt-3 max-w-prose text-[15.5px] leading-[1.6] text-white/[0.65]">
              {latest.description}
            </p>
            <span className="mt-5 inline-block text-[14px] font-medium text-accent">
              Read what shipped &rsaquo;
            </span>
          </Link>
        </Shell>
      ) : null}

      <Shell className="mt-11 pb-8">
        <span className="overline">Earlier releases</span>
        <div className="mt-6 divide-y divide-white/[0.08] border-y border-hairline">
          {rest.map((r) => (
            <Link
              key={r.slug}
              href={`/changelog/${r.slug}`}
              className="group flex flex-col gap-1.5 py-5 md:flex-row md:items-baseline md:gap-6"
            >
              <span className="w-[150px] flex-none font-mono text-[10.5px] uppercase tracking-[.16em] text-white/[0.4]">
                {new Date(r.date).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </span>
              <span className="flex-1">
                <span className="block text-[16.5px] font-medium text-ink group-hover:text-accent">
                  {r.title}
                </span>
                <span className="crx-clamp2 mt-1 block text-[14.5px] leading-[1.55] text-white/[0.55]">
                  {r.description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Shell>

      <ClosingCTA />
    </main>
  );
}

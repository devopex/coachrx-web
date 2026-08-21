import Link from "next/link";
import type { Metadata } from "next";
import { COMPARISON, LOOP, PILLARS } from "@/data/features";
import { Shell, TwoTone } from "@/components/Section";
import { ClosingCTA } from "@/components/ClosingCTA";

/**
 * Built from copy already approved in the Features design (the comparison table and
 * the system loop) plus real attributed testimonials pulled from the archive.
 *
 * The legacy Squarespace /why-coachrx page was a long-form SEO piece in an older
 * voice (and contained a "CoahRx" typo). It is preserved in
 * site-migration/archive/why-coachrx.html.gz if Carl wants any of it brought over.
 */
export const metadata: Metadata = {
  title: "Why CoachRx",
  description:
    "Most coaching platforms were built to send workouts and take payments. CoachRx was built for the whole job: assessment, consultation, design, operations, and the client app.",
  alternates: { canonical: "/why-coachrx" },
};

const QUOTES = [
  {
    text: "I cringe thinking about the time I wasted using Google sheets to keep track of my clients programs or not tracking at all. Totally unprofessional in retrospect. Not to mention the awkwardness of chasing Venmo payments every month.",
    who: "Coach Georgia Smith",
  },
  {
    text: "A coaching app for the professional coach. This has everything I need to program holistic performance, resiliency, and behaviors for my clients. It's the platform I've been searching for!",
    who: "Coach Ben Seims",
  },
  {
    text: "CoachRx has drastically improved my program design efficiency. I primarily work with new and returning gym goers so being able to periodize and set cycle priorities through both long and short term planning has made programming straight forward.",
    who: "Kyle Krancher, Train and Able",
  },
  {
    text: "I have been able to increase my client roster by 30% because of the time and efficiency within CoachRx.",
    who: "Coach Dakota Zook",
  },
];

export default function WhyCoachRxPage() {
  return (
    <main>
      <Shell className="pt-[118px]">
        <span className="overline block font-semibold">Why CoachRx</span>
        <TwoTone as="h1" parts={COMPARISON.headline} className="mt-4 max-w-[900px] text-[clamp(34px,5vw,58px)]" />
        <p className="mt-5 max-w-[640px] text-[17.5px] leading-[1.6] text-white/[0.7]">{COMPARISON.lede}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/pricing" className="rounded-full bg-gradient-to-b from-[#7BFF96] to-accent px-6 py-3 text-[14px] font-bold text-base">
            Start for free
          </Link>
          <Link href="/features" className="rounded-full border border-hairline px-6 py-3 text-[14px] text-ink hover:border-white/[0.12]">
            See every feature
          </Link>
        </div>
      </Shell>

      {/* The comparison is the argument. Lead with it. */}
      <Shell className="pt-[88px]">
        <div className="overflow-hidden rounded-2xl border border-hairline">
          <div className="grid grid-cols-[1.1fr_1fr_1.4fr] border-b border-hairline bg-white/[0.02]">
            <div className="p-4 font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.4]">Capability</div>
            <div className="p-4 font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.4]">{COMPARISON.colThem}</div>
            <div className="p-4 font-mono text-[10px] uppercase tracking-[.16em] text-accent">{COMPARISON.colUs}</div>
          </div>
          {COMPARISON.rows.map(([cap, them, us]) => (
            <div key={cap} className="grid grid-cols-[1.1fr_1fr_1.4fr] border-b border-hairline last:border-0">
              <div className="p-4 text-[14.5px] font-medium text-ink">{cap}</div>
              <div className="p-4 text-[14px] text-white/[0.45]">{them}</div>
              <div className="p-4 text-[14px] text-white/[0.8]">{us}</div>
            </div>
          ))}
        </div>
      </Shell>

      {/* The loop: why the connections matter more than the feature list */}
      <section className="mt-[104px] bg-[linear-gradient(180deg,#0A0B0F_0%,#0B0E19_45%,#0A0B0F_100%)] py-24">
        <Shell>
          <TwoTone parts={LOOP.headline} className="text-[clamp(28px,3.6vw,44px)]" />
          <p className="mt-5 max-w-[620px] text-[17px] leading-[1.65] text-white/[0.7]">{LOOP.lede}</p>
          <ol className="mt-10 max-w-[820px]">
            {LOOP.steps.map((s, i) => (
              <li key={i} className="flex gap-5 border-t border-hairline py-5">
                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[16.5px] leading-[1.6] text-white/[0.78]">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-[18px] font-medium text-ink">{LOOP.kicker}</p>
        </Shell>
      </section>

      {/* Five pillars, summarised, each linking into the Features detail */}
      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">The five pillars</span>
        <h2 className="mt-4 text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">
          One system.{" "}
          <span className="text-white/[0.55]">Five parts of a coaching practice.</span>
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {PILLARS.map((p) => (
            <Link key={p.id} href={`/features#${p.id}`}
              className="crx-card flex flex-col gap-2.5 rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-5 text-inherit">
              <span className="font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.4]">{p.n}</span>
              <span className="text-[17px] font-semibold text-ink">{p.label}</span>
              <span className="text-[14px] leading-[1.5] text-white/[0.6]">{p.navLine}</span>
            </Link>
          ))}
        </div>
      </Shell>

      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">In coaches' words</span>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {QUOTES.map((q) => (
            <figure key={q.who} className="rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
              <blockquote className="text-[15.5px] italic leading-[1.65] text-white/[0.75]">
                &ldquo;{q.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4 font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.45]">
                {q.who}
              </figcaption>
            </figure>
          ))}
        </div>
      </Shell>

      <ClosingCTA />
    </main>
  );
}

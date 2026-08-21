import Link from "next/link";
import type { Metadata } from "next";
import { Shell } from "@/components/Section";
import { ClosingCTA } from "@/components/ClosingCTA";

/**
 * NEEDS CARL'S COPY. The old Squarespace site had no /about page, so there is no
 * archived source for this. Everything on this page is limited to claims that
 * already appear in approved copy elsewhere:
 *   - "A coaching philosophy in practice since 1999"  (Features comparison table)
 *   - "Support is practicing coaches who use the platform daily"  (same)
 *   - "10,000+ coaching practices"  (Features hero proof line)
 * Nothing here is invented. Anything Carl wants to say about the company, the team,
 * or the story should replace this.
 */
export const metadata: Metadata = {
  title: "About",
  description:
    "CoachRx is built by OPEX Fitness, on a coaching philosophy in practice since 1999, and supported by coaches who use the platform daily.",
  alternates: { canonical: "/about" },
};

const FACTS = [
  { n: "1999", label: "The coaching philosophy behind the software has been in practice since 1999." },
  { n: "10,000+", label: "Coaching practices run on CoachRx." },
  { n: "Coaches", label: "Support is practicing coaches who use the platform daily, not a ticket queue." },
];

export default function AboutPage() {
  return (
    <main>
      <Shell className="pt-[118px]">
        <span className="overline block font-semibold">About</span>
        <h1 className="mt-4 max-w-[880px] text-[clamp(32px,4.6vw,54px)] font-bold leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
          Built by coaches,{" "}
          <span className="text-white/[0.55]">on a method that came first.</span>
        </h1>
        <p className="mt-5 max-w-[640px] text-[17.5px] leading-[1.6] text-white/[0.7]">
          CoachRx is the software arm of OPEX Fitness. The coaching method came first and the platform
          was built to deliver it, which is why the product is organised around how a practice actually
          runs rather than around a feature list.
        </p>
      </Shell>

      <Shell className="pt-[72px]">
        <div className="grid gap-5 md:grid-cols-3">
          {FACTS.map((f) => (
            <div key={f.n} className="rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-7">
              <span className="block text-[36px] font-bold leading-none tracking-[-0.03em] text-ink">{f.n}</span>
              <p className="mt-3 text-[15px] leading-[1.6] text-white/[0.65]">{f.label}</p>
            </div>
          ))}
        </div>
      </Shell>

      <Shell className="pt-[104px] pb-8">
        <span className="overline block font-semibold">Where to go next</span>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            { h: "The platform", href: "/features", n: "Every part of the practice, in one system." },
            { h: "Why CoachRx", href: "/why-coachrx", n: "What is different, laid out side by side." },
            { h: "The writing", href: "/articles", n: "How we think about coaching, in detail." },
          ].map((c) => (
            <Link key={c.href} href={c.href}
              className="crx-card flex flex-col rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6 text-inherit">
              <span className="text-[17px] font-semibold text-ink">{c.h}</span>
              <span className="mt-2 text-[15px] leading-[1.6] text-white/[0.65]">{c.n}</span>
              <span className="mt-4 text-[14px] font-medium text-accent">Go &rarr;</span>
            </Link>
          ))}
        </div>
      </Shell>

      <ClosingCTA />
    </main>
  );
}

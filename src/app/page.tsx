import Link from "next/link";
import type { Metadata } from "next";
import {
  HERO, WORKS_WITH, PROOF_BAR, PROBLEM, PLATFORM, PANELS, WHO,
  TESTIMONIALS, PROOF, SHIPPING, MIGRATION, PRICING, FINALE,
} from "@/data/home";
import { PLANS } from "@/data/pricing";
import { Shell, TwoTone, ProductFrame } from "@/components/Section";
import { PlatformRail } from "@/components/PlatformRail";
import { getReleases } from "@/lib/changelog";

export const metadata: Metadata = {
  title: "CoachRx — Coaching software for individual design",
  description: HERO.lede,
  alternates: { canonical: "/" },
};

const CTA = "rounded-full bg-gradient-to-b from-[#7BFF96] to-accent px-6 py-3 text-[14px] font-bold text-base";
const CTA2 = "rounded-full border border-hairline px-6 py-3 text-[14px] text-ink hover:border-white/[0.12]";

export default function Home() {
  const latest = getReleases()[0];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CoachRx",
    applicationCategory: "BusinessApplication",
    operatingSystem: "iOS, Android, Web",
    description: HERO.lede,
    offers: { "@type": "Offer", price: "29.00", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "OPEX Fitness", url: "https://www.coachrx.app" },
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <Shell className="pt-[118px]">
        <Link href="/changelog" className="inline-flex items-center gap-3 rounded-full border border-hairline bg-white/[0.03] px-4 py-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[.16em] text-accent">
            {HERO.badge.label}
          </span>
          <span className="text-[13px] text-white/[0.7]">{HERO.badge.text}</span>
        </Link>
        <TwoTone as="h1" parts={HERO.headline} className="mt-7 max-w-[960px] text-[clamp(38px,5.6vw,68px)]" />
        <p className="mt-6 max-w-[640px] text-[18px] leading-[1.6] text-white/[0.7]">{HERO.lede}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/pricing" className={CTA}>Start for free</Link>
          <Link href="/features" className={CTA2}>See the platform</Link>
        </div>
        <p className="mt-5 text-[13px] text-white/[0.45]">{HERO.fine}</p>
      </Shell>

      {/* Works with / proof bar */}
      <Shell className="pt-16">
        <div className="flex flex-col gap-5 border-y border-hairline py-6 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="overline">Works with</span>
            {WORKS_WITH.map((w) => (
              <span key={w} className="text-[14px] text-white/[0.6]">{w}</span>
            ))}
          </div>
          <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-white/[0.45]">
            {PROOF_BAR}
          </span>
        </div>
      </Shell>

      {/* 01 The problem */}
      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">{PROBLEM.overline}</span>
        <TwoTone parts={PROBLEM.headline} className="mt-4 max-w-[880px] text-[clamp(28px,3.8vw,46px)]" />
        <div className="mt-7 grid max-w-[900px] gap-6 md:grid-cols-2">
          {PROBLEM.body.map((b) => (
            <p key={b.slice(0, 18)} className="text-[16.5px] leading-[1.7] text-white/[0.7]">{b}</p>
          ))}
        </div>
        <div className="mt-11 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {PROBLEM.fragments.map((f) => (
            <div key={f.kind} className="rounded-[14px] border border-hairline bg-card/60 p-5">
              <span className="font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.4]">{f.kind}</span>
              <p className="mt-2.5 text-[14.5px] leading-[1.5] text-white/[0.62]">{f.line}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-[rgba(88,255,122,.35)] bg-[rgba(88,255,122,.07)] px-5 py-2.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="text-[14px] font-semibold text-ink">{PROBLEM.resolve}</span>
        </div>
      </Shell>

      {/* 02 The platform */}
      <section id="platform" className="mt-[104px] scroll-mt-20 bg-[linear-gradient(180deg,#0A0B0F_0%,#0C0E14_45%,#0A0B0F_100%)] py-24">
        <Shell>
          <span className="overline block font-semibold">{PLATFORM.overline}</span>
          <h2 className="mt-4 max-w-[820px] text-[clamp(28px,3.8vw,46px)] font-bold leading-[1.1] tracking-[-0.03em]">
            {PLATFORM.headline}
          </h2>
          <p className="mt-5 max-w-[620px] text-[17px] leading-[1.65] text-white/[0.7]">{PLATFORM.lede}</p>
          <PlatformRail />
        </Shell>
      </section>

      {/* 03 / 04 / 05 alternating panels */}
      {PANELS.map((p, i) => (
        <Shell key={p.overline} className="pt-[104px]">
          <div className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <div>
              <span className="overline block font-semibold">{p.overline}</span>
              <h2 className="mt-4 text-[clamp(26px,3.4vw,42px)] font-bold leading-[1.12] tracking-[-0.028em]">
                {p.headline}
              </h2>
              <p className="mt-5 text-[16.5px] leading-[1.7] text-white/[0.7]">{p.body}</p>
            </div>
            <ProductFrame src={p.shot} alt={p.alt} />
          </div>
        </Shell>
      ))}

      {/* 06 Who it's for */}
      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">{WHO.overline}</span>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {WHO.cards.map((c) => (
            <div key={c.head} className="rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
              <h3 className="text-[18px] font-semibold text-ink">{c.head}</h3>
              <p className="mt-2.5 text-[15px] leading-[1.6] text-white/[0.65]">{c.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-7 max-w-[760px] text-[16px] leading-[1.65] text-white/[0.62]">{WHO.footer}</p>
      </Shell>

      {/* 07 Proof */}
      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">{PROOF.overline}</span>
        <h2 className="mt-4 max-w-[760px] text-[clamp(26px,3.4vw,42px)] font-bold leading-[1.12] tracking-[-0.028em]">
          {PROOF.headline}
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {TESTIMONIALS.map((q) => (
            <figure key={q.name} className="rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
              <blockquote className="text-[15.5px] italic leading-[1.65] text-white/[0.75]">
                &ldquo;{q.text}&rdquo;
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-white/10 bg-card-hi font-mono text-[11px] text-white/[0.7]">
                  {q.init}
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-ink">{q.name}</span>
                  <span className="block font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.45]">
                    {q.role}
                  </span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Shell>

      {/* We ship every week */}
      <Shell className="pt-[104px]">
        <div className="flex flex-col gap-5 rounded-2xl border border-hairline bg-gradient-to-b from-white/[0.035] to-white/[0.01] p-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-[560px]">
            <p className="text-[16.5px] leading-[1.65] text-white/[0.75]">{SHIPPING.body}</p>
            {latest ? (
              <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[.16em] text-white/[0.45]">
                Latest · {latest.title}
              </p>
            ) : null}
          </div>
          <Link href="/changelog" className={CTA2}>Read the changelog</Link>
        </div>
      </Shell>

      {/* 08 Migration */}
      <section className="mt-[104px] bg-[linear-gradient(180deg,#0A0B0F_0%,#0B0E19_45%,#0A0B0F_100%)] py-24">
        <Shell>
          <span className="overline block font-semibold">{MIGRATION.overline}</span>
          <h2 className="mt-4 text-[clamp(26px,3.4vw,42px)] font-bold leading-[1.12] tracking-[-0.028em]">
            {MIGRATION.headline}
          </h2>
          <p className="mt-5 max-w-[620px] text-[17px] leading-[1.65] text-white/[0.7]">{MIGRATION.lede}</p>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {MIGRATION.steps.map((s, i) => (
              <li key={i} className="rounded-[14px] border border-hairline bg-card p-6">
                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="mt-3 text-[15px] leading-[1.6] text-white/[0.7]">{s}</p>
              </li>
            ))}
          </ol>
        </Shell>
      </section>

      {/* 09 Pricing */}
      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">{PRICING.overline}</span>
        <h2 className="mt-4 text-[clamp(26px,3.4vw,42px)] font-bold leading-[1.12] tracking-[-0.028em]">
          {PRICING.headline}
        </h2>
        <p className="mt-5 max-w-[620px] text-[17px] leading-[1.65] text-white/[0.7]">{PRICING.lede}</p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p, i) => (
            <div
              key={p.band}
              className={`relative flex flex-col rounded-2xl border p-7 ${
                p.popular
                  ? "border-[rgba(88,255,122,.35)] bg-[rgba(88,255,122,.05)]"
                  : "border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01]"
              }`}
            >
              {p.popular ? (
                <span className="absolute -top-3 left-7 rounded-full bg-accent px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[.16em] text-base">
                  Most popular
                </span>
              ) : null}
              <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-white/[0.5]">{p.band}</span>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-[40px] font-bold leading-none tracking-[-0.03em] text-ink">${p.monthly}</span>
                <span className="text-[15px] text-white/[0.5]">/month</span>
              </div>
              <p className="mt-3 text-[14.5px] leading-[1.55] text-white/[0.62]">{PRICING.blurbs[i]}</p>
              <Link href="/pricing" className={`${CTA} mt-6 text-center`}>Start for free</Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-[13px] text-white/[0.45]">{PRICING.fine}</p>
        <p className="mt-1.5 text-[13px] text-white/[0.45]">{PRICING.enterprise}</p>
      </Shell>

      {/* Finale */}
      <section className="relative mt-[104px] overflow-hidden bg-[linear-gradient(180deg,#0A0B0F_0%,#0C0E14_45%,#0A0B0F_100%)] px-8 py-24">
        <div className="mx-auto max-w-[680px] text-center">
          <h2 className="text-[clamp(26px,3.4vw,40px)] font-bold leading-[1.14] tracking-[-0.028em]">
            {FINALE.headline}
          </h2>
          <p className="mt-5 text-[17px] leading-[1.6] text-white/[0.7]">{FINALE.lede}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/pricing" className={CTA}>Start for free</Link>
            <Link href="/why-coachrx" className={CTA2}>Why CoachRx</Link>
          </div>
          <p className="mt-5 text-[13px] text-white/[0.45]">{FINALE.fine}</p>
        </div>
      </section>
    </main>
  );
}

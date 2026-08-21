import Link from "next/link";
import type { Metadata } from "next";
import { HERO, SYSTEM, PILLARS, LOOP, INCLUDED, COMPARISON, SWITCH, FAQ, FINALE } from "@/data/features";
import { TwoTone, ProductFrame, Shell } from "@/components/Section";
import { FaqList } from "@/components/FAQ";

export const metadata: Metadata = {
  title: "Features",
  description: HERO.lede,
  alternates: { canonical: "/features" },
};

const CTA = "rounded-full bg-gradient-to-b from-[#7BFF96] to-accent px-6 py-3 text-[14px] font-bold text-base";
const CTA2 = "rounded-full border border-hairline px-6 py-3 text-[14px] text-ink hover:border-white/[0.12]";

export default function FeaturesPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <Shell className="pt-[118px]">
        <span className="overline block font-semibold">{HERO.overline}</span>
        <TwoTone as="h1" parts={HERO.headline} className="mt-4 max-w-[900px] text-[clamp(34px,5vw,60px)]" />
        <p className="mt-5 max-w-[620px] text-[17.5px] leading-[1.6] text-white/[0.7]">{HERO.lede}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/pricing" className={CTA}>Start for free</Link>
          <Link href="#pillar-nav" className={CTA2}>See the five pillars</Link>
        </div>
        <p className="mt-5 text-[13px] text-white/[0.45]">{HERO.fine}</p>
      </Shell>

      {/* Pillar nav */}
      <Shell className="pt-[104px]" >
        <div id="pillar-nav" className="scroll-mt-24">
          <span className="overline block font-semibold">02 · The pillars</span>
          <TwoTone parts={["Five parts of a coaching practice.", "Every one of them, connected to the others."]}
                   className="mt-4 max-w-[860px] text-[clamp(28px,3.6vw,44px)]" />
          <div className="mt-10 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
            {PILLARS.map((p) => (
              <a key={p.id} href={`#${p.id}`}
                 className="crx-card flex flex-col gap-2.5 rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-5 text-inherit">
                <span className="font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.4]">{p.n}</span>
                <span className="text-[17px] font-semibold text-ink">{p.label}</span>
                <span className="text-[14px] leading-[1.5] text-white/[0.6]">{p.navLine}</span>
              </a>
            ))}
          </div>
          <p className="mt-8 text-[13.5px] text-white/[0.45]">{HERO.proof}</p>
        </div>
      </Shell>

      {/* The system */}
      <section className="mt-[104px] bg-[linear-gradient(180deg,#0A0B0F_0%,#0C0E14_45%,#0A0B0F_100%)] py-24">
        <Shell>
          <span className="overline block font-semibold">{SYSTEM.overline}</span>
          <TwoTone parts={SYSTEM.headline} className="mt-4 max-w-[820px] text-[clamp(28px,3.6vw,44px)]" />
          <div className="mt-7 grid max-w-[900px] gap-6 md:grid-cols-2">
            {SYSTEM.body.map((b) => (
              <p key={b.slice(0, 20)} className="text-[16.5px] leading-[1.7] text-white/[0.7]">{b}</p>
            ))}
          </div>
        </Shell>
      </section>

      {/* Five pillars */}
      {PILLARS.map((p, idx) => (
        <section key={p.id} id={p.id} className="scroll-mt-20 pt-[104px]">
          <Shell>
            <span className="overline block font-semibold">{p.n} · {p.label}</span>
            <TwoTone parts={p.headline} className="mt-4 max-w-[820px] text-[clamp(28px,3.8vw,46px)]" />
            <p className="mt-5 max-w-[680px] text-[17px] leading-[1.65] text-white/[0.7]">{p.lede}</p>

            {p.shot ? (
              <div className="mt-11 max-w-[980px]">
                <ProductFrame src={p.shot.src} alt={p.shot.alt} />
              </div>
            ) : null}

            <div className="mt-12 grid gap-x-10 gap-y-9 md:grid-cols-3">
              {p.blocks.map((b) => (
                <div key={b.title}>
                  <h3 className="text-[19px] font-semibold leading-[1.32] tracking-[-0.012em] text-ink">{b.title}</h3>
                  <p className="mt-3 text-[15.5px] leading-[1.65] text-white/[0.65]">{b.body}</p>
                </div>
              ))}
            </div>

            {p.quote ? (
              <blockquote className="mt-12 max-w-[820px] border-l border-white/[0.18] pl-6">
                <p className="text-[17px] italic leading-[1.7] text-white/[0.72]">&ldquo;{p.quote.text}&rdquo;</p>
                <footer className="mt-3 font-mono text-[10.5px] uppercase tracking-[.16em] text-white/[0.45]">
                  {p.quote.who}
                </footer>
              </blockquote>
            ) : null}
          </Shell>
          {idx < PILLARS.length - 1 ? <div className="mx-auto mt-[104px] max-w-shell border-t border-hairline" /> : null}
        </section>
      ))}

      {/* The loop */}
      <section className="mt-[104px] bg-[linear-gradient(180deg,#0A0B0F_0%,#0B0E19_45%,#0A0B0F_100%)] py-24">
        <Shell>
          <span className="overline block font-semibold">{LOOP.overline}</span>
          <TwoTone parts={LOOP.headline} className="mt-4 text-[clamp(28px,3.6vw,44px)]" />
          <p className="mt-5 max-w-[620px] text-[17px] leading-[1.65] text-white/[0.7]">{LOOP.lede}</p>
          <ol className="mt-10 max-w-[820px] space-y-0">
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

      {/* Included */}
      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">{INCLUDED.overline}</span>
        <h2 className="mt-4 text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">
          {INCLUDED.headline}
        </h2>
        <p className="mt-5 max-w-[640px] text-[17px] leading-[1.65] text-white/[0.7]">{INCLUDED.lede}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {INCLUDED.groups.map((g) => (
            <div key={g.head} className="rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
              <span className="overline">{g.head}</span>
              <ul className="mt-4 flex flex-col gap-2">
                {g.items.map((i) => (
                  <li key={i} className="text-[14.5px] text-white/[0.7]">{i}</li>
                ))}
              </ul>
              {g.note ? <p className="mt-4 text-[13px] leading-[1.5] text-white/[0.45]">{g.note}</p> : null}
            </div>
          ))}
        </div>
        <Link href="/pricing" className="mt-8 inline-block text-[14px] font-medium text-accent hover:text-[#8CFFA4]">
          See plans and pricing &rsaquo;
        </Link>
      </Shell>

      {/* Comparison */}
      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">{COMPARISON.overline}</span>
        <TwoTone parts={COMPARISON.headline} className="mt-4 max-w-[820px] text-[clamp(28px,3.6vw,44px)]" />
        <p className="mt-5 max-w-[640px] text-[17px] leading-[1.65] text-white/[0.7]">{COMPARISON.lede}</p>
        <div className="mt-10 overflow-hidden rounded-2xl border border-hairline">
          <div className="grid grid-cols-[1.1fr_1fr_1.4fr] gap-0 border-b border-hairline bg-white/[0.02]">
            <div className="p-4 font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.4]">Capability</div>
            <div className="p-4 font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.4]">{COMPARISON.colThem}</div>
            <div className="p-4 font-mono text-[10px] uppercase tracking-[.16em] text-accent">{COMPARISON.colUs}</div>
          </div>
          {COMPARISON.rows.map(([cap, them, us]) => (
            <div key={cap} className="grid grid-cols-[1.1fr_1fr_1.4fr] gap-0 border-b border-hairline last:border-0">
              <div className="p-4 text-[14.5px] font-medium text-ink">{cap}</div>
              <div className="p-4 text-[14px] text-white/[0.45]">{them}</div>
              <div className="p-4 text-[14px] text-white/[0.8]">{us}</div>
            </div>
          ))}
        </div>
      </Shell>

      {/* Switch */}
      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">{SWITCH.overline}</span>
        <TwoTone parts={SWITCH.headline} className="mt-4 max-w-[720px] text-[clamp(28px,3.6vw,44px)]" />
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {SWITCH.cards.map((c) => (
            <div key={c.slice(0, 24)} className="rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
              <p className="text-[15.5px] leading-[1.6] text-white/[0.72]">{c}</p>
            </div>
          ))}
        </div>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/pricing" className={CTA}>Start for free</Link>
          <a href="mailto:support@coachrx.app" className="text-[14px] font-medium text-accent hover:text-[#8CFFA4]">
            Talk to the transition team &rsaquo;
          </a>
        </div>
      </Shell>

      {/* FAQ */}
      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">{FAQ.overline}</span>
        <h2 className="mt-4 max-w-[760px] text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">
          {FAQ.headline}
        </h2>
        <FaqList items={FAQ.items} />
      </Shell>

      {/* Finale */}
      <section className="relative mt-[104px] overflow-hidden bg-[linear-gradient(180deg,#0A0B0F_0%,#0C0E14_45%,#0A0B0F_100%)] px-8 py-24">
        <div className="mx-auto max-w-[680px] text-center">
          <TwoTone parts={FINALE.headline} className="text-[clamp(26px,3.4vw,38px)]" />
          <p className="mt-5 text-[17px] leading-[1.6] text-white/[0.7]">{FINALE.lede}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Link href="/pricing" className={CTA}>Start for free</Link>
            <Link href="/why-coachrx" className={CTA2}>Why CoachRx</Link>
          </div>
          <p className="mt-5 text-[13px] text-white/[0.45]">{HERO.fine}</p>
        </div>
      </section>
    </main>
  );
}

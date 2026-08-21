import Link from "next/link";
import type { Metadata } from "next";
import { PLANS, ENTERPRISE, TRANSITION, QUOTES } from "@/data/pricing";
import { Shell } from "@/components/Section";
import { FaqList } from "@/components/FAQ";
import { FAQ } from "@/data/features";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Every feature on every plan. Pricing scales with the size of your roster, starting at $29/month, with a 14-day free trial and free transition support.",
  alternates: { canonical: "/pricing" },
};

const CTA = "rounded-full bg-gradient-to-b from-[#7BFF96] to-accent px-6 py-3 text-[14px] font-bold text-base";

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "CoachRx",
    description: "Coaching software for coaches who design for one person at a time.",
    brand: { "@type": "Brand", name: "CoachRx" },
    offers: PLANS.map((p) => ({
      "@type": "Offer",
      name: p.band,
      price: p.monthly.toFixed(2),
      priceCurrency: "USD",
      description: `${p.band}, billed monthly. $${p.annual}/month billed annually.`,
      availability: "https://schema.org/InStock",
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Shell className="pt-[118px]">
        <span className="overline block font-semibold">Pricing</span>
        <h1 className="mt-4 max-w-[860px] text-[clamp(32px,4.4vw,52px)] font-bold leading-[1.08] tracking-[-0.03em] [text-wrap:balance]">
          Every feature, every plan.{" "}
          <span className="text-white/[0.55]">You only pay for roster size.</span>
        </h1>
        <p className="mt-5 max-w-[640px] text-[17px] leading-[1.6] text-white/[0.7]">
          Pick the plan that fits your practice when you start your free trial. We grow as you grow and
          you can upgrade any time. Every account includes the complete feature set.
        </p>
      </Shell>

      <Shell className="mt-12">
        <div className="grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
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
              <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-white/[0.5]">
                {p.band}
              </span>
              <div className="mt-5 flex items-baseline gap-1.5">
                <span className="text-[44px] font-bold leading-none tracking-[-0.03em] text-ink">
                  ${p.monthly}
                </span>
                <span className="text-[15px] text-white/[0.5]">/month</span>
              </div>
              <span className="mt-2 text-[14px] text-white/[0.6]">
                or ${p.annual}/month billed annually
              </span>
              <Link href="https://app.coachrx.app" className={`${CTA} mt-7 text-center`}>
                Start for free
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-hairline p-7 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="font-mono text-[10.5px] uppercase tracking-[.16em] text-white/[0.5]">
              {ENTERPRISE.band}
            </span>
            <p className="mt-2 text-[16.5px] text-ink">{ENTERPRISE.copy}</p>
          </div>
          <a href="mailto:support@coachrx.app" className="text-[14px] font-medium text-accent hover:text-[#8CFFA4]">
            Contact support &rsaquo;
          </a>
        </div>

        <p className="mt-6 text-[13.5px] text-white/[0.45]">
          Start your 14-day commitment-free trial. No credit card required. Complimentary transition
          assistance available on every plan.
        </p>
      </Shell>

      <section className="mt-[104px] bg-[linear-gradient(180deg,#0A0B0F_0%,#0C0E14_45%,#0A0B0F_100%)] py-24">
        <Shell>
          <span className="overline block font-semibold">Transition assistance</span>
          <h2 className="mt-4 max-w-[720px] text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">
            Moving from another platform?{" "}
            <span className="text-white/[0.55]">We do the move for you.</span>
          </h2>
          <p className="mt-5 max-w-[620px] text-[17px] leading-[1.65] text-white/[0.7]">
            Our transition team handles data migration, setup, and training so you can focus on coaching.
            There is no charge for it.
          </p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {TRANSITION.map((t) => (
              <div key={t.head} className="rounded-[14px] border border-hairline bg-card p-6">
                <h3 className="text-[17px] font-semibold text-ink">{t.head}</h3>
                <p className="mt-2.5 text-[15px] leading-[1.6] text-white/[0.65]">{t.body}</p>
              </div>
            ))}
          </div>
        </Shell>
      </section>

      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">Coaches on CoachRx</span>
        <h2 className="mt-4 text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">
          Trusted by thousands of{" "}
          <span className="text-white/[0.55]">fitness professionals.</span>
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {QUOTES.map((q) => (
            <figure key={q.name} className="rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-6">
              <blockquote className="text-[15.5px] italic leading-[1.65] text-white/[0.75]">
                &ldquo;{q.text}&rdquo;
              </blockquote>
              <figcaption className="mt-4">
                <span className="block text-[14px] font-semibold text-ink">{q.name}</span>
                <span className="block font-mono text-[10px] uppercase tracking-[.16em] text-white/[0.45]">
                  {q.role}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Shell>

      <Shell className="pt-[104px] pb-24">
        <span className="overline block font-semibold">Questions</span>
        <h2 className="mt-4 text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">
          Before you start.
        </h2>
        <FaqList items={FAQ.items} />
      </Shell>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { Shell, TwoTone } from "@/components/Section";
import { ClosingCTA } from "@/components/ClosingCTA";

/**
 * Copy is the final draft from design-briefs/BRIEF-5-about.md.
 *
 * This page is still a hand-built page, not a compiled design port, because there is no
 * `About.dc.html` yet. Once Carl runs BRIEF-5 in Claude Design, replace this with a
 * `<DcPage>` wrapper like `/` and `/features`.
 *
 * The "who is behind it" section from the brief is deliberately NOT here: it needs
 * Carl's sign-off on naming Casey's TrueCoach history, and real headshots.
 */
export const metadata: Metadata = {
  title: "About",
  description:
    "CoachRx is built by OPEX Fitness, around a coaching method in practice since 1999. Individual design, the whole person, and the relationship that keeps clients.",
  alternates: { canonical: "/about" },
};

const BELIEFS = [
  {
    head: "Individual design is the job.",
    body:
      "A program that could belong to anyone is not coaching. Every tool we build has to make designing for one specific person faster than reaching for a template.",
  },
  {
    head: "The whole person, or none of it.",
    body:
      "Sleep, food and stress decide whether training works. Prescribing them in a separate app means nobody looks at them together. So they live in the same calendar as the squats.",
  },
  {
    head: "The relationship is the retention plan.",
    body:
      "Clients do not leave because the programming was wrong. They leave because they stopped feeling coached. We measure touchpoints because the thing that keeps people is contact.",
  },
  {
    head: "Software holds the mechanics. The coach coaches.",
    body:
      "Billing, tracking and flagging what needs attention should run underneath the practice without asking for attention. What is left is the part only a coach can do.",
  },
];

const STATS = [
  { n: "10,000+", label: "Coaching practices run on CoachRx." },
  { n: "1999", label: "The year the method behind the software went into practice." },
  { n: "Coaches", label: "Our support team are practicing coaches who use the platform daily, not a ticket queue." },
];

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CoachRx",
    url: "https://www.coachrx.app",
    parentOrganization: { "@type": "Organization", name: "OPEX Fitness" },
    foundingDate: "1999",
    description:
      "Coaching software built by OPEX Fitness around a coaching method in practice since 1999.",
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Shell className="pt-[118px]">
        <span className="overline block font-semibold">About</span>
        <TwoTone
          as="h1"
          parts={["We built the software we needed", "as coaches."]}
          className="mt-4 max-w-[900px] text-[clamp(32px,4.6vw,54px)]"
        />
        <p className="mt-5 max-w-[640px] text-[17.5px] leading-[1.6] text-white/[0.7]">
          CoachRx is built by OPEX Fitness. We spent years teaching coaches how to assess a person,
          design for them individually, and stay in the relationship between sessions. The tools
          available could send a workout and take a payment. They could not do the job we were
          teaching. So we built the one that could.
        </p>
      </Shell>

      <section className="mt-[104px] bg-[linear-gradient(180deg,#0A0B0F_0%,#0C0E14_45%,#0A0B0F_100%)] py-24">
        <Shell>
          <span className="overline block font-semibold">01 · Where this came from</span>
          <TwoTone
            parts={["A coaching method,", "in practice since 1999."]}
            className="mt-4 max-w-[820px] text-[clamp(28px,3.6vw,44px)]"
          />
          <div className="mt-7 grid max-w-[900px] gap-6 md:grid-cols-2">
            <p className="text-[16.5px] leading-[1.7] text-white/[0.7]">
              OPEX started as a gym and became an education company because coaches kept asking the
              same question: how do you actually design for one person at a time, at scale, without
              turning it into a template mill.
            </p>
            <p className="text-[16.5px] leading-[1.7] text-white/[0.7]">
              Answering that took a method. Assessment before prescription. Training, nutrition and
              lifestyle as one plan rather than three. A consultation cadence that catches problems
              while they are still small. Thousands of coaches have been through that education, and
              CoachRx is what happens when you build software around it instead of around a workout
              feed.
            </p>
          </div>
        </Shell>
      </section>

      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">02 · What we believe</span>
        <h2 className="mt-4 text-[clamp(28px,3.6vw,44px)] font-bold leading-[1.1] tracking-[-0.03em]">
          Four things we will not compromise on.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {BELIEFS.map((b) => (
            <div
              key={b.head}
              className="rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-7"
            >
              <h3 className="text-[18.5px] font-semibold leading-snug text-ink">{b.head}</h3>
              <p className="mt-3 text-[15.5px] leading-[1.65] text-white/[0.65]">{b.body}</p>
            </div>
          ))}
        </div>
      </Shell>

      <Shell className="pt-[104px]">
        <span className="overline block font-semibold">03 · Where we are now</span>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {STATS.map((s) => (
            <div key={s.n} className="rounded-[14px] border border-hairline bg-gradient-to-b from-white/[0.03] to-white/[0.01] p-7">
              <span className="block text-[36px] font-bold leading-none tracking-[-0.03em] text-ink">
                {s.n}
              </span>
              <p className="mt-3 text-[15px] leading-[1.6] text-white/[0.65]">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 max-w-[760px] text-[16.5px] leading-[1.7] text-white/[0.7]">
          Alongside the platform we still run the education. The OPEX Certified Coaching Program and
          LearnRx exist for the same reason CoachRx does: a coach with a better method gets better
          results for the person in front of them.
        </p>
        <div className="mt-9 flex flex-wrap gap-4">
          <Link href="/features" className="text-[14px] font-medium text-accent hover:text-[#8CFFA4]">
            See what the platform does &rsaquo;
          </Link>
          <Link href="/articles" className="text-[14px] font-medium text-white/[0.62] hover:text-ink">
            Read how we think about coaching &rsaquo;
          </Link>
        </div>
      </Shell>

      <ClosingCTA />
    </main>
  );
}

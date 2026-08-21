import Link from "next/link";

/**
 * The gradient is the "no hard seam" rule: the section fades up out of the page
 * base and back into it, so there is no visible band edge.
 */
export function ClosingCTA() {
  return (
    <section className="relative mt-24 overflow-hidden bg-[linear-gradient(180deg,#0A0B0F_0%,#0C0E14_45%,#0A0B0F_100%)] px-8 py-24">
      <div className="mx-auto max-w-[680px] text-center">
        <div className="overline">Start coaching in CoachRx</div>
        <h2 className="mt-4 text-[clamp(26px,3.4vw,36px)] font-bold leading-[1.15] tracking-[-0.025em]">
          Built for one client at a time.{" "}
          <span className="text-white/[0.55]">Even when you have ninety.</span>
        </h2>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/pricing"
            className="rounded-full bg-gradient-to-b from-[#7BFF96] to-accent px-6 py-3 text-[14px] font-bold text-base">
            Start for free
          </Link>
          <Link href="/features"
            className="rounded-full border border-hairline px-6 py-3 text-[14px] text-ink hover:border-white/[0.12]">
            See the features
          </Link>
        </div>
      </div>
    </section>
  );
}

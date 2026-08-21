import Link from "next/link";

const LINKS = [
  { label: "Features", href: "/features" },
  { label: "Resources", href: "/articles" },
  { label: "Changelog", href: "/changelog" },
  { label: "Pricing", href: "/pricing" },
];

/** Fixed 60px bar, translucent over the page with a blur. Spec from the design file. */
export function SiteNav({ active }: { active?: string }) {
  return (
    <nav className="fixed inset-x-0 top-0 z-[99] flex h-[60px] items-center justify-between gap-6 border-b border-hairline bg-[rgba(10,11,15,0.72)] px-8 backdrop-blur-[14px]">
      <Link href="/" className="inline-flex" aria-label="CoachRx home">
        <img src="/brand/coachrx-wordmark.webp" alt="CoachRx" className="h-[22px] w-auto" />
      </Link>

      <div className="crx-nav-links flex items-center gap-7">
        {LINKS.map((l) => {
          const on = active === l.href;
          return (
            <Link key={l.href} href={l.href}
              className={`text-[14px] transition-colors ${on ? "font-semibold text-ink" : "font-medium text-white/[0.68] hover:text-ink"}`}>
              {l.label}
            </Link>
          );
        })}
      </div>

      <Link href="/pricing"
        className="rounded-full bg-gradient-to-b from-[#7BFF96] to-accent px-4 py-2 text-[13px] font-bold text-base">
        Start for free
      </Link>
    </nav>
  );
}

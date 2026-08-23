import Link from "next/link";

/**
 * The nav for the hand-built pages: /changelog, /changelog/[slug], /why-coachrx.
 *
 * This has to match, item for item, what `normalizeNav()` in scripts/dc-compile.mjs builds for
 * the ten design-ported pages. It previously did not: four links instead of four menus, no
 * Roadmap, no Log in, no dropdowns, no mobile burger, a different logo file, and a CTA pointing
 * at /pricing instead of the signup app. So navigating from Home to Changelog visibly changed
 * the header, which is exactly what Carl spotted.
 *
 * If the canonical nav changes, change it in BOTH places. The real fix is porting these three
 * pages to design files, at which point this component can be deleted.
 *
 * Shape:  logo | Features · Resources ▾ · Updates ▾ · Pricing | Log in  [Start for free]
 * Auth actions sit hard right, which is what every serious SaaS nav does.
 * About is deliberately not here; it lives in the footer.
 */
const SIGNUP = "https://dashboard.coachrx.app/signup";
const LOGIN = "https://dashboard.coachrx.app/login";

const MENUS: Record<string, [string, string][]> = {
  Resources: [
    ["Articles", "/articles"],
    ["Podcasts", "/podcasts"],
  ],
  Updates: [
    ["Changelog", "/changelog"],
    ["Roadmap", "/roadmap"],
  ],
};

const ORDER = ["Features", "Resources", "Updates", "Pricing"] as const;
const DIRECT: Record<string, string> = { Features: "/features", Pricing: "/pricing" };

const linkCls = "text-[14px] font-medium text-white/[0.68] transition-colors hover:text-ink";

function Caret() {
  return (
    <svg width="9" height="6" viewBox="0 0 9 6" fill="none" className="ml-1.5 opacity-60" aria-hidden>
      <path d="M1 1l3.5 3.5L8 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Hover and focus-within only: no JS, and keyboard reachable. Same as the compiled pages. */
function Menu({ label }: { label: string }) {
  const items = MENUS[label];
  return (
    <span className="group relative inline-flex h-[60px] items-center">
      <Link href={items[0][1]} className={`inline-flex items-center ${linkCls}`}>
        {label}
        <Caret />
      </Link>
      <span className="absolute left-[-16px] top-full hidden pt-2 group-hover:block group-focus-within:block">
        <span className="flex min-w-[180px] flex-col rounded-xl border border-hairline bg-[#14151A] p-2 shadow-[0_24px_56px_rgba(0,0,0,.6)]">
          {items.map(([t, h]) => (
            <Link key={h} href={h}
              className="flex min-h-[44px] items-center rounded-lg px-3 text-[13.5px] text-white/[0.72] hover:bg-white/[0.05] hover:text-ink">
              {t}
            </Link>
          ))}
        </span>
      </span>
    </span>
  );
}

export function SiteNav({ active }: { active?: string }) {
  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[99] grid h-[60px] grid-cols-[1fr_auto_1fr] items-center gap-6 border-b border-hairline bg-[rgba(10,11,15,0.72)] px-5 backdrop-blur-[14px] md:px-8">
        <Link href="/" className="inline-flex" aria-label="CoachRx home">
          <img src="/design/assets/coachrx-primary-whiteblue.png" alt="CoachRx" width={1500} height={388} className="h-[22px] w-auto" />
        </Link>

        <span className="crx-navlinks hidden items-center gap-[26px] justify-self-center lg:flex">
          {ORDER.map((label) =>
            MENUS[label] ? (
              <Menu key={label} label={label} />
            ) : (
              <Link key={label} href={DIRECT[label]}
                className={active === DIRECT[label] ? "text-[14px] font-semibold text-ink" : linkCls}>
                {label}
              </Link>
            )
          )}
        </span>

        <span className="crx-navactions hidden items-center gap-5 justify-self-end lg:flex">
          <a href={LOGIN} className={linkCls}>Log in</a>
          <a href={SIGNUP}
            className="whitespace-nowrap rounded-[10px] bg-gradient-to-b from-[#7BFF96] to-accent px-[18px] py-[9px] text-[13px] font-bold uppercase tracking-[0.04em] text-base">
            Start for free
          </a>
        </span>

        {/* Mobile burger. The compiled pages get theirs injected by the compiler; this is the
            equivalent for the three hand-built routes. Peer-checked so it needs no JS. */}
        <input type="checkbox" id="navSheetToggle" className="peer hidden" aria-hidden />
        <label htmlFor="navSheetToggle"
          className="col-start-3 flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-1 justify-self-end lg:hidden"
          aria-label="Open menu">
          <span className="block h-0.5 w-5 rounded bg-ink" />
          <span className="block h-0.5 w-5 rounded bg-ink" />
          <span className="block h-0.5 w-5 rounded bg-ink" />
        </label>

        <span className="invisible fixed inset-0 z-[90] flex -translate-y-[102%] flex-col items-stretch bg-[rgba(10,11,15,0.98)] px-6 pb-7 pt-[84px] backdrop-blur-[16px] transition-transform duration-300 peer-checked:visible peer-checked:translate-y-0 lg:hidden">
          {[["Features", "/features"], ["Articles", "/articles"], ["Podcasts", "/podcasts"],
            ["Changelog", "/changelog"], ["Roadmap", "/roadmap"], ["Pricing", "/pricing"]].map(([t, h]) => (
            <Link key={h} href={h} className="flex min-h-[44px] items-center py-3 text-[20px] font-semibold text-ink">
              {t}
            </Link>
          ))}
          <span className="my-4 h-px bg-hairline" />
          <a href={LOGIN} className="flex min-h-[44px] items-center py-3 text-[20px] font-medium text-white/[0.68]">Log in</a>
          <a href={SIGNUP}
            className="mt-auto flex items-center justify-center rounded-[10px] bg-gradient-to-b from-[#7BFF96] to-accent py-4 text-[15px] font-extrabold uppercase tracking-[0.06em] text-base">
            Start for free
          </a>
        </span>
      </nav>
    </>
  );
}

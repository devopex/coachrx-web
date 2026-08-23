import Link from "next/link";

const COLS = [
  { head: "Product", links: [["Features", "/features"], ["Pricing", "/pricing"], ["Changelog", "/changelog"], ["Why CoachRx", "/why-coachrx"]] },
  { head: "Resources", links: [["Articles", "/articles"], ["Program design", "/topics/program-design"], ["Frameworks", "/topics/frameworks"], ["Coach spotlights", "/topics/coach-spotlight"]] },
  { head: "Company", links: [["About", "/about"], ["Help center", "https://help.coachrx.app"]] },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-[1100px] px-8 py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <img src="/design/assets/coachrx-primary-whiteblue.png" alt="CoachRx" className="h-[22px] w-auto" />
            <p className="mt-4 max-w-[260px] text-[13.5px] leading-relaxed text-white/[0.5]">
              Coaching software for coaches who design for one person at a time.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.head}>
              <div className="overline">{c.head}</div>
              <ul className="mt-4 flex flex-col gap-2.5">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-[14px] text-white/[0.62] hover:text-ink">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-14 border-t border-hairline pt-6 text-[13px] text-white/[0.4]">
          © {new Date().getFullYear()} OPEX Fitness LLC
        </div>
      </div>
    </footer>
  );
}

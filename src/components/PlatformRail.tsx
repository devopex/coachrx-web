"use client";
import { useState } from "react";
import Link from "next/link";
import { PLATFORM } from "@/data/home";

/**
 * The five-pillar rail. Active tab gets white text and a green dot, the same active
 * language as the topic chips, so the site reads as one system.
 */
export function PlatformRail() {
  const [active, setActive] = useState(0);
  const t = PLATFORM.tabs[active];
  return (
    <div className="mt-11">
      <div className="crx-chips flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {PLATFORM.tabs.map((tab, i) => (
          <button
            key={tab.title}
            type="button"
            onClick={() => setActive(i)}
            className={`crx-chip ${i === active ? "is-active" : ""}`}
            aria-pressed={i === active}
          >
            <span className="crx-dot" />
            <span className="font-mono text-[10px] tracking-[.16em] opacity-60">{tab.num}</span>
            {tab.title}
          </button>
        ))}
      </div>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <h3 className="text-[26px] font-bold leading-[1.2] tracking-[-0.02em] text-ink">{t.title}</h3>
          <p className="mt-4 text-[16.5px] leading-[1.65] text-white/[0.7]">{t.desc}</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {t.chips.map((c) => (
              <li key={c} className="rounded-full border border-hairline px-3 py-1.5 text-[13px] text-white/[0.6]">
                {c}
              </li>
            ))}
          </ul>
          <Link href={t.href} className="mt-7 inline-block text-[14px] font-medium text-accent hover:text-[#8CFFA4]">
            See {t.title} in detail &rsaquo;
          </Link>
        </div>
        {t.shot ? (
          <div
            className="overflow-hidden rounded-2xl border border-hairline bg-card"
            style={{ boxShadow: "0 0 0 1px rgba(88,255,122,.3), 0 30px 80px rgba(0,0,0,.5)" }}
          >
            <img src={t.shot} alt={`${t.title} in CoachRx`} className="block w-full" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

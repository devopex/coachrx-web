"use client";
import { useState } from "react";

/** Accordion. One open at a time; all answers stay in the DOM so crawlers read them. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-10 divide-y divide-white/[0.08] border-y border-hairline">
      {items.map((it, i) => (
        <div key={it.q}>
          <button
            type="button"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
            className="flex w-full items-center justify-between gap-6 py-5 text-left"
          >
            <span className="text-[17px] font-medium text-ink">{it.q}</span>
            <span className={`flex-none text-[20px] leading-none text-accent transition-transform duration-300 ease-crx ${open === i ? "rotate-45" : ""}`}>
              +
            </span>
          </button>
          <div className={`overflow-hidden transition-all duration-400 ease-crx ${open === i ? "max-h-96 pb-6" : "max-h-0"}`}>
            <p className="max-w-prose text-[16px] leading-[1.7] text-white/[0.7]">{it.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

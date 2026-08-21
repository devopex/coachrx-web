import type { ReactNode } from "react";

/**
 * Two-tone headline: the second clause always drops to 55% white.
 *
 * `as` defaults to h2 because most uses are section headings. The ONE headline that
 * states what a page is about must be h1 — a page with no h1 is an own-goal on the
 * pages we most want ranked.
 */
export function TwoTone({
  parts, className = "", as: Tag = "h2",
}: { parts: [string, string]; className?: string; as?: "h1" | "h2" }) {
  return (
    <Tag className={`font-bold leading-[1.1] tracking-[-0.03em] [text-wrap:balance] ${className}`}>
      {parts[0]} <span className="text-white/[0.55]">{parts[1]}</span>
    </Tag>
  );
}

/** Product frame: hairline card with the green edge treatment from the v7 system. */
export function ProductFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-hairline bg-card"
      style={{ boxShadow: "0 0 0 1px rgba(88,255,122,.3), 0 30px 80px rgba(0,0,0,.5)" }}
    >
      <img src={src} alt={alt} loading="lazy" className="block w-full" />
    </div>
  );
}

export function Shell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`crx-pad mx-auto max-w-shell px-8 ${className}`}>{children}</div>;
}

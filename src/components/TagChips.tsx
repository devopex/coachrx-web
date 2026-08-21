import Link from "next/link";
import { TOPICS } from "@/data/topics";

/**
 * Chips are real links to topic pages, not client-side filters. The design shows
 * filtering, but links spread internal link equity across the 9 topic archives and
 * give crawlers something to follow — which is the entire point of those pages.
 */
export function TagChips({ activeSlug }: { activeSlug?: string }) {
  return (
    <div className="crx-pad crx-chips mx-auto mt-9 flex max-w-shell gap-2 overflow-x-auto px-8 [scrollbar-width:none]">
      <Link href="/articles" className={`crx-chip ${!activeSlug ? "is-active" : ""}`}>
        <span className="crx-dot" />
        All
      </Link>
      {TOPICS.map((t) => (
        <Link key={t.slug} href={`/topics/${t.slug}`} className={`crx-chip ${activeSlug === t.slug ? "is-active" : ""}`}>
          <span className="crx-dot" />
          {t.title}
        </Link>
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import { html, css, script } from "@/generated/updates-changelog";
import { DcPage } from "@/components/DcPage";
import { getReleases } from "@/lib/changelog";

/**
 * Exact port of "CoachRx Changelog.dc.html".
 *
 * Lives at the app root, NOT in the (chrome) route group: design pages carry their own nav and
 * footer, so putting one inside (chrome) renders two of each. That bug already shipped once on
 * /articles.
 */
export const metadata: Metadata = {
  title: "Changelog",
  description:
    "Every CoachRx release since 2021. What shipped, when it shipped, and what it does.",
  alternates: { canonical: "/changelog" },
};

export default function ChangelogIndex() {
  // Read here purely so the page fails loudly if the data ever goes missing, rather than
  // rendering a compiled archive of stale releases.
  const releases = getReleases();
  if (!releases.length) throw new Error("changelog.json is empty");

  return <DcPage html={html} css={css} script={script} />;
}

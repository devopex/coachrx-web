import type { Metadata } from "next";
import { html, css, script } from "@/generated/blog-index";
import { DcPage } from "@/components/DcPage";

/**
 * Exact port of "CoachRx Blog Index.dc.html" with all 340 real posts compiled in by
 * scripts/build-blog.mjs. Every article link is in the HTML, so the whole library is
 * crawlable without JavaScript.
 */
export const metadata: Metadata = {
  title: "The coaching library",
  description:
    "Program design, assessment, retention, and the business of running a practice. Written by coaches who carry a roster.",
  alternates: { canonical: "/articles" },
};

export default function ArticlesIndex() {
  return <DcPage html={html} css={css} script={script} />;
}

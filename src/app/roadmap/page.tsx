import type { Metadata } from "next";
import { html, css, script } from "@/generated/roadmap";
import { DcPage } from "@/components/DcPage";

/**
 * Exact port of "CoachRx Roadmap.dc.html", compiled against the CoachRx Feature Hub in
 * Notion at build time. Edit the design file, then `npm run roadmap`.
 *
 * App root rather than (chrome) because the ported design carries its own nav and footer.
 */
export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "What we are building next in CoachRx, and what shipped recently. Shaped by the coaches who use it every day.",
  alternates: { canonical: "/roadmap" },
};

export default function Roadmap() {
  return <DcPage html={html} css={css} script={script} />;
}

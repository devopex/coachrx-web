import type { Metadata } from "next";
import { html, css, script } from "@/generated/about";
import { DcPage } from "@/components/DcPage";

/** Exact port of "CoachRx About.dc.html". Edit the design file, then `npm run dc`.
 *  App root, not (chrome): the ported design carries its own nav and footer. */
export const metadata: Metadata = {
  title: "About",
  description: "Thirty years of coaching individuals, then the software. Why a coaching company built its own platform, and what we stand for.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return <DcPage html={html} css={css} script={script} />;
}

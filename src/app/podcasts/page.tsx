import type { Metadata } from "next";
import { html, css, script } from "@/generated/podcasts";
import { DcPage } from "@/components/DcPage";

/** Exact port of "CoachRx Podcasts.dc.html". Edit the design file, then `npm run dc`.
 *  App root, not (chrome): the ported design carries its own nav and footer. */
export const metadata: Metadata = {
  title: "Podcasts",
  description: "The CoachRx Podcast Network. Coaches and industry voices on coaching methodology, professional development and practice management.",
  alternates: { canonical: "/podcasts" },
};

export default function Podcasts() {
  return <DcPage html={html} css={css} script={script} />;
}

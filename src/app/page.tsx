import type { Metadata } from "next";
import { html, css, script } from "@/generated/home";
import { DcPage } from "@/components/DcPage";

/** Exact port of "CoachRx Home.dc.html". Edit the design file, then `npm run dc`. */
export const metadata: Metadata = {
  title: "CoachRx — Deliver the coaching you're capable of",
  description:
    "Individualized programs, real visibility into every client, and a relationship that doesn't drop off between sessions, all in one system.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <DcPage html={html} css={css} script={script} />;
}

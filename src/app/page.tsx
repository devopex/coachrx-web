import type { Metadata } from "next";
import { html, css, script } from "@/generated/home";
import { DcPage } from "@/components/DcPage";

/**
 * Exact port of "CoachRx Home.dc.html". Edit the design file, then `npm run dc`.
 *
 * The title and description carried the pre-v2 headline ("Deliver the coaching you're capable of")
 * until 2026-08-30. The H1 had changed months earlier; only the metadata was missed, so every
 * search result and browser tab still showed the old positioning.
 */
export const metadata: Metadata = {
  title: "CoachRx — Program every client in minutes, not hours",
  description:
    "Assess, design, communicate and run your business in one place. The coaching platform built by coaches, used by thousands in 40+ countries.",
  alternates: { canonical: "/" },
};

export default function Home() {
  return <DcPage html={html} css={css} script={script} />;
}

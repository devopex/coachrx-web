import type { Metadata } from "next";
import { html, css, script } from "@/generated/features";
import { DcPage } from "@/components/DcPage";

/** Exact port of "CoachRx Features.dc.html". Edit the design file, then `npm run dc`. */
export const metadata: Metadata = {
  title: "Features",
  description:
    "Assess, consult, design, operate, and deliver. Every part of your practice in one place, so nothing gets missed and nothing slows you down.",
  alternates: { canonical: "/features" },
};

export default function Features() {
  return <DcPage html={html} css={css} script={script} />;
}

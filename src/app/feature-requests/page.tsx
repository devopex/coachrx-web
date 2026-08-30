import type { Metadata } from "next";
import { html, css, script } from "@/generated/updates-requests";
import { DcPage } from "@/components/DcPage";

/**
 * The Feature requests tab of "CoachRx Updates.dc.html", split out by scripts/build-updates.mjs.
 *
 * Requests are collected through a Notion form. Its responses carry coach names and email
 * addresses, so nothing from that database is ever rendered here — the page links out and stops.
 *
 * App root rather than (chrome): design pages carry their own nav and footer.
 */
export const metadata: Metadata = {
  title: "Feature requests",
  description:
    "Tell us what to build next in CoachRx. Every request is read, and plenty of what is on the roadmap started as one.",
  alternates: { canonical: "/feature-requests" },
};

export default function FeatureRequests() {
  return <DcPage html={html} css={css} script={script} />;
}

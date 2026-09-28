import type { Metadata } from "next";
import { html, css, script } from "@/generated/live";
import { DcPage } from "@/components/DcPage";

export const metadata: Metadata = {
  title: "Live",
  description: "A live map of coaching happening on CoachRx right now: messages, comments and workouts between coaches and clients, shown as approximate cities.",
  alternates: { canonical: "/live" },
  robots: { index: true, follow: true },
};

export default function Live() {
  return <DcPage html={html} css={css} script={script} />;
}

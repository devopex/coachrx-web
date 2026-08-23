import type { Metadata } from "next";
import { html, css, script } from "@/generated/pricing";
import { DcPage } from "@/components/DcPage";

/**
 * Exact port of "CoachRx Pricing.dc.html". Edit the design file, then `npm run dc`.
 *
 * Lives at the app root rather than in the (chrome) route group because the ported design
 * carries its own nav and footer. Putting it in (chrome) would render two of each.
 */
export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Every plan includes every feature. The only thing that changes is how many active clients you carry. 14 days free, and we move your data across for you.",
  alternates: { canonical: "/pricing" },
};

export default function Pricing() {
  return <DcPage html={html} css={css} script={script} />;
}

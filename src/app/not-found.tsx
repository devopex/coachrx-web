import { html, css, script } from "@/generated/notFound";
import { DcPage } from "@/components/DcPage";
import { getAllPosts } from "@/lib/posts";

/**
 * Exact port of "CoachRx 404.dc.html".
 *
 * This page matters more than a normal 404: the migration retired 298 URLs, so for a
 * while it catches real traffic from search results and old newsletters.
 *
 * The design hardcodes an article count in its copy. Rather than let it drift, the real
 * number is substituted here. If that copy changes in the design, this just stops
 * matching and does nothing, which is the safe failure.
 */
export default function NotFound() {
  const count = getAllPosts().length;
  const patched = html.replace(/\b\d{2,4} pieces\b/g, `${count} pieces`);
  return <DcPage html={patched} css={css} script={script} />;
}

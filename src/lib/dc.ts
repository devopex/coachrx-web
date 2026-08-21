import { marked } from "marked";

/** HTML-escape a value being substituted into compiled design markup. */
export function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/**
 * Substitute @@token@@ placeholders in a compiled design template.
 * Values are escaped. Pass `raw: true` for pre-rendered HTML like the article body.
 */
export function fill(template: string, values: Record<string, string>, raw: string[] = []): string {
  let out = template;
  for (const [k, v] of Object.entries(values)) {
    out = out.split(`@@${k}@@`).join(raw.includes(k) ? v : esc(v));
  }
  return out;
}

marked.setOptions({ gfm: true, breaks: false });

/**
 * Render an article body from MDX to HTML.
 *
 * Runs at build time only (every article page is prerendered). The output lands inside
 * the design's `.crx-body` container, so the design's own prose CSS styles it — we do
 * not add any styling here.
 */
export function renderBody(mdx: string): string {
  // <YouTube id="..." /> is the only component our converted articles use.
  const withEmbeds = mdx.replace(
    /<YouTube\s+id="([\w-]+)"\s*\/>/g,
    (_, id) =>
      `<div class="crx-embed" style="position:relative;aspect-ratio:16/9;margin:40px 0;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:#101118">` +
      `<iframe src="https://www.youtube-nocookie.com/embed/${id}" title="Video" loading="lazy" allowfullscreen ` +
      `style="position:absolute;inset:0;width:100%;height:100%;border:0"></iframe></div>`
  );

  let html = marked.parse(withEmbeds) as string;

  // A bare image inside a paragraph gets the design's figure treatment instead.
  html = html.replace(
    /<p>\s*(<img [^>]*>)\s*<\/p>/g,
    (_, img) => `<figure class="crx-figure" style="margin:40px 0">${img}</figure>`
  );
  return html;
}

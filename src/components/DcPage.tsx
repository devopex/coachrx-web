import { DcRuntime } from "@/components/DcRuntime";

/**
 * Renders a compiled Claude Design page: the design's own stylesheet, its DOM exactly
 * as authored, and its behavior script.
 *
 * These pages carry their own nav and footer, so they must NOT sit inside the layout
 * that adds site chrome — see the `(chrome)` route group.
 */
export function DcPage({ html, css, script }: { html: string; css: string; script: string }) {
  return (
    <>
      {/* Geist faces and the design-system custom properties the inline styles rely on */}
      <link rel="stylesheet" href="/design/_ds/colors_and_type.css" precedence="dc-base" />
      <style precedence="dc-page" dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <DcRuntime script={script} />
    </>
  );
}

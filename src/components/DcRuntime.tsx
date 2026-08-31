"use client";
import React, { useEffect } from "react";

/**
 * Runs a compiled design file's own component script in the browser.
 *
 * The script is carried over from the `.dc.html` file unchanged — this is the whole
 * point of the port. We supply the small `DCLogic` base class the script extends, call
 * `renderVals()` to get the real handler functions, bind them to the elements the
 * compiler tagged with `data-dc-on-*`, then call `componentDidMount()` so the reveals,
 * hero sequence, ticker and vignettes behave exactly as designed.
 */
export function DcRuntime({ script }: { script: string }) {
  useEffect(() => {
    if (!script) return;

    class DCLogic {
      props: Record<string, unknown>;
      constructor(props?: Record<string, unknown>) { this.props = props || {}; }
      q(sel: string) { return Array.from(document.querySelectorAll(sel)); }
      setState() { /* the compiled markup is static; state changes are handled in-DOM */ }
      scrollToPanel() { /* overridden by the file when it needs it */ }
    }

    let inst: { componentDidMount?: () => void; componentWillUnmount?: () => void; renderVals?: () => Record<string, unknown> };
    const cleanups: Array<() => void> = [];

    try {
      // Design files run inside Claude Design, where React is a global. The compiled bundle has no
      // such global, so a single `React.createElement` in renderVals() used to throw and take every
      // animation and scroll behavior down with it (2026-08-29). Pass React into the sandbox.
      const make = new Function("DCLogic", "React", `${script}\n;return Component;`) as (
        b: unknown,
        r: unknown,
      ) => new (p?: unknown) => typeof inst;
      const Component = make(DCLogic, React);
      inst = new Component({});

      // renderVals() only supplies click handlers. If it fails, behavior must still start —
      // previously one bad line here silently disabled the entire page.
      let vals: Record<string, unknown> = {};
      try {
        vals = typeof inst.renderVals === "function" ? inst.renderVals() : {};
      } catch (err) {
        console.error("DcRuntime: renderVals() failed, handlers skipped but behavior continues:", err);
      }

      const at = (path: string): unknown =>
        path.split(".").reduce<unknown>((o, k) => (o == null ? o : (o as Record<string, unknown>)[k]), vals);

      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-dc-on-click],[data-dc-on-mouseenter],[data-dc-on-mouseleave],[data-dc-on-input],[data-dc-on-change]"))) {
        for (const attr of Array.from(el.attributes)) {
          if (!attr.name.startsWith("data-dc-on-")) continue;
          const evt = attr.name.replace("data-dc-on-", "");
          const fn = at(attr.value);
          if (typeof fn !== "function") continue;
          const handler = (e: Event) => (fn as (e: Event) => void)(e);
          el.addEventListener(evt, handler);
          cleanups.push(() => el.removeEventListener(evt, handler));
        }
      }

      inst.componentDidMount?.();
    } catch (err) {
      // Never let a design script take the page down — the markup and CSS still render.
      console.error("DcRuntime failed:", err);
    }

    return () => {
      cleanups.forEach((c) => c());
      try { inst?.componentWillUnmount?.(); } catch { /* ignore */ }
    };
  }, [script]);

  return null;
}

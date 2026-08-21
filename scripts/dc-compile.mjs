/**
 * Compiles Claude Design `.dc.html` files into server-rendered HTML + CSS.
 *
 * WHY THIS EXISTS
 * The design files are the visual source of truth. Rebuilding them by hand in JSX
 * gives something that matches the design *system* but is not the design — exactly the
 * failure mode we left Framer to avoid. This transplants them instead: the stylesheet
 * is lifted verbatim, the DOM is preserved node for node, and the animation code is
 * carried over unchanged.
 *
 * WHAT IT HANDLES
 *   <sc-for list="{{ arr }}" as="item">    repeat children once per element
 *   <sc-if value="{{ cond }}">             keep or drop children
 *   {{ expr }}                             interpolate in text and attributes
 *   style-hover="..."                      becomes a real CSS :hover rule
 *   onClick / onMouseEnter / onMouseLeave   becomes data-dc-on-* for the runtime to bind
 *   assets/… and uploads/…                 rewritten to /design/…
 *
 * The `renderVals()` data is obtained by *executing* each file's own script against a
 * DCLogic stub, so data is never retyped by hand and cannot drift from the design.
 *
 * Uses cheerio, not jsdom: jsdom eagerly parses inline `style` attributes and throws on
 * some of the gradient shorthands in these files.
 *
 * OUTPUT  src/generated/<page>.ts  exporting { html, css, script, data }
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import * as cheerio from "cheerio";

// Design files live IN the repo: Cloudflare clones only this repo, so anything
// outside it does not exist at build time and the compile would silently skip.
const SRC = process.env.DC_SRC || path.join(process.cwd(), "design");
const OUT = path.join(process.cwd(), "src", "generated");

const PAGES = [
  { file: "CoachRx Home v7.dc.html", name: "home" },
  { file: "CoachRx Features.dc.html", name: "features" },
  { file: "CoachRx Blog Post.dc.html", name: "blogPost" },
  { file: "CoachRx Blog Index.dc.html", name: "blogIndex" },
  { file: "CoachRx Tag Archive.dc.html", name: "tagArchive" },
  { file: "CoachRx 404.dc.html", name: "notFound" },
];

/**
 * Keys are lowercase: cheerio lowercases attribute names while parsing HTML, so the
 * source's `onMouseEnter` arrives as `onmouseenter`. Matching on camelCase silently
 * dropped every handler on the first run.
 */
const EVENTS = {
  onclick: "click", onmouseenter: "mouseenter", onmouseleave: "mouseleave",
  oninput: "input", onchange: "change", onfocus: "focus", onblur: "blur",
};
const INTERP = /\{\{([^}]+)\}\}/g;

/* ------------------------------------------------------------------ helpers */

/** Resolve a `{{ ... }}` expression against the data scope. Paths and literals only. */
function resolve(expr, scope) {
  const e = String(expr).trim();
  if (e === "true") return true;
  if (e === "false") return false;
  if (e === "null" || e === "undefined") return undefined;
  if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);
  if (/^['"].*['"]$/.test(e)) return e.slice(1, -1);
  let cur = scope;
  for (const part of e.split(".")) {
    if (cur == null) return undefined;
    cur = cur[part];
  }
  return cur;
}

function interpolate(str, scope, unresolved) {
  return str.replace(INTERP, (_, expr) => {
    const v = resolve(expr, scope);
    if (v === undefined) unresolved.add(expr.trim());
    if (typeof v === "function") return "";
    return v == null ? "" : String(v);
  });
}

function rewriteAsset(v) {
  if (!v) return v;
  if (/^(https?:|mailto:|tel:|#|\/|data:)/.test(v)) return v;
  if (v.startsWith("assets/") || v.startsWith("uploads/")) return `/design/${v}`;
  if (v.startsWith("./")) return v.slice(1);
  return v;
}

/* ------------------------------------------------------- run the file's script */

function extractData(scriptSrc, props) {
  const ctx = vm.createContext({
    DCLogic: class {
      constructor(p) { this.props = p || {}; }
      scrollToPanel() {} setState() {} q() { return []; }
    },
    matchMedia: () => ({ matches: false }),
    console, __props: props, out: null,
  });
  const code = `${scriptSrc}
;out = (() => { const c = new Component(__props); return typeof c.renderVals === "function" ? c.renderVals() : {}; })();`;
  try {
    vm.runInContext(code, ctx, { timeout: 8000 });
    return ctx.out || {};
  } catch (err) {
    console.warn(`      ! renderVals() failed: ${err.message}`);
    return {};
  }
}

function defaultProps($) {
  const spec = $('script[data-props]').attr("data-props");
  if (!spec) return {};
  try {
    return Object.fromEntries(Object.entries(JSON.parse(spec)).map(([k, v]) => [k, v?.default]));
  } catch { return {}; }
}

/* ----------------------------------------------------------------- transforms */

function compileNode($, node, scope, ctx) {
  const $node = $(node);

  // sc-if: resolve the branch before compiling anything inside it
  $node.find("sc-if").each((_, el) => {
    const keep = !!resolve(($(el).attr("value") || "").replace(/[{}]/g, ""), scope);
    if (keep) $(el).replaceWith($(el).contents());
    else $(el).remove();
  });

  // sc-for: repeat children once per list item, loop var added to scope
  let guard = 0;
  while ($node.find("sc-for").length && guard++ < 50) {
    const el = $node.find("sc-for").first();
    const listExpr = (el.attr("list") || "").replace(/[{}]/g, "");
    const list = resolve(listExpr, scope);
    const as = el.attr("as") || "item";
    if (!Array.isArray(list)) {
      ctx.unresolved.add(`sc-for list: ${listExpr.trim()}`);
      el.remove();
      continue;
    }
    const parts = [];
    let idx = 0;
    for (const item of list) {
      // aliases let `t.onSelect` compile to `tabs.3.onSelect`, a path the client
      // runtime can resolve. Without this, per-item handlers silently do nothing.
      const childScope = {
        ...scope,
        [as]: item,
        __aliases: { ...(scope.__aliases || {}), [as]: `${listExpr.trim()}.${idx}` },
      };
      idx++;
      el.children().each((__, child) => {
        const clone = $(child).clone();
        compileNode($, clone, childScope, ctx);
        applyLeaf($, clone, childScope, ctx);
        parts.push($.html(clone));
      });
    }
    el.replaceWith(parts.join(""));
  }
}

function applyLeaf($, node, scope, ctx) {
  const targets = [node.get(0), ...node.find("*").toArray()].filter(Boolean);
  for (const el of targets) {
    if (!el.attribs) continue;
    const tag = (el.tagName || "").toLowerCase();
    if (tag === "sc-for" || tag === "sc-if") continue;
    const $el = $(el);

    for (const [name, value] of Object.entries({ ...el.attribs })) {
      if (EVENTS[name.toLowerCase()]) {
        let expr = String(value).replace(/[{}]/g, "").trim();
        const aliases = scope.__aliases || {};
        const head = expr.split(".")[0];
        if (aliases[head]) expr = aliases[head] + expr.slice(head.length);
        $el.removeAttr(name);
        $el.attr(`data-dc-on-${EVENTS[name.toLowerCase()]}`, expr);
        continue;
      }
      if (name === "style-hover") {
        const cls = `dch-${ctx.hoverRules.length}`;
        ctx.hoverRules.push(`.${cls}:hover{${value}}`);
        $el.addClass(cls);
        $el.removeAttr("style-hover");
        continue;
      }
      if (name.toLowerCase().startsWith("hint-")) { $el.removeAttr(name); continue; }

      if (String(value).includes("{{")) {
        const bare = /^\s*\{\{[^}]+\}\}\s*$/.test(value);
        if (bare) {
          const v = resolve(String(value).replace(/[{}]/g, ""), scope);
          if (typeof v === "function") { $el.removeAttr(name); continue; }
        }
        const next = interpolate(String(value), scope, ctx.unresolved);
        $el.attr(name, name === "src" || name === "href" ? rewriteAsset(next) : next);
        continue;
      }
      if (name === "src" || name === "href") $el.attr(name, rewriteAsset(String(value)));
    }
  }

  // text nodes, including the node's own children
  const walk = (n) => {
    $(n).contents().each((_, c) => {
      if (c.type === "text" && c.data && c.data.includes("{{")) {
        c.data = interpolate(c.data, scope, ctx.unresolved);
      } else if (c.type === "tag") walk(c);
    });
  };
  walk(node.get(0));
}

/* --------------------------------------------------------------------- driver */

fs.mkdirSync(OUT, { recursive: true });
const report = [];

for (const page of PAGES) {
  const full = path.join(SRC, page.file);
  if (!fs.existsSync(full)) { console.log(`  skip ${page.file} (not found)`); continue; }

  const $ = cheerio.load(fs.readFileSync(full, "utf8"), { xmlMode: false });

  const css = $("helmet style").map((_, s) => $(s).html()).get().join("\n");
  const scriptSrc = $('script[type="text/x-dc"]').html() || "";
  const data = extractData(scriptSrc, defaultProps($));

  $("helmet").remove();
  $('script[type="text/x-dc"]').remove();

  const root = $("x-dc").length ? $("x-dc") : $("body");
  const ctx = { hoverRules: [], unresolved: new Set() };
  compileNode($, root, data, ctx);
  applyLeaf($, root, data, ctx);

  const html = (root.html() || "").trim();
  const finalCss = [css, "", "/* style-hover attributes, compiled to real rules */", ...ctx.hoverRules].join("\n");

  // data minus functions, so pages can reuse the design's own copy where useful
  const plain = JSON.parse(JSON.stringify(data, (k, v) => (typeof v === "function" ? undefined : v)));

  fs.writeFileSync(
    path.join(OUT, `${page.name}.ts`),
    `// GENERATED by scripts/dc-compile.mjs from "${page.file}". Do not edit by hand.\n` +
    `export const html = ${JSON.stringify(html)};\n` +
    `export const css = ${JSON.stringify(finalCss)};\n` +
    `export const script = ${JSON.stringify(scriptSrc)};\n` +
    `export const data = ${JSON.stringify(plain)} as const;\n`
  );

  report.push({
    name: page.name,
    htmlKB: Math.round(html.length / 1024),
    cssKB: Math.round(finalCss.length / 1024),
    hover: ctx.hoverRules.length,
    dataKeys: Object.keys(data).length,
    leftover: (html.match(/\{\{/g) || []).length,
    scFor: (html.match(/<sc-for/g) || []).length + (html.match(/<sc-if/g) || []).length,
    unresolved: [...ctx.unresolved],
  });
}

console.log("\ndc-compile:");
for (const r of report) {
  const bad = r.leftover || r.scFor;
  console.log(
    `  ${bad ? "FAIL" : "ok  "} ${r.name.padEnd(11)} html ${String(r.htmlKB).padStart(3)}KB  css ${String(r.cssKB).padStart(2)}KB  ` +
    `hover ${String(r.hover).padStart(2)}  data ${r.dataKeys}  leftover{{ }} ${r.leftover}  directives ${r.scFor}` +
    (r.unresolved.length ? `\n       unresolved: ${r.unresolved.slice(0, 8).join(" | ")}` : "")
  );
}
if (report.some((r) => r.leftover || r.scFor)) {
  console.error("\ndc-compile: uncompiled template syntax remains — fix before shipping");
  process.exit(1);
}

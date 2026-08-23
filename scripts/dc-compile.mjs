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
  { file: "CoachRx Pricing.dc.html", name: "pricing" },
  { file: "CoachRx About.dc.html", name: "about" },
  { file: "CoachRx Podcasts.dc.html", name: "podcasts" },
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

  // sc-if: resolve the branch before compiling anything inside it.
  //
  // Skip any sc-if that sits inside an sc-for. Its condition almost always references the
  // loop variable (`t.idle`, `row.active`), which is not in scope until the loop runs, so
  // resolving here yields undefined and silently deletes the branch. The recursive
  // compileNode() call inside the sc-for expansion below handles those with the item in
  // scope. This cost us every poster image in the testimonial bar: `sc-if value="{{ t.idle }}"`
  // was evaluated with no `t`, so all 22 tiles compiled to empty rectangles.
  $node.find("sc-if").each((_, el) => {
    if ($(el).parents("sc-for").length) return;
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


/**
 * Design files link to each other by filename, and use href="#" for pages that did not
 * exist when the design was made. Both are dead links on the live site, so they are
 * rewritten here. Anything that cannot be resolved is reported rather than shipped
 * silently.
 */
const DESIGN_ROUTES = {
  "CoachRx Home v7.dc.html": "/",
  "CoachRx Home.dc.html": "/",
  "CoachRx Features.dc.html": "/features",
  "CoachRx Blog Index.dc.html": "/articles",
  "CoachRx Tag Archive.dc.html": "/articles",
  "CoachRx Blog Post.dc.html": "/articles",
  "CoachRx 404.dc.html": "/",
};

/**
 * href="#" resolved by the link's own text, which is the only signal available.
 * Ordered: first match wins, so put specific patterns before general ones.
 */
const TEXT_ROUTES = [
  // pillar deep links on the Features and Home pages
  [/assessments?, metrics/, "/features#assess"],
  [/messaging, check-ins/, "/features#consult"],
  [/program design, librar/, "/features#design"],
  [/payments, team/, "/features#operate"],
  [/the client app/, "/features#client-experience"],
  [/see all features/, "/features"],
  // commerce
  [/plans and pricing|^pricing$|full pricing/, "/pricing"],
  // Every signup CTA goes to the app, not to /pricing. Sending "Start free trial" to
  // /pricing made the button a self-link on the pricing page itself. Confirmed by Carl
  // 2026-08-21. Note: no `_gl` linker params here on purpose. Those are per-session Google
  // Analytics values; hard-coding them pins one stale session onto every visitor and shows
  // a wall of junk in the address bar. Cross-domain attribution is configured in GTM.
  [/start (for )?free|start your (free )?trial|get started|free trial/, "https://dashboard.coachrx.app/signup"],
  [/^(log ?in|sign ?in)$/, "https://dashboard.coachrx.app/login"],
  // content
  [/^changelog$|what's new|view the changelog/, "/changelog"],
  [/^roadmap$|see the roadmap|what we.re building/, "/roadmap"],
  [/^compare$|why coachrx|how coachrx compares/, "/why-coachrx"],
  [/^about$/, "/about"],
  [/coaching guides|^resources$|^articles$|read the articles|the coaching library|^all$/, "/articles"],
  // We cut every video-only page in the migration, so these point at the library.
  [/^videos$|^podcasts$/, "/articles"],
  [/^features$/, "/features"],
  // No dedicated pages for these, so route to the people who can answer.
  // coachrx@opexfit.com is the published address, confirmed by Carl 2026-08-21.
  // support@coachrx.app was wrong and appeared nowhere on the live site.
  [/^contact( us)?$|transition team|talk to (the )?(sales|support)/, "mailto:coachrx@opexfit.com"],
  // Legal lives on the OPEX site; taken from the old Squarespace footer.
  [/^privacy( policy)?$/, "https://www.opexfit.com/privacy-policy/"],
  [/^terms( (and conditions|of service))?$/, "https://www.opexfit.com/terms-and-conditions/"],
  // The referral programme has no landing page, but the article survived the migration.
  [/^referral program$/, "/articles/coachrx-referral-program"],
];

function fixLinks($, root, ctx) {
  $(root).find("a[href]").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") || "";
    const text = ($a.text() || "").replace(/\s+/g, " ").trim().toLowerCase();

    const base = href.split(/[#?]/)[0];
    if (base.endsWith(".dc.html")) {
      const file = base.split("/").pop();
      const to = DESIGN_ROUTES[file];
      if (to) { $a.attr("href", to + (href.includes("#") ? href.slice(href.indexOf("#")) : "")); }
      else { ctx.deadLinks.push(`unmapped design file: ${file}`); }
      return;
    }
    if (href === "#" || href === "") {
      const hit = TEXT_ROUTES.find(([re]) => re.test(text));
      if (hit) $a.attr("href", hit[1]);
      else ctx.deadLinks.push(`href="#" text: "${text.slice(0, 44) || "(no text)"}"`);
    }
  });
}

/**
 * Each design file carries its own copy of the nav, so they drift. When /roadmap was added
 * only the Roadmap page linked to it, leaving the page unreachable from every other page.
 *
 * Rather than a round trip per file for a one-line change, insert the item here by cloning
 * the existing `Changelog` link and retargeting it. Cloning means it inherits that nav's
 * exact styling, so it cannot look out of place, and each file stays the source of truth for
 * how its own nav looks.
 *
 * Skips any nav that already has a Roadmap link, so this becomes a no-op once the design
 * files catch up, and it will not double-insert.
 *
 * Position: directly after Changelog. One is what shipped, the other is what is coming.
 */
/**
 * Nav and footer drift, part two.
 *
 * Each design file owns its own nav and footer, so new pages and legal links land unevenly.
 * After Passes 1-4, five pages had no Privacy or Terms link at all — including the three blog
 * templates, which serve 340 articles and are the most-visited pages on the site. A commercial
 * site needs those reachable from every page.
 *
 * Same approach as the Roadmap item: clone an existing link so styling is inherited, skip if
 * already present, so this is a no-op once the design files catch up.
 */
function ensureLegalLinks($, root, ctx) {
  const footers = root.find("footer");
  if (!footers.length) return;
  let added = 0;
  footers.each((_, el) => {
    const $f = $(el);
    const has = (t) => $f.find("a").filter((_, a) => $(a).text().trim() === t).length > 0;
    if (has("Privacy") && has("Terms")) return;
    // Anchor to clone for styling: any existing footer link, else the copyright span.
    const $model = $f.find("a").first();
    const mk = (text, href) => {
      const $a = $model.length ? $model.clone().empty() : $("<a></a>");
      return $a.attr("href", href).attr("style",
        ($model.attr("style") || "font-size:12.5px;color:rgba(255,255,255,.4)")).text(text);
    };
    const $wrap = $('<span style="display:flex;gap:20px"></span>');
    if (!has("Privacy")) $wrap.append(mk("Privacy", "https://www.opexfit.com/privacy-policy/"));
    if (!has("Terms")) $wrap.append(mk("Terms", "https://www.opexfit.com/terms-and-conditions/"));
    $f.find("> div").last().append($wrap);
    if (!$f.find("> div").length) $f.append($wrap);
    added++;
  });
  if (added) ctx.legalInjected = added;
}

function ensureRoadmapNav($, root, ctx) {
  let added = 0;
  root.find("nav, footer").each((_, container) => {
    const $c = $(container);
    if ($c.find("a").filter((_, a) => $(a).text().trim() === "Roadmap").length) return;
    const $changelog = $c
      .find("a")
      .filter((_, a) => $(a).text().trim() === "Changelog")
      .first();
    if (!$changelog.length) return;
    const $item = $changelog.clone().attr("href", "/roadmap").text("Roadmap");
    $changelog.after($item);
    added++;
  });
  if (added) ctx.navInjected = added;
}

/* ------------------------------------------------------------------- public API */

/**
 * Compile one design file.
 *
 * @param {string} full           absolute path to the .dc.html
 * @param {object|Function} [override]  data to use instead of the design's own
 *        renderVals() output. A function receives the design data and returns the
 *        replacement, which is how the blog pages swap sample posts for real ones.
 * @returns {{html:string, css:string, script:string, data:object, hoverRules:string[], unresolved:string[]}}
 */
export function compileDesign(full, override) {
  const $ = cheerio.load(fs.readFileSync(full, "utf8"), { xmlMode: false });
  const css = $("helmet style").map((_, s2) => $(s2).html()).get().join("\n");
  const scriptSrc = $('script[type="text/x-dc"]').html() || "";
  let data = extractData(scriptSrc, defaultProps($));
  if (typeof override === "function") data = override(data);
  else if (override) data = { ...data, ...override };

  $("helmet").remove();
  $('script[type="text/x-dc"]').remove();

  const root = $("x-dc").length ? $("x-dc") : $("body");
  const ctx = { hoverRules: [], unresolved: new Set(), deadLinks: [] };
  compileNode($, root, data, ctx);
  applyLeaf($, root, data, ctx);
  fixLinks($, root, ctx);
  ensureRoadmapNav($, root, ctx);
  ensureLegalLinks($, root, ctx);

  return {
    html: (root.html() || "").trim(),
    css: [css, "", "/* style-hover attributes, compiled to real rules */", ...ctx.hoverRules].join("\n"),
    script: scriptSrc,
    data,
    hoverRules: ctx.hoverRules,
    unresolved: [...ctx.unresolved],
    deadLinks: [...new Set(ctx.deadLinks)],
  };
}

export { SRC as DESIGN_SRC, OUT as GENERATED_OUT };

/* --------------------------------------------------------------------- driver */

// The three blog templates are compiled by scripts/build-blog.mjs instead, because
// they need real post data injected. Compiling them here too would just produce
// sample-content versions that nothing imports.
const CLI_SKIP = new Set(["blogPost", "blogIndex", "tagArchive"]);

if (process.argv[1] && process.argv[1].endsWith("dc-compile.mjs")) {
fs.mkdirSync(OUT, { recursive: true });
const report = [];

for (const page of PAGES) {
  if (CLI_SKIP.has(page.name)) continue;
  const full = path.join(SRC, page.file);
  if (!fs.existsSync(full)) { console.log(`  skip ${page.file} (not found)`); continue; }

  const $ = cheerio.load(fs.readFileSync(full, "utf8"), { xmlMode: false });

  const css = $("helmet style").map((_, s) => $(s).html()).get().join("\n");
  const scriptSrc = $('script[type="text/x-dc"]').html() || "";
  const data = extractData(scriptSrc, defaultProps($));

  $("helmet").remove();
  $('script[type="text/x-dc"]').remove();

  const root = $("x-dc").length ? $("x-dc") : $("body");
  const ctx = { hoverRules: [], unresolved: new Set(), deadLinks: [] };
  compileNode($, root, data, ctx);
  applyLeaf($, root, data, ctx);
  fixLinks($, root, ctx);
  ensureRoadmapNav($, root, ctx);
  ensureLegalLinks($, root, ctx);

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
    deadLinks: [...new Set(ctx.deadLinks)],
  });
}

console.log("\ndc-compile:");
for (const r of report) {
  const bad = r.leftover || r.scFor;
  console.log(
    `  ${bad ? "FAIL" : "ok  "} ${r.name.padEnd(11)} html ${String(r.htmlKB).padStart(3)}KB  css ${String(r.cssKB).padStart(2)}KB  ` +
    `hover ${String(r.hover).padStart(2)}  data ${r.dataKeys}  leftover{{ }} ${r.leftover}  directives ${r.scFor}` +
    (r.unresolved.length ? `\n       unresolved: ${r.unresolved.slice(0, 8).join(" | ")}` : "") +
    (r.deadLinks && r.deadLinks.length ? `\n       dead links: ${r.deadLinks.slice(0, 6).join(" | ")}` : "")
  );
}
if (report.some((r) => r.leftover || r.scFor)) {
  console.error("\ndc-compile: uncompiled template syntax remains — fix before shipping");
  process.exit(1);
}
}

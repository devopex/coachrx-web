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
const DESIGN_ROOT = process.env.DC_SRC || path.join(process.cwd(), "design");

/**
 * Resolve a design file whether it sits in design/ or in a subfolder.
 *
 * The folder gets reorganised as it grows — the .dc.html files were moved into design/Pages/
 * alongside a covers folder, and the compiler silently skipped all ten and produced an empty
 * build. A silent skip is the worst outcome, so search one level down and fail loudly if a
 * file genuinely is not there.
 */
function findDesignFile(file) {
  const direct = path.join(DESIGN_ROOT, file);
  if (fs.existsSync(direct)) return direct;
  for (const entry of fs.readdirSync(DESIGN_ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const nested = path.join(DESIGN_ROOT, entry.name, file);
    if (fs.existsSync(nested)) return nested;
  }
  return null;
}
const SRC = DESIGN_ROOT;
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
/**
 * Claude Design links pages to each other by DESIGN FILENAME, e.g.
 * `href="CoachRx Pricing.dc.html"`. Every one of those must be mapped to a real route here or
 * it ships as a literal `.dc.html` URL and 404s.
 *
 * This is exactly what happened when About and Podcasts were added: four inter-page links
 * (Pricing, Roadmap, About, Podcasts) had no entry, so the nav on every new page 404'd while
 * the pages themselves rendered perfectly. The failure is silent because the href looks
 * plausible, so `fixLinks` cannot flag it as a dead link.
 *
 * RULE: adding a page to PAGES means adding it here in the same edit. The assertion below
 * enforces it so this cannot be forgotten again.
 */
const DESIGN_ROUTES = {
  "CoachRx Home v7.dc.html": "/",
  "CoachRx Home.dc.html": "/",
  "CoachRx Features.dc.html": "/features",
  "CoachRx Pricing.dc.html": "/pricing",
  "CoachRx Roadmap.dc.html": "/roadmap",
  // Compiled by scripts/build-changelog.mjs, not the CLI loop, because both need real
  // release data injected. Listed here so fixLinks() can resolve the design-file hrefs the
  // design uses for release rows and prev/next; build-changelog then overwrites those with
  // the real per-release slugs.
  "CoachRx Changelog.dc.html": "/changelog",
  "CoachRx Changelog Entry.dc.html": "/changelog",
  "CoachRx About.dc.html": "/about",
  "CoachRx Podcasts.dc.html": "/podcasts",
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
  // The comparison lives in a section at the bottom of /pricing, not on its own page.
  // /why-coachrx was orphaned (0 inbound links from any compiled page, 3 legacy redirects)
  // and would have meant re-verifying four competitors' pricing forever. Carl killed it
  // 2026-08-23. See design-briefs/BRIEF-20-pricing-comparison.md.
  [/^compare$|why coachrx|how coachrx compares|see how coachrx compares/, "/pricing#compare"],
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

/**
 * Links that must be retargeted even though their current href is already a valid route.
 *
 * TEXT_ROUTES only fires on `href="#"` or an empty href, so a link that already points
 * somewhere plausible is left alone. Right almost always, but Home's "See how CoachRx
 * compares" pointed at /features, which has nothing of the sort on it.
 *
 * There is no comparison anywhere on the site and there will not be one: Carl ruled out
 * publishing competitor pricing or comparison tables (2026-08-23). The destination is now the
 * "Why CoachRx" section at the foot of /pricing, which makes the same case in first person.
 *
 * This is a safety net. BRIEF-20 retexts the Home link to "Why coaches switch" and points it at
 * /pricing#why directly, after which this row is a harmless no-op. Kept because the old text may
 * survive in an un-rerun design file, and a link promising a comparison that does not exist is
 * worse than a slightly generic one.
 *
 * Keep this list very short: it overrides the design file, which is normally wrong to do.
 */
const RETARGET = [
  [/see how coachrx compares|how coachrx compares|^compare( plans| us)?$/, "/pricing#why"],
];

function fixLinks($, root, ctx) {
  $(root).find("a[href]").each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") || "";
    const text = ($a.text() || "").replace(/\s+/g, " ").trim().toLowerCase();

    const retarget = RETARGET.find(([re]) => re.test(text));
    if (retarget && href !== retarget[1]) {
      $a.attr("href", retarget[1]);
      ctx.retargeted = (ctx.retargeted || 0) + 1;
      return;
    }

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
      if (hit) { $a.attr("href", hit[1]); return; }
      // No destination and no text to route on. This happens when renderVals() supplies a null
      // href for a link we do not have a URL for yet, e.g. per-show Spotify links on the
      // podcast page. An anchor with nowhere to go is worse than plain text: it looks
      // clickable, it is focusable, and it reloads the page. Downgrade it to a span so the
      // content still renders and nothing is a dead link.
      const $span = $("<span></span>");
      for (const [k, v] of Object.entries({ ...(el.attribs || {}) })) {
        if (k !== "href") $span.attr(k, v);
      }
      $span.html($a.html() || "");
      $a.replaceWith($span);
      ctx.downgraded = (ctx.downgraded || 0) + 1;
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
 * Nav drift, the general fix.
 *
 * Each design file owns its own nav, so items appear and disappear unevenly between passes.
 * Two things have already gone wrong this way:
 *   - /roadmap shipped with only the Roadmap page linking to it.
 *   - Changelog was dropped from ALL TEN navs in a later pass, orphaning 44 releases.
 *
 * So rather than patching one item, guarantee the set. For each required item, if the nav has
 * no link with that text, clone any existing nav link (so styling is inherited exactly) and
 * insert it at the right position. Skips anything already present, so it is a no-op once the
 * design files agree, and it can never double-insert.
 *
 * Intended order: Features · Resources · Changelog · Roadmap · Pricing
 */
const REQUIRED_NAV = [
  { text: "Changelog", href: "/changelog", before: "Roadmap" },
  { text: "Roadmap", href: "/roadmap", after: "Changelog" },
];

function ensureNavItems($, root, ctx) {
  root.find("nav, footer").each((_, container) => {
    const $c = $(container);
    const find = (t) => $c.find("a, span").filter((_, a) => $(a).text().trim() === t).first();
    // Only touch containers that actually look like navigation.
    const links = $c.find("a");
    if (links.length < 2) return;
    for (const item of REQUIRED_NAV) {
      if (find(item.text).length) continue;
      const $model = links.filter((_, a) => {
        const t = $(a).text().trim();
        return t && t.length < 20 && !/start for free/i.test(t);
      }).first();
      if (!$model.length) continue;
      const $new = $model.clone().attr("href", item.href).text(item.text);
      const $anchorEl = item.before ? find(item.before) : item.after ? find(item.after) : $();
      if ($anchorEl.length && item.before) $anchorEl.before($new);
      else if ($anchorEl.length) $anchorEl.after($new);
      else $model.after($new);
      ctx.navInjected = (ctx.navInjected || 0) + 1;
    }
  });
}


/**
 * Build the canonical footer when a design file leaves <footer> empty.
 *
 * Same gap normalizeNav() had: DESIGN-FILE-CONTRACT.md tells Claude Design not to build the
 * footer, but this compiler could only ADD legal links to an existing one. The changelog design
 * followed the contract and shipped `<footer></footer>`, so those pages had no logo, no link
 * columns and no copyright — and Carl explicitly asked for the white/blue wordmark in every
 * header AND footer.
 *
 * Markup and styling are lifted verbatim from the footer the other ten pages already ship, so a
 * synthesised footer is indistinguishable from a designed one.
 *
 * Runs BEFORE ensureLegalLinks(), which then finds Privacy/Terms already present and no-ops.
 */
const FOOTER_COL = (head, links) =>
  `<div style="display:flex;flex-direction:column;gap:12px"><span style="font-size:12px;font-weight:700;letter-spacing:.12em;color:rgba(255,255,255,.4);text-transform:uppercase">${head}</span>` +
  links.map(([t, h]) => `<a href="${h}" style="font-size:13.5px;color:rgba(255,255,255,.6)">${t}</a>`).join("") +
  `</div>`;

const CANONICAL_FOOTER =
  `<div style="max-width:1200px;margin:0 auto">` +
  `<div style="display:grid;grid-template-columns:1.4fr 1fr 1fr 1fr;gap:40px">` +
  `<div style="display:flex;flex-direction:column;gap:16px">` +
  `<img loading="lazy" decoding="async" src="${"/design/assets/coachrx-primary-whiteblue.png"}" alt="CoachRx" style="height:20px;width:auto;align-self:flex-start">` +
  `<p style="font-size:13px;line-height:1.6;color:rgba(255,255,255,.45);max-width:240px">The operating system for a professional coaching practice. Built by OPEX Fitness.</p>` +
  `</div>` +
  FOOTER_COL("Features", [["Assess", "/features#assess"], ["Consult", "/features#consult"], ["Design", "/features#design"], ["Operate", "/features#operate"], ["Client Experience", "/features#client-experience"]]) +
  FOOTER_COL("Resources", [["Articles", "/articles"], ["Podcasts", "/podcasts"], ["Changelog", "/changelog"], ["Roadmap", "/roadmap"]]) +
  FOOTER_COL("Company", [["Log in", "https://dashboard.coachrx.app/login"], ["About", "/about"], ["Pricing", "/pricing"], ["Contact", "mailto:coachrx@opexfit.com"]]) +
  `</div>` +
  `<div style="display:flex;justify-content:space-between;align-items:center;margin-top:56px;padding-top:24px;border-top:1px solid rgba(255,255,255,.07)">` +
  `<span style="font-size:12.5px;color:rgba(255,255,255,.35)">© ${new Date().getFullYear()} OPEX Fitness LLC. All rights reserved.</span>` +
  `<span style="display:flex;gap:20px"><a href="https://www.opexfit.com/privacy-policy/" style="font-size:12.5px;color:rgba(255,255,255,.4)">Privacy</a><a href="https://www.opexfit.com/terms-and-conditions/" style="font-size:12.5px;color:rgba(255,255,255,.4)">Terms</a></span>` +
  `</div></div>`;

const FOOTER_STYLE = "border-top:1px solid rgba(255,255,255,.08);padding:72px 32px 32px;background:#08090E";

function ensureFooter($, root, ctx) {
  let $footer = root.find("footer").first();
  if (!$footer.length) {
    root.append(`<footer data-screen-label="Footer" style="${FOOTER_STYLE}"></footer>`);
    $footer = root.find("footer").first();
  }
  const hasLogo = $footer.find("img").filter((_, e) => /coachrx-(primary|wordmark)/i.test($(e).attr("src") || "")).length;
  const links = $footer.find("a").length;
  // A real designed footer has a wordmark and a dozen-plus links. Anything less is an empty shell
  // that only ensureLegalLinks() has touched.
  if (hasLogo && links >= 8) return;

  if (!($footer.attr("style") || "").trim()) $footer.attr("style", FOOTER_STYLE);
  $footer.empty().append(CANONICAL_FOOTER);
  ctx.footerSynthesised = true;
}

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


/**
 * Mobile navigation, guaranteed on every page.
 *
 * WHY THIS IS IN THE COMPILER AND NOT THE DESIGN
 * Home v7 has a proper burger and full-screen sheet. About and Podcasts inherited part of it.
 * Seven pages had NOTHING: no burger, no sheet, and a nav that simply vanished below 1080px
 * with no way to reach any other page. Around 90% of CoachRx traffic is mobile, so that is the
 * single most damaging defect on the site.
 *
 * Each design file owns its own nav, so this has drifted three times already. Guaranteeing it
 * here means it cannot drift again, and it stays in sync because the sheet is built from the
 * page's OWN nav links rather than a hardcoded list.
 *
 * Skips any page that already has `.crx-burger`, so Home keeps its hand-built version and this
 * becomes a no-op once the design files agree.
 */
function ensureMobileNav($, root, ctx) {
  const $nav = root.find("nav").first();
  if (!$nav.length) return;
  if ($nav.find(".crx-burger").length || root.find(".crx-sheet").length) return;

  // Build the sheet from this page's own nav, so the two can never disagree.
  const items = [];
  $nav.find("a").each((_, a) => {
    const $a = $(a);
    const text = $a.text().trim();
    const href = $a.attr("href") || "";
    if (!text || text.length > 24) return;
    if (/start for free/i.test(text)) return;              // the CTA is pinned to the bottom
    if (items.some((i) => i.text === text)) return;        // dropdown parents duplicate
    items.push({ text, href });
  });
  if (items.length < 2) return;

  const login = items.find((i) => /^log ?in$/i.test(i.text));
  const links = items.filter((i) => i !== login);

  const li = (i, cls) =>
    `<a href="${i.href}" style="color:${cls};font-size:20px;font-weight:600;padding:13px 0;min-height:44px;display:flex;align-items:center">${i.text}</a>`;

  const sheet =
    `<div id="mobileSheet" class="crx-sheet" aria-hidden="true">` +
    links.map((i) => li(i, "#F8FCFF")).join("") +
    `<span style="height:1px;background:rgba(255,255,255,.08);margin:16px 0"></span>` +
    (login ? li(login, "rgba(255,255,255,.68)") : "") +
    `<a href="https://dashboard.coachrx.app/signup" style="margin-top:auto;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg,#7BFF96,#58FF7A);color:#0A0B0F;font-size:15px;font-weight:800;letter-spacing:.06em;padding:16px 0;border-radius:10px;text-transform:uppercase;box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 0 44px rgba(88,255,122,.35)">Start for free</a>` +
    `</div>`;

  const bar = (n, extra) =>
    `<span data-bar="${n}" style="display:block;width:20px;height:2px;background:#F8FCFF;border-radius:2px;transition:${extra}"></span>`;
  const burger =
    `<button id="navBurger" class="crx-burger" type="button" aria-expanded="false" aria-controls="mobileSheet" aria-label="Open menu">` +
    bar(1, "transform .25s cubic-bezier(.22,1,.36,1)") +
    bar(2, "opacity .2s") +
    bar(3, "transform .25s cubic-bezier(.22,1,.36,1)") +
    `</button>`;

  // Wrap the existing nav children so they can be hidden as a group below 1080px.
  const $kids = $nav.children();
  if (!$nav.find(".crx-navlinks").length) {
    $kids.slice(1).wrapAll('<span class="crx-navlinks" style="display:flex;align-items:center;gap:24px"></span>');
  }
  $nav.append(burger);
  $nav.after(sheet);
  ctx.mobileNavInjected = true;
}

const MOBILE_NAV_CSS = `
/* Injected by dc-compile ensureMobileNav(). See that function for why. */
.crx-burger{display:none;flex-direction:column;gap:4px;align-items:center;justify-content:center;width:44px;height:44px;background:none;border:none;cursor:pointer;padding:0;flex:none}
.crx-burger.is-open [data-bar="1"]{transform:translateY(6px) rotate(45deg)}
.crx-burger.is-open [data-bar="2"]{opacity:0}
.crx-burger.is-open [data-bar="3"]{transform:translateY(-6px) rotate(-45deg)}
.crx-sheet{position:fixed;inset:0;z-index:90;background:rgba(10,11,15,.98);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);display:flex;flex-direction:column;align-items:stretch;padding:84px 24px 28px;transform:translateY(-102%);transition:transform .28s cubic-bezier(.22,1,.36,1),visibility .28s;visibility:hidden}
.crx-sheet.is-open{transform:translateY(0);visibility:visible}
body.crx-noscroll{overflow:hidden}
@media (max-width:1080px){
  .crx-navlinks{display:none!important}
  .crx-burger{display:flex}
}
`;

const MOBILE_NAV_JS = `
/* Injected by dc-compile ensureMobileNav(). Plain DOM, no setState: compiled pages have none. */
(function(){
  var b=document.getElementById("navBurger"), s=document.getElementById("mobileSheet");
  if(!b||!s) return;
  function set(open){
    b.classList.toggle("is-open",open); s.classList.toggle("is-open",open);
    b.setAttribute("aria-expanded",open?"true":"false");
    s.setAttribute("aria-hidden",open?"false":"true");
    b.setAttribute("aria-label",open?"Close menu":"Open menu");
    document.body.classList.toggle("crx-noscroll",open);
    if(open){ var f=s.querySelector("a"); if(f) f.focus(); } else { b.focus(); }
  }
  b.addEventListener("click",function(){ set(!s.classList.contains("is-open")); });
  document.addEventListener("keydown",function(e){ if(e.key==="Escape"&&s.classList.contains("is-open")) set(false); });
  s.addEventListener("click",function(e){ if(e.target.tagName==="A") set(false); });
  window.addEventListener("resize",function(){ if(window.innerWidth>1080&&s.classList.contains("is-open")) set(false); });
})();
`;


/**
 * Responsive backstop, applied to every page.
 *
 * WHY
 * Around 90% of CoachRx traffic is mobile. Home has 9 media queries and Features has 3; every
 * other page has one or two, which is effectively no mobile design at all. These pages are
 * almost entirely inline-styled, so a fixed `grid-template-columns:repeat(3,1fr)` or a
 * `width:520px` in a style attribute cannot be overridden without `!important` and an attribute
 * selector.
 *
 * This is deliberately NOT a substitute for designing each page for mobile. It is a floor: at
 * 760px and below, nothing overflows, nothing is unreadably narrow, and every multi-column
 * layout becomes a single column. Where a page already has proper mobile rules they agree with
 * these, so nothing regresses.
 *
 * Appended last so it wins over inline styles. Kept narrow on purpose — only rules that are
 * always correct on a phone.
 */
const RESPONSIVE_BACKSTOP = `
@media (max-width:760px){
  /* Nothing may push the page wider than the viewport. */
  html,body{max-width:100%;overflow-x:hidden}
  img,svg,video,iframe{max-width:100%!important}

  /* Every multi-column grid collapses. Covers repeat(n), fr pairs and fixed-first columns. */
  [style*="grid-template-columns"]{grid-template-columns:1fr!important}

  /* Fixed pixel widths become fluid. Three digits and up, so 44px targets survive. */
  [style*="width:1"][style*="px"],[style*="width:2"][style*="px"],
  [style*="width:3"][style*="px"],[style*="width:4"][style*="px"],
  [style*="width:5"][style*="px"],[style*="width:6"][style*="px"],
  [style*="width:7"][style*="px"],[style*="width:8"][style*="px"],
  [style*="width:9"][style*="px"]{max-width:100%!important}

  /* min-width floors are the most common cause of horizontal scroll. */
  [style*="min-width:1"],[style*="min-width:2"],[style*="min-width:3"],
  [style*="min-width:4"],[style*="min-width:5"],[style*="min-width:6"],
  [style*="min-width:7"],[style*="min-width:8"],[style*="min-width:9"]{min-width:0!important}

  /* nowrap text overflows instead of wrapping. An overflowing line is worse than a wrapped pill. */
  [style*="white-space:nowrap"]{white-space:normal!important}

  /* A sticky column in a single-column stack pins itself over the content below it. */
  [style*="position:sticky"]{position:static!important}

  /* Viewport-width units plus a scrollbar equals horizontal scroll. */
  [style*="vw"]{max-width:100%!important}

  /* Absolutely positioned side panels and vignettes stack instead of colliding. */
  [style*="position:absolute"][style*="right:0"],
  [style*="position:absolute"][style*="right:-"],
  [style*="position:absolute"][style*="bottom:0"][style*="right"]{position:relative!important;right:auto!important;bottom:auto!important;top:auto!important;left:auto!important;transform:none!important;width:100%!important;margin-top:20px}

  /* Tall scroll-driven spacers become dead scrolling on a phone. */
  [style*="height:230vh"],[style*="height:200vh"],[style*="height:180vh"]{height:auto!important;min-height:0!important}

  /* Section rhythm. 110px of vertical padding is a lot of scrolling on a phone. */
  section,header,footer{padding-left:20px!important;padding-right:20px!important}
  [style*="padding:110px"],[style*="padding:130px"],[style*="padding:140px"],[style*="padding:150px"],[style*="padding:170px"]{padding-top:64px!important;padding-bottom:64px!important}

  /* Type: stop desktop display sizes from wrapping to one word per line. */
  h1{font-size:clamp(32px,8.5vw,44px)!important}
  h2{font-size:clamp(24px,6.5vw,32px)!important}
  h3{font-size:clamp(18px,5vw,22px)!important}

  /* Multi-column text never works on a phone. */
  [style*="columns:2"],[style*="columns: 2"]{columns:1!important}

  /* Anything genuinely wide scrolls rather than breaking the page. */
  table{display:block;overflow-x:auto}

  /* Touch targets. */
  a,button,[role="button"]{min-height:44px}
  nav a,nav button,.crx-sheet a{min-height:44px;display:flex;align-items:center}
}
`;



/**
 * The canonical nav, built the same way on every page.
 *
 * THREE PROBLEMS THIS SOLVES
 * 1. `Log in` and `Start for free` were sitting inside the centred link group, because the
 *    mobile-nav wrapper had swept every child after the logo into one span. Every serious SaaS
 *    nav puts auth actions hard right: Linear, Stripe, Vercel, Notion, Figma all do. So the nav
 *    is now three real grid columns — logo left, links centred, actions right.
 * 2. Seven top-level items is too many. Changelog and Roadmap are the same idea seen from two
 *    directions, what shipped and what is coming, so they group under one `Updates` menu. That
 *    takes the centre from seven items to four, which is where the best navs sit.
 * 3. `About` comes out of the nav entirely. Nobody navigates to About from a SaaS nav; it lives
 *    in the footer Company column, where it already is.
 *
 * Final shape:  Features · Resources ▾ · Updates ▾ · Pricing    |   Log in   [Start for free]
 *   Resources ▾  Articles, Podcasts
 *   Updates ▾    Changelog, Roadmap
 *
 * Built here rather than in the design files because each file owns its own nav and this has
 * drifted on every single pass. Doing it once at compile time is the only way it stays identical.
 */
const NAV_MENUS = [
  { label: "Resources", items: [["Articles", "/articles"], ["Podcasts", "/podcasts"]] },
  { label: "Updates", items: [["Changelog", "/changelog"], ["Roadmap", "/roadmap"]] },
];
const NAV_ORDER = ["Features", "Resources", "Updates", "Pricing"];

function normalizeNav($, root, ctx) {
  const $nav = root.find("nav").first();
  if (!$nav.length) return;

  // Some design files put their own hamburger button INSIDE the nav (Home does), and $nav.empty()
  // below threw it away, leaving a mobile sheet with no way to open it. That is exactly the "no
  // hamburger nav" Carl reported. Harvest it and put it back after the rebuild.
  const $burger = $nav.find(".crx-burger").first();
  const $burgerKeep = $burger.length ? $burger.clone() : null;

  // Harvest what the page already has, so styling is inherited rather than invented.
  const found = new Map();
  let $cta = null, $login = null, $logo = null;
  $nav.find("a").each((_, a) => {
    const $a = $(a);
    const t = $a.text().trim();
    if ($a.find("img").length && !$logo) { $logo = $a; return; }
    if (/start for free|free trial/i.test(t)) { if (!$cta) $cta = $a; return; }
    if (/^log ?in$|^sign ?in$/i.test(t)) { if (!$login) $login = $a; return; }
    if (t && !found.has(t)) found.set(t, $a);
  });
  if (!$logo) {
    // On some pages the logo is a bare <img> child of <nav>, so .parent() is the nav itself and
    // cloning it nests a whole <nav> inside the nav. Wrap the image instead.
    const $img = $nav.find("img").first();
    $logo = $img.length
      ? $('<a href="/" aria-label="CoachRx home" style="display:inline-flex"></a>').append($img.clone())
      : null;
  }
  // A design file that follows DESIGN-FILE-CONTRACT.md leaves <nav> completely empty, because the
  // compiler owns the nav. Until now this function could only NORMALISE an existing nav, so an
  // empty one produced a page with no header and no logo at all — the contract and the compiler
  // disagreed. Build from scratch instead of bailing.
  if (!$logo || !$logo.length) {
    $logo = $(`<a href="/" aria-label="CoachRx home" style="display:inline-flex"><img src="${CANONICAL_LOGO}" alt="CoachRx" width="1500" height="388" style="height:22px;width:auto" loading="eager" decoding="async"></a>`);
    ctx.navSynthesised = true;
  }

  const $model = found.get("Features") || found.get("Pricing") || [...found.values()][0];
  const linkStyle = ($model && $model.length && $model.attr("style")) ||
    "color:rgba(255,255,255,.68);font-size:14px;font-weight:500";

  // The caret is an inline <svg> appended after the label. On an inline <a> the line box can
  // break between the two, dropping the caret onto its own line under the word — which is the
  // "arrow toggles are under the words" Carl reported. inline-flex + nowrap makes that impossible.
  const NOWRAP = ";display:inline-flex;align-items:center;white-space:nowrap";
  const plain = (label, href) =>
    $("<a></a>").attr("href", href).attr("style", linkStyle + NOWRAP).text(label);

  const menu = (label, items) => {
    const $wrap = $('<span class="crx-menu" style="position:relative;display:inline-flex;align-items:center;height:60px"></span>');
    const $trigger = plain(label, items[0][1]).append(
      '<svg width="9" height="6" viewBox="0 0 9 6" fill="none" style="opacity:.6;margin-left:6px"><path d="M1 1l3.5 3.5L8 1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"></path></svg>'
    );
    const rows = items
      .map(([t, h]) =>
        `<a href="${h}" style="display:flex;align-items:center;min-height:44px;padding:0 12px;border-radius:8px;font-size:13.5px;color:rgba(255,255,255,.72)">${t}</a>`
      )
      .join("");
    return $wrap
      .append($trigger)
      .append(
        `<span class="crx-menudd" style="position:absolute;top:100%;left:-16px;padding-top:8px"><span style="display:flex;flex-direction:column;background:#14151A;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:8px;min-width:180px;box-shadow:0 24px 56px rgba(0,0,0,.6)">${rows}</span></span>`
      );
  };

  // Middle column, in canonical order.
  const $links = $('<span class="crx-navlinks" style="display:flex;align-items:center;gap:26px;justify-self:center"></span>');
  for (const label of NAV_ORDER) {
    const m = NAV_MENUS.find((x) => x.label === label);
    if (m) { $links.append(menu(m.label, m.items)); continue; }
    const existing = found.get(label);
    $links.append(existing && existing.length ? existing.clone() : plain(label, "/" + label.toLowerCase()));
  }

  // Right column. Actions hard right, which is the whole point of item 1 above.
  const $actions = $('<span class="crx-navactions" style="display:flex;align-items:center;gap:20px;justify-self:end"></span>');
  $actions.append(
    ($login && $login.length ? $login.clone() : plain("Log in", "https://dashboard.coachrx.app/login"))
      .attr("href", "https://dashboard.coachrx.app/login")
      .text("Log in")   // some pages said "Sign in"; one label everywhere
  );
  // Pricing and Roadmap shipped without a nav CTA at all, so there was nothing to harvest.
  // Synthesise one in the house style rather than leaving the right column half empty — the nav
  // CTA is the single most valuable element on a marketing page.
  const $ctaOut = ($cta && $cta.length ? $cta.clone() : $("<a></a>").attr("style",
    "background:linear-gradient(180deg,#7BFF96,#58FF7A);color:#0A0B0F;font-size:13px;font-weight:700;" +
    "letter-spacing:.04em;padding:9px 18px;border-radius:10px;text-transform:uppercase;white-space:nowrap;" +
    "box-shadow:inset 0 1px 0 rgba(255,255,255,.45),0 0 24px rgba(88,255,122,.25)"
  ).text("Start for free"));
  $actions.append($ctaOut.attr("href", "https://dashboard.coachrx.app/signup"));

  // An empty <nav> carries no styling either, so it would render as a plain unfixed strip.
  const BASE_NAV_STYLE =
    "position:fixed;top:0;left:0;right:0;z-index:99;height:60px;padding:0 32px;" +
    "background:rgba(10,11,15,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);" +
    "border-bottom:1px solid rgba(255,255,255,.08)";
  const existing = ($nav.attr("style") || "").replace(/justify-content:[^;]*;?/g, "");
  const style = existing.trim() ? existing : BASE_NAV_STYLE;
  $nav.attr("style", style + ";display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px");
  $nav.empty().append($logo.clone(), $links, $actions);
  // Below 1080px .crx-navlinks and .crx-navactions are display:none, so they vacate their grid
  // cells and auto-placement would drop the burger into the MIDDLE column. Pin it right.
  if ($burgerKeep) $nav.append($burgerKeep.attr("style",
    ($burgerKeep.attr("style") || "") + ";grid-column:3;justify-self:end"));
  ctx.navRebuilt = true;
}

const NAV_CSS = `
/* Injected by dc-compile normalizeNav(). CSS-only dropdown: no JS, keyboard accessible. */
.crx-menudd{display:none}
.crx-menu:hover .crx-menudd,.crx-menu:focus-within .crx-menudd{display:block}
.crx-menudd a:hover{background:rgba(255,255,255,.05);color:#F8FCFF}
.crx-navactions a:last-child{white-space:nowrap}
@media (max-width:1080px){
  .crx-menudd{display:none!important}
  .crx-navactions{display:none!important}
  /* Links and actions vacate their grid cells at this width, so pin the burger to column 3
     or auto-placement centres it. Covers both the design's own burger and the injected one. */
  nav .crx-burger{grid-column:3;justify-self:end}
}
`;


/**
 * <image-slot> is a Claude Design placeholder element, not an image.
 *
 * The Podcasts page uses it for all 22 show covers. Claude Design draws a styled placeholder in
 * its own preview via ./image-slot.js, a script that does not exist in this build, so every
 * cover rendered as nothing on the live site.
 *
 * Real cover art now exists in public/design/assets/podcasts, keyed by a slug of the show name
 * in src/data/podcast-covers.json. Match on that and emit a real <img>. If a show has no cover
 * yet, fall back to a branded monogram tile rather than a hole.
 *
 * Every cover is square: the 20 that arrived square are untouched, and the two that arrived as
 * a 2.42:1 banner and a 16:9 frame were PADDED to square, not cropped. Cropping a 2.42:1 image
 * to 1:1 removes ~59% of its width and cuts through faces and wordmarks. Because the art is
 * square and the tile is square, `object-fit:cover` crops nothing at all, so faces are safe by
 * construction rather than by tuning object-position per image.
 */

/**
 * Collapse tall fixed-height boxes below 760px.
 *
 * This is the single biggest mobile defect. The designs use tall boxes as viewports for
 * scroll-driven panels and cropped screenshots: `height:619px`, `height:700px`,
 * `height:230vh` and so on. On a phone the content inside is one narrow column or one
 * image, so the box keeps its full height and you scroll through screens of nothing. Carl
 * reported it on Home (before The Problem, before 04 Coaching Intelligence, before Custom
 * Theming), on Features between every section, and in the Pricing header.
 *
 * The old backstop only zeroed three hardcoded vh values, which was never going to hold.
 *
 * Done by PARSING the style attribute rather than with `[style*="height:4"]` selectors,
 * because substring matching also hits `line-height:4`, `max-height:400px` and
 * `min-height:5...`, and would have collapsed things that must keep their height.
 *
 * Thresholds: 400px and 90vh. Below those the height is usually deliberate and small enough
 * to be fine on a phone — the 288px phone mockup frame and 130px cards keep their geometry.
 */

/**
 * Fill in per-show YouTube and Spotify links on the Podcasts page.
 *
 * The design has no platform links at all today; BRIEF-21 adds them. It emits, per show card,
 * anchors carrying `data-platform="youtube"` / `data-platform="spotify"` with any placeholder
 * href, and this replaces the href with the real one from src/data/podcast-links.json, keyed by
 * the show name on the card.
 *
 * A show with no link for a platform has that anchor REMOVED rather than left pointing nowhere.
 * The links were recovered from the archived Squarespace podcast-network page. Proximity parsing
 * mis-assigned several (three shows ended up sharing one Spotify URL), so anything claimed by
 * more than one show was dropped unless the channel handle matched the show name. 14 of 22 shows
 * have YouTube and 15 have Spotify; the rest are genuinely unknown and Carl has the gap list.
 *
 * No-op until the design emits the anchors, so it is safe to ship ahead of the design pass.
 */
function fillPodcastLinks($, root, ctx) {
  const anchors = root.find("[data-platform]");
  if (!anchors.length) return;

  let links = {};
  try {
    links = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "data", "podcast-links.json"), "utf8"));
  } catch { return; }

  const norm = (t) => (t || "").replace(/\s+/g, " ").trim().toLowerCase();
  const byName = new Map(Object.entries(links).map(([k, v]) => [norm(k), v]));

  let set = 0, dropped = 0;
  anchors.each((_, el) => {
    const $a = $(el);
    const platform = ($a.attr("data-platform") || "").toLowerCase();
    // Walk up to the card and read its show name from the cover image alt, which the compiler
    // already guarantees is the show name.
    let show = "";
    let $p = $a.parent();
    for (let i = 0; i < 6 && $p.length && !show; i++) {
      const alt = $p.find('img[src*="/podcasts/"]').first().attr("alt");
      if (alt) show = alt;
      $p = $p.parent();
    }
    const url = byName.get(norm(show))?.[platform];
    if (url) { $a.attr("href", url).attr("target", "_blank").attr("rel", "noopener"); set++; }
    else { $a.remove(); dropped++; }
  });
  ctx.podcastLinks = { set, dropped };
}

const TALL_PX = 400, TALL_VH = 90;
function collapseTallBoxes($, root, ctx) {
  let n = 0;
  root.find('[style]').each((_, el) => {
    const $el = $(el);
    const style = $el.attr("style") || "";
    // Only a real `height:` declaration: must start the declaration, so `line-height` and
    // `max-height`/`min-height` are skipped.
    const m = /(?:^|;)\s*height:\s*(\d+(?:\.\d+)?)(px|vh)\s*(?:;|$)/i.exec(style);
    if (!m) return;
    const v = parseFloat(m[1]), unit = m[2].toLowerCase();
    if (!((unit === "px" && v >= TALL_PX) || (unit === "vh" && v >= TALL_VH))) return;
    $el.attr("class", (($el.attr("class") || "") + " crx-mtall").trim());
    n++;
  });
  if (n) { ctx.tallCollapsed = n; }
}

const TALL_CSS = `
/* Injected by dc-compile collapseTallBoxes(). See that function for why. */
@media (max-width:760px){
  .crx-mtall{height:auto!important;min-height:0!important;max-height:none!important}
  /* An empty scroll-track div collapses to nothing rather than leaving a gap. */
  .crx-mtall:empty{display:none!important}
}
`;

function renderImageSlots($, root, ctx) {
  const slots = root.find("image-slot");
  if (!slots.length) return;

  let covers = {};
  try {
    covers = JSON.parse(fs.readFileSync(path.join(process.cwd(), "src", "data", "podcast-covers.json"), "utf8"));
  } catch { /* no manifest yet: every slot falls back to a monogram */ }

  const slug = (t) =>
    t.normalize("NFKD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  let withArt = 0, withoutArt = [];
  slots.each((_, el) => {
    const $el = $(el);
    const label = ($el.attr("placeholder") || "").replace(/\s*cover art\s*$/i, "").trim();
    const file = covers[slug(label)];

    if (file) {
      withArt++;
      $el.replaceWith(
        `<img src="/design/assets/podcasts/${file}" alt="${label}" loading="lazy" decoding="async" ` +
          `width="640" height="640" style="display:block;width:100%;aspect-ratio:1/1;` +
          `object-fit:cover;border-radius:12px;border:1px solid rgba(255,255,255,.08)">`
      );
      return;
    }

    withoutArt.push(label || "(unlabelled)");
    const initials =
      label.split(/\s+/).filter((w) => /^[A-Za-z0-9]/.test(w)).slice(0, 2)
        .map((w) => w[0].toUpperCase()).join("") || "CR";
    $el.replaceWith(
      `<span role="img" aria-label="${label || "CoachRx"}" style="display:flex;align-items:center;justify-content:center;` +
        `aspect-ratio:1/1;width:100%;border-radius:12px;background:linear-gradient(160deg,#1B1C23,#101118);` +
        `border:1px solid rgba(255,255,255,.08);font-family:var(--font-mono);font-size:22px;font-weight:600;` +
        `letter-spacing:.14em;color:rgba(255,255,255,.38)">${initials}</span>`
    );
  });
  ctx.coversUsed = withArt;
  ctx.coversMissing = withoutArt;
}


/**
 * One logo, everywhere.
 *
 * The wordmark exists in white, white/green and white/blue variants, and different pages
 * referenced different ones — including a stale `coachrx-primary-white.png` and, briefly, a
 * whitegreen file I had aliased in when the whiteblue was missing. The brand mark is white
 * "Coach" with light-blue "Rx", so every header and footer instance is forced to that file.
 *
 * Cheap to enforce here and impossible to enforce across ten hand-maintained design files.
 */
const CANONICAL_LOGO = "/design/assets/coachrx-primary-whiteblue.png";
function enforceLogo($, root, ctx) {
  let n = 0;
  root.find("img").each((_, el) => {
    const $img = $(el);
    const src = $img.attr("src") || "";
    if (!/coachrx-(primary|wordmark)/i.test(src)) return;
    if (src.endsWith("coachrx-primary-whiteblue.png")) return;
    $img.attr("src", CANONICAL_LOGO);
    n++;
  });
  if (n) ctx.logosNormalised = n;
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
  $('script[src^="./"]').remove();   // Claude Design preview-only runtime; 404s in this build
  $('script[type="text/x-dc"]').remove();

  const root = $("x-dc").length ? $("x-dc") : $("body");
  const ctx = { hoverRules: [], unresolved: new Set(), deadLinks: [] };
  compileNode($, root, data, ctx);
  applyLeaf($, root, data, ctx);
  fixLinks($, root, ctx);
  ensureNavItems($, root, ctx);
  ensureFooter($, root, ctx);
  ensureLegalLinks($, root, ctx);
  normalizeNav($, root, ctx);
  ensureMobileNav($, root, ctx);
  renderImageSlots($, root, ctx);
  collapseTallBoxes($, root, ctx);
  fillPodcastLinks($, root, ctx);
  enforceLogo($, root, ctx);

  return {
    html: (root.html() || "").trim(),
    // Mobile nav CSS/JS must ride along here too, not just in the CLI path below. The blog
    // templates and the roadmap are compiled through this exported function and write their own
    // .ts files, so without this they got the burger markup and none of the styling or wiring.
    css: [css, "", "/* style-hover attributes, compiled to real rules */", ...ctx.hoverRules,
      ctx.mobileNavInjected ? MOBILE_NAV_CSS : "", NAV_CSS, TALL_CSS, RESPONSIVE_BACKSTOP].join("\n"),
    script: scriptSrc + (ctx.mobileNavInjected ? MOBILE_NAV_JS : ""),
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
// Fail the build if a page is compiled but has no route mapping. Without this, an unmapped
// page's inter-page links ship as literal ".dc.html" URLs and 404 silently.
for (const pg of PAGES) {
  if (!(pg.file in DESIGN_ROUTES)) {
    console.error(`dc-compile: "${pg.file}" is in PAGES but missing from DESIGN_ROUTES.`);
    console.error(`  Add it, or every link to this page will ship as a .dc.html URL and 404.`);
    process.exit(1);
  }
}

const CLI_SKIP = new Set(["blogPost", "blogIndex", "tagArchive"]);

if (process.argv[1] && process.argv[1].endsWith("dc-compile.mjs")) {
fs.mkdirSync(OUT, { recursive: true });
const report = [];

for (const page of PAGES) {
  if (CLI_SKIP.has(page.name)) continue;
  const full = findDesignFile(page.file);
  if (!full) {
    console.error(`dc-compile: cannot find "${page.file}" in ${SRC} or any subfolder.`);
    console.error(`  A missing design file used to skip silently and ship an empty page. Failing instead.`);
    process.exit(1);
  }

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
  ensureNavItems($, root, ctx);
  ensureFooter($, root, ctx);
  ensureLegalLinks($, root, ctx);
  normalizeNav($, root, ctx);
  ensureMobileNav($, root, ctx);
  renderImageSlots($, root, ctx);
  collapseTallBoxes($, root, ctx);
  fillPodcastLinks($, root, ctx);
  enforceLogo($, root, ctx);

  const html = (root.html() || "").trim();
  const finalCss = [css, "", "/* style-hover attributes, compiled to real rules */", ...ctx.hoverRules,
    ctx.mobileNavInjected ? MOBILE_NAV_CSS : "", NAV_CSS, TALL_CSS, RESPONSIVE_BACKSTOP].join("\n");

  // data minus functions, so pages can reuse the design's own copy where useful
  const plain = JSON.parse(JSON.stringify(data, (k, v) => (typeof v === "function" ? undefined : v)));

  fs.writeFileSync(
    path.join(OUT, `${page.name}.ts`),
    `// GENERATED by scripts/dc-compile.mjs from "${page.file}". Do not edit by hand.\n` +
    `export const html = ${JSON.stringify(html)};\n` +
    `export const css = ${JSON.stringify(finalCss)};\n` +
    `export const script = ${JSON.stringify(scriptSrc + (ctx.mobileNavInjected ? MOBILE_NAV_JS : ""))};\n` +
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

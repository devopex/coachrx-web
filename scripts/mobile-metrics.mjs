/**
 * Snapshot the mobile-critical facts about every compiled page.
 *
 * Written because Carl's most repeated instruction is "do not break mobile", and mobile broke
 * three times in ways a green build could not see: a carousel silently rendering as a stack
 * because an inline grid track was force-collapsed, tall boxes collapsing when they were crop
 * frames, and an !important backstop rule overriding the design's own mobile work.
 *
 * These are the facts that, if they move in the wrong direction, mean mobile got worse. Compared
 * before and after every design pass by scripts/check-mobile.mjs.
 */
import fs from "node:fs";
import * as cheerio from "cheerio";

const G = "src/generated";
export function snapshot() {
  const out = {};
  for (const f of fs.readdirSync(G).filter((x) => x.endsWith(".ts") && !/manifest|topic-pages/.test(x))) {
    const s = fs.readFileSync(`${G}/${f}`, "utf8");
    const g = (re) => { const m = s.match(re); return m ? JSON.parse(m[1]) : ""; };
    const html = g(/export const html = (".*?");\nexport const css/s);
    const css = g(/export const css = (".*?");\nexport const script/s);
    const script = g(/export const script = (".*?");\n/s);
    if (!html) continue;
    const $ = cheerio.load(html, null, false);
    const n = f.replace(".ts", "");
    out[n] = {
      // must not decrease
      mobileBlocks: (css.match(/max-width:\s*760px/g) || []).length,
      tallCollapsed: $(".crx-mtall").length,
      // Counts images that get object-fit either inline OR via a hoisted class. dc-compile now
      // lifts repeated inline styles onto shared classes (553KB -> 314KB on the blog index), so
      // counting only inline styles reported a phantom regression: podcasts fell 22 -> 0 while
      // rendering identically.
      objectFitImgs: (() => {
        const hoisted = new Set(
          [...css.matchAll(/\.(crx-h\d+)\{([^}]*)\}/g)]
            .filter((m) => /object-fit/.test(m[2]))
            .map((m) => m[1]),
        );
        return $("img").toArray().filter((e) => {
          if (/object-fit/.test($(e).attr("style") || "")) return true;
          return ($(e).attr("class") || "").split(/\s+/).some((c) => hoisted.has(c));
        }).length;
      })(),
      // must stay exactly
      burger: $(".crx-burger").length,
      sheet: $(".crx-sheet").length,
      burgerJS: /navBurger/.test(script) ? 1 : 0,
      overflowGuard: /overflow-x:hidden/.test(css) ? 1 : 0,
      // must stay zero
      marginCrops: $("img[style]").toArray().filter((e) => {
        const st = $(e).attr("style") || "";
        const w = /(?:^|;)\s*width:\s*(\d+(?:\.\d+)?)%/.exec(st);
        return w && parseFloat(w[1]) > 100 && /margin:\s*-/.test(st);
      }).length,
      unsafeCollapsed: $(".crx-mtall").toArray().filter((el) => {
        const st = $(el).attr("style") || "";
        const crop = /overflow:\s*hidden/.test(st) && $(el).find("img").toArray().some((im) => {
          const w = /width:\s*(\d+)%/.exec($(im).attr("style") || ""); return w && +w[1] > 100;
        });
        return crop || $(el).children().toArray().some((k) => /position:\s*absolute/.test($(k).attr("style") || ""));
      }).length,
      carouselAsGrid: $('[class*="car"]').toArray().filter((e) => /display:\s*grid/.test($(e).attr("style") || "")).length,
      cardsWithMinWidth: $('[class*="car"] > *').toArray().filter((e) => /min-width:\s*\d{3,}px/.test($(e).attr("style") || "")).length,
      stateHandlers: (html.match(/data-dc-on-\w+="[^"]*setState/g) || []).length,
      imgWithIntrinsicOnCrop: $("img").toArray().filter((e) => {
        const st = $(e).attr("style") || "";
        return $(e).attr("width") && $(e).attr("height") && /width:\s*(1[1-9]\d|[2-9]\d\d)%/.test(st);
      }).length,
    };
  }
  return out;
}

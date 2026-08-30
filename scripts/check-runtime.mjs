/**
 * Runtime smoke test for every compiled design script.
 *
 * Why this exists: on 2026-08-29 a single `React.createElement` inside home's renderVals() shipped
 * to staging. React is a global inside Claude Design but not in the compiled bundle, so
 * renderVals() threw, DcRuntime caught it, componentDidMount() never ran, and EVERY animation and
 * scroll behaviour on the page was silently dead. The page looked fine, compiled fine, passed the
 * mobile gate, and built fine. Nothing caught it except a human noticing on staging.
 *
 * This loads each script the exact way DcRuntime does — same sandbox, same injected globals — and
 * fails the build if construction or renderVals() throws.
 */
import fs from "node:fs";
import path from "node:path";

const GEN = path.join(process.cwd(), "src/generated");

// Mirror the globals DcRuntime provides. If you add one there, add it here.
const React = { createElement: (type, props) => ({ type, props }) };

function stubDom() {
  const el = () => ({
    style: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
    setAttribute() {}, getAttribute: () => null, addEventListener() {}, removeEventListener() {},
    querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({ top: 0, left: 0, width: 0, height: 0, bottom: 0, right: 0 }),
    appendChild() {}, focus() {}, getContext: () => null, children: [], attributes: [],
  });
  globalThis.document = {
    ...el(),
    body: el(), documentElement: el(),
    createElement: el, getElementById: () => null,
    querySelector: () => null, querySelectorAll: () => [],
  };
  globalThis.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
  globalThis.window = { addEventListener() {}, removeEventListener() {}, innerWidth: 1440, innerHeight: 900, matchMedia: globalThis.matchMedia, scrollY: 0 };
  globalThis.performance = { now: () => 0 };
  globalThis.requestAnimationFrame = () => 0;
  globalThis.cancelAnimationFrame = () => {};
  globalThis.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
}

class DCLogic {
  constructor(props) { this.props = props || {}; }
  q() { return []; }
  setState() {}
  scrollToPanel() {}
}

stubDom();

const files = fs.readdirSync(GEN).filter((f) => f.endsWith(".ts"));
let failed = 0, checked = 0;

for (const f of files) {
  const src = fs.readFileSync(path.join(GEN, f), "utf8");
  const m = src.match(/export const script = ((?:"(?:[^"\\]|\\.)*"))/s);
  if (!m) continue;
  const script = JSON.parse(m[1]);
  if (!script.trim()) continue;
  checked++;
  const name = f.replace(".ts", "");

  let Component;
  try {
    Component = new Function("DCLogic", "React", `${script}\n;return Component;`)(DCLogic, React);
  } catch (err) {
    console.error(`check-runtime: ${name} — script failed to load: ${err.message}`);
    failed++;
    continue;
  }

  let inst;
  try {
    inst = new Component({});
  } catch (err) {
    console.error(`check-runtime: ${name} — constructor threw: ${err.message}`);
    failed++;
    continue;
  }

  try {
    if (typeof inst.renderVals === "function") inst.renderVals();
  } catch (err) {
    console.error(`check-runtime: ${name} — renderVals() threw: ${err.message}`);
    console.error(`  DcRuntime catches this, so the page still renders — but componentDidMount()`);
    console.error(`  never runs and every animation and scroll behaviour is silently dead.`);
    console.error(`  Usual cause: the script uses a global that exists in Claude Design but not in`);
    console.error(`  the compiled bundle. Add it to the sandbox in src/components/DcRuntime.tsx.`);
    failed++;
  }
}

if (failed) {
  console.error(`\ncheck-runtime: ${failed} of ${checked} scripts would fail at runtime. Build stopped.\n`);
  process.exit(1);
}
console.log(`check-runtime: ${checked} scripts load and initialise cleanly.`);

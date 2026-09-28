import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const ROOT = process.cwd();

function loadLand() {
  return JSON.parse(fs.readFileSync(path.join(ROOT, "public/live/land.json"), "utf8"));
}

function hasPointNear(points, lon, lat, tol) {
  return points.some(([x, y]) => Math.abs(x - lon) <= tol && Math.abs(y - lat) <= tol);
}

test("land.json is a dense grid of land points", () => {
  const points = loadLand();
  assert.ok(points.length > 3000 && points.length < 8000, `got ${points.length}`);
  for (const p of points) {
    assert.equal(p.length, 2);
    assert.ok(p[0] >= -180 && p[0] < 180 && p[1] >= -58 && p[1] <= 84);
  }
});

test("land.json covers land and skips ocean", () => {
  const points = loadLand();
  assert.ok(hasPointNear(points, -104.99, 39.74, 2.0), "Denver");
  assert.ok(hasPointNear(points, 151.21, -33.87, 2.0), "Sydney");
  assert.ok(!hasPointNear(points, -30, 30, 2.5), "mid-Atlantic");
  assert.ok(!hasPointNear(points, -150, -40, 2.5), "south Pacific");
});

function loadPlanner() {
  const file = path.join(ROOT, "design/Pages/CoachRx Live.dc.html");
  const $ = cheerio.load(fs.readFileSync(file, "utf8"), { xmlMode: false });
  const src = $('script[type="text/x-dc"]').html() || "";
  class DCLogic { constructor(p) { this.props = p || {}; } q() { return []; } setState() {} scrollToPanel() {} }
  const make = new Function("DCLogic", "React", `${src}\n;return { Component, planBatch, MAX_ALIVE };`);
  return make(DCLogic, {});
}

const ev = (id, at, extra = {}) => ({
  id, kind: "message_sent", at,
  coach: { lat: 39.74, lng: -104.99, city: "Denver", country: "US" },
  client: { lat: 30.27, lng: -97.74, city: "Austin", country: "US" },
  same_city: false, ...extra,
});

test("planBatch drops ids already seen and records new ones", () => {
  const { planBatch } = loadPlanner();
  const seen = new Set(["a"]);
  const plan = planBatch([ev("a", "2026-09-25T15:04:01Z"), ev("b", "2026-09-25T15:04:02Z")], seen, 1000, 15000);
  assert.deepEqual(plan.map((p) => p.event.id), ["b"]);
  assert.ok(seen.has("b"));
});

test("planBatch orders by time and spreads starts evenly across the interval", () => {
  const { planBatch } = loadPlanner();
  const plan = planBatch(
    [ev("c", "2026-09-25T15:04:03Z"), ev("a", "2026-09-25T15:04:01Z"), ev("b", "2026-09-25T15:04:02Z")],
    new Set(), 1000, 15000,
  );
  assert.deepEqual(plan.map((p) => p.event.id), ["a", "b", "c"]);
  assert.deepEqual(plan.map((p) => p.startAt), [1000, 6000, 11000]);
});

test("planBatch returns nothing for an empty batch", () => {
  const { planBatch } = loadPlanner();
  assert.deepEqual(planBatch([], new Set(), 0, 15000), []);
});

test("planBatch drops malformed events instead of throwing", () => {
  const { planBatch } = loadPlanner();
  const bad = [
    ev("x", "2026-09-25T15:04:01Z", { coach: null }),
    ev("y", "2026-09-25T15:04:01Z", { client: { lat: "nope", lng: 1, city: "?", country: "??" } }),
    { id: "z" },
    ev("ok", "2026-09-25T15:04:01Z"),
  ];
  const plan = planBatch(bad, new Set(), 0, 15000);
  assert.deepEqual(plan.map((p) => p.event.id), ["ok"]);
});

test("planBatch drops an event whose kind is an Object.prototype key", () => {
  const { planBatch } = loadPlanner();
  const plan = planBatch([ev("proto", "2026-09-25T15:04:01Z", { kind: "constructor" }), ev("ok", "2026-09-25T15:04:02Z")], new Set(), 0, 15000);
  assert.deepEqual(plan.map((p) => p.event.id), ["ok"]);
});

test("planBatch caps a huge batch at MAX_ALIVE newest events", () => {
  const { planBatch, MAX_ALIVE } = loadPlanner();
  const many = Array.from({ length: 500 }, (_, i) => ev(`e${i}`, new Date(1700000000000 + i * 1000).toISOString()));
  const plan = planBatch(many, new Set(), 0, 15000);
  assert.equal(plan.length, MAX_ALIVE);
  assert.equal(plan[plan.length - 1].event.id, "e499");
});

test("Component constructs and renderVals is pure in a DOM-less sandbox", () => {
  const { Component } = loadPlanner();
  const inst = new Component({});
  assert.deepEqual(inst.renderVals(), {});
});

import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

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

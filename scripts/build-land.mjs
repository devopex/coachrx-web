import fs from "node:fs";
import path from "node:path";

const SRC = path.join(process.cwd(), "scripts/data/ne_110m_land.geojson");
const OUT = path.join(process.cwd(), "public/live/land.json");
const STEP = 1.6;
const LAT_MIN = -58;
const LAT_MAX = 84;

const gj = JSON.parse(fs.readFileSync(SRC, "utf8"));
const polygons = [];
for (const f of gj.features) {
  const g = f.geometry;
  if (!g) continue;
  if (g.type === "Polygon") polygons.push(g.coordinates);
  else if (g.type === "MultiPolygon") for (const p of g.coordinates) polygons.push(p);
}

function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function inLand(x, y) {
  for (const poly of polygons) {
    if (!inRing(x, y, poly[0])) continue;
    let hole = false;
    for (let k = 1; k < poly.length; k++) if (inRing(x, y, poly[k])) { hole = true; break; }
    if (!hole) return true;
  }
  return false;
}

const dots = [];
for (let lat = LAT_MIN; lat <= LAT_MAX; lat += STEP) {
  const lonStep = STEP / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  for (let lon = -180; lon < 180; lon += lonStep) {
    if (inLand(lon, lat)) dots.push([Number(lon.toFixed(1)), Number(lat.toFixed(1))]);
  }
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(dots));
console.log(`build-land: ${dots.length} points -> public/live/land.json`);

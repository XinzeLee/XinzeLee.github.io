// Resolve province labels in data/visit_stats.json to province centroids and
// write the public, page-ready data/site_stats.json used by sitestats.html.
// Usage: node scripts/geocode_visits.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const statsPath = path.join(root, "data", "visit_stats.json");
const cachePath = path.join(root, "data", "geo_cache.json");
const outputPath = path.join(root, "data", "site_stats.json");

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "xinzelee.github.io site-stats (https://xinzelee.github.io/)";

const readJson = (file, fallback) =>
  fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "")) : fallback;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function splitLabel(label) {
  const [country, ...rest] = label.split(" / ");
  return { country: country.trim(), province: rest.join(" / ").trim() };
}

let lastRequest = 0;
async function nominatim(params) {
  const wait = 1100 - (Date.now() - lastRequest);
  if (wait > 0) await sleep(wait);
  lastRequest = Date.now();
  const url = `${NOMINATIM}?${new URLSearchParams({ format: "jsonv2", limit: "1", ...params })}`;
  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" } });
    if (!response.ok) return null;
    const [hit] = await response.json();
    if (!hit) return null;
    return { lat: Math.round(Number(hit.lat) * 100) / 100, lon: Math.round(Number(hit.lon) * 100) / 100 };
  } catch {
    return null;
  }
}

async function geocode({ country, province }) {
  if (province) {
    return (await nominatim({ state: province, country }))
      ?? (await nominatim({ q: `${province}, ${country}` }))
      ?? (await nominatim({ country }));
  }
  return nominatim({ country });
}

const stats = readJson(statsPath, null);
if (!stats || stats.ok !== true) {
  console.error("data/visit_stats.json is missing or not ok.");
  process.exit(1);
}

const cache = readJson(cachePath, {});
const locations = [];
let lookups = 0;

for (const [label, counts] of Object.entries(stats.provinces || {})) {
  if (!label || label.toLowerCase() === "unknown") continue;
  const place = splitLabel(label);
  if (!cache[label]) {
    lookups += 1;
    const coords = await geocode(place);
    if (coords) cache[label] = coords;
    else console.warn(`No coordinates for "${label}"`);
  }
  const coords = cache[label];
  locations.push({
    country: place.country,
    province: place.province,
    ...(coords ? { lat: coords.lat, lon: coords.lon } : {}),
    visitors: Number(counts.uniques || 0),
    hits: Number(counts.hits || 0),
  });
}

locations.sort((a, b) => b.visitors - a.visitors || b.hits - a.hits);

const sortedCache = Object.fromEntries(Object.entries(cache).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(cachePath, `${JSON.stringify(sortedCache, null, 2)}\n`, "utf8");

const firstDay = Object.keys(stats.daily || {}).sort()[0] || null;

const siteStats = {
  since: stats.since || firstDay,
  total_hits: Number(stats.total_hits || 0),
  unique_visitors: Number(stats.unique_visitors || 0),
  updated_at: stats.exported_at || stats.updated_at || null,
  locations,
};
fs.writeFileSync(outputPath, `${JSON.stringify(siteStats, null, 2)}\n`, "utf8");

console.log(`locations=${locations.length} new_lookups=${lookups} plotted=${locations.filter(l => "lat" in l).length}`);

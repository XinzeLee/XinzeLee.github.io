import { createGlobe, formatCompact as formatCount } from "./globe.js";

const container = document.querySelector("[data-visit-globe]");
const tooltip = document.querySelector("[data-globe-tooltip]");

const formatDate = (value, month) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month, day: "numeric", timeZone: "UTC" });
};

function embeddedStats() {
  try {
    return JSON.parse(document.getElementById("site-stats-data")?.textContent || "null");
  } catch {
    return null;
  }
}

async function loadStats() {
  if (location.protocol !== "file:") {
    try {
      const response = await fetch(`data/site_stats.json?v=${Date.now()}`, { cache: "no-store" });
      if (response.ok) return await response.json();
    } catch {
      /* use the copy embedded at build time */
    }
  }
  return embeddedStats();
}

function render(stats) {
  if (stats) {
    document.querySelectorAll("[data-stat]").forEach(node => {
      const key = node.getAttribute("data-stat");
      if (key in stats) node.textContent = formatCount(stats[key]);
    });
    const since = formatDate(stats.since, "long");
    document.querySelectorAll("[data-stats-since]").forEach(node => {
      if (since) node.textContent = since;
    });
    const updated = formatDate(stats.updated_at, "short");
    const updatedNode = document.querySelector("[data-stats-updated]");
    if (updatedNode && updated) updatedNode.textContent = ` (last update ${updated})`;
  }

  if (!container) return;
  const locations = (stats?.locations || []).filter(item =>
    typeof item.lat === "number" && typeof item.lon === "number"
  );
  const summary = locations.length
    ? locations.map(item =>
      `${[item.province, item.country].filter(Boolean).join(", ")}: ${formatCount(item.visitors)} visitors`
    ).join("; ")
    : "no locations recorded yet";
  container.setAttribute("aria-label", `Interactive globe of visitor locations — ${summary}`);

  createGlobe(container, {
    tooltip,
    landData: window.NE_50M_LAND,
    markerConfig: {
      color: "#173f5f",
      size: 40,
      markers: locations.map(item => ({
        lat: item.lat,
        lng: item.lon,
        province: item.province,
        country: item.country,
        visitors: item.visitors,
      })),
    },
  });
}

loadStats().then(render);

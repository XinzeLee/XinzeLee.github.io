import { createGlobe, formatCompact as formatCount } from "./globe.js";
import { createFallbackMap } from "./fallback.js";
import { markerStyles, defaultMarkerStyle } from "./marker-styles.js";

const container = document.querySelector("[data-visit-globe]");
const tooltip = document.querySelector("[data-globe-tooltip]");
const status = document.querySelector("[data-globe-status]");
const previewStyle = new URLSearchParams(location.search).get("markers");
const style = markerStyles[previewStyle] || markerStyles[defaultMarkerStyle];
let visualization;
let currentMarkers = [];

const formatDate = (value, month) => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month, day: "numeric", timeZone: "UTC" });
};

function validStats(stats) {
  return stats && Number.isFinite(stats.total_hits) && Number.isFinite(stats.unique_visitors) && Array.isArray(stats.locations);
}

function embeddedStats() {
  try {
    const stats = JSON.parse(document.getElementById("site-stats-data")?.textContent || "null");
    return validStats(stats) ? stats : null;
  } catch {
    return null;
  }
}

function showFallback() {
  visualization?.destroy();
  if (tooltip) tooltip.hidden = true;
  visualization = createFallbackMap(container, window.NE_50M_LAND, style);
  visualization.setMarkers(currentMarkers);
  container.dataset.globeState = "fallback";
  if (status) {
    status.hidden = false;
    status.textContent = "Showing a world map. The 3D globe is unavailable in this browser.";
    status.classList.add("globe-status--fallback");
  }
}

function render(stats) {
  if (!stats) return;
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

  const locations = stats.locations.filter(item =>
    item && Number.isFinite(item.lat) && Math.abs(item.lat) <= 90 && Number.isFinite(item.lon) && Math.abs(item.lon) <= 180
  );
  currentMarkers = locations.map(item => ({ ...item, lng: item.lon }));
  const list = document.querySelector("[data-location-list]");
  if (list) {
    list.replaceChildren(...locations.map(item => {
      const li = document.createElement("li");
      li.textContent = `${[item.province, item.country].filter(Boolean).join(", ")} — ${formatCount(item.visitors)} visitor${item.visitors === 1 ? "" : "s"}`;
      return li;
    }));
  }
  if (!container) return;
  container.setAttribute("aria-label", `Visitor locations — ${locations.map(item =>
    `${[item.province, item.country].filter(Boolean).join(", ")}: ${formatCount(item.visitors)} visitors`
  ).join("; ") || "no locations recorded yet"}`);

  if (visualization) {
    visualization.setMarkers(currentMarkers);
    return;
  }
  try {
    visualization = createGlobe(container, {
      tooltip,
      landData: window.NE_50M_LAND,
      markerConfig: { ...style, markers: currentMarkers },
      initialLongitude: 75,
      onReady() {
        container.dataset.globeState = "ready";
        if (status) status.hidden = true;
      },
      onError: () => queueMicrotask(showFallback),
      onContextLost() {
        container.dataset.globeState = "recovering";
        if (status) {
          status.hidden = false;
          status.textContent = "Restoring visitor globe…";
        }
      },
    });
  } catch {
    showFallback();
  }
}

async function refreshStats() {
  if (location.protocol === "file:") return;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(`data/site_stats.json?v=${Date.now()}`, { cache: "no-store", signal: controller.signal });
    if (!response.ok) return;
    const stats = await response.json();
    if (validStats(stats)) render(stats);
  } catch {
    // The embedded snapshot is already visible, even offline or on a slow request.
  } finally {
    clearTimeout(timeout);
  }
}

const legend = document.querySelector("[data-globe-legend]");
const scale = document.querySelector("[data-globe-scale]");
if (legend && scale) {
  scale.style.background = `linear-gradient(to right, ${style.colors.join(", ")})`;
  legend.hidden = false;
}

// Visualization startup must never depend on a network request finishing.
render(embeddedStats() || { total_hits: 0, unique_visitors: 0, locations: [] });
refreshStats();
window.addEventListener("pageshow", event => {
  if (event.persisted) refreshStats();
});

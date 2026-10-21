import { geoArea, geoDistance, geoGraticule10, geoOrthographic, geoPath } from "d3-geo";
import { colorAt } from "./marker-styles.js";

const svgNS = "http://www.w3.org/2000/svg";
const element = (name, attrs = {}) => {
  const node = document.createElementNS(svgNS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
};

let globeId = 0;

function simplifyLand(data) {
  const ring = points => {
    if (points.length <= 12) return points;
    const reduced = points.filter((_, index) => index % 4 === 0);
    reduced.push(points[points.length - 1]);
    // Tiny coastal rings can reverse winding when thinned, filling the ocean.
    const coversHemisphere = coordinates => geoArea({ type: "Polygon", coordinates: [coordinates] }) > 2 * Math.PI;
    if (coversHemisphere(points) !== coversHemisphere(reduced)) return points;
    return reduced;
  };
  return { type: "FeatureCollection", features: (data?.features || []).map(feature => {
    const geometry = feature.geometry;
    if (!geometry) return feature;
    const coordinates = geometry.type === "Polygon" ? geometry.coordinates.map(ring)
      : geometry.type === "MultiPolygon" ? geometry.coordinates.map(polygon => polygon.map(ring))
        : geometry.coordinates;
    return { ...feature, geometry: { ...geometry, coordinates } };
  }) };
}

function markerFill(colors, t) {
  const { from, to, mix } = colorAt(colors, t);
  const channel = offset => {
    const a = parseInt(from.slice(offset, offset + 2), 16);
    const b = parseInt(to.slice(offset, offset + 2), 16);
    return Math.round(a + (b - a) * mix);
  };
  return `rgb(${channel(1)}, ${channel(3)}, ${channel(5)})`;
}

// Keep the same globe interaction without depending on a WebGL/GPU context.
export function createFallbackGlobe(container, landData, style, tooltip) {
  const rotation = [75, -23, 0];
  const projection = geoOrthographic().translate([450, 405]).scale(270).rotate(rotation).precision(.7);
  const path = geoPath(projection);
  const land = simplifyLand(landData);
  const grid = geoGraticule10();
  const svg = element("svg", { viewBox: "0 0 900 810", role: "group", tabindex: "0", "data-globe-fallback": "", "aria-label": "Interactive visitor globe. Drag or use arrow keys to rotate; hover, tap, or focus a marker for visitor counts." });
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;touch-action:none;cursor:grab";
  const patternId = `globe-land-${++globeId}`;
  const defs = element("defs");
  const pattern = element("pattern", { id: patternId, width: 4, height: 4, patternUnits: "userSpaceOnUse" });
  pattern.appendChild(element("circle", { cx: 2, cy: 2, r: .65, fill: "#173f5f" }));
  defs.appendChild(pattern);
  svg.appendChild(defs);
  svg.appendChild(element("circle", { cx: 450, cy: 405, r: 270, fill: "#f5f8fa", stroke: "#d8e2e8", "data-globe-sphere": "" }));
  const gridPath = element("path", { fill: "none", stroke: "#d5dce0", "stroke-width": .6 });
  const landPath = element("path", { fill: `url(#${patternId})`, stroke: "#6d8a9f", "stroke-width": .5, "data-globe-land": "" });
  const markerGroup = element("g");
  svg.append(gridPath, landPath, markerGroup);
  container.appendChild(svg);

  let markerNodes = [];
  let active = null;
  let pinned = false;
  let hovered = false;
  let dragging = null;
  let onScreen = true;
  let destroyed = false;
  let frame = null;
  let lastFrame = 0;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const screenPoint = item => {
    const matrix = svg.getScreenCTM();
    if (!matrix || !item.point) return null;
    const [x, y] = item.point;
    return { x: matrix.a * x + matrix.c * y + matrix.e, y: matrix.b * x + matrix.d * y + matrix.f };
  };
  const updateTooltip = () => {
    if (!tooltip) return;
    const point = active?.visible ? screenPoint(active) : null;
    tooltip.hidden = !point;
    if (!point) return;
    const bounds = container.getBoundingClientRect();
    const half = tooltip.offsetWidth / 2 + 8;
    tooltip.style.left = `${Math.min(Math.max(point.x - bounds.left, half), Math.max(half, bounds.width - half))}px`;
    tooltip.style.top = `${Math.max(point.y - bounds.top, tooltip.offsetHeight + 20)}px`;
  };
  const showMarker = item => {
    active = item;
    if (tooltip && item) {
      const strong = document.createElement("strong");
      strong.textContent = [item.marker.province, item.marker.country].filter(Boolean).join(", ");
      const count = document.createElement("span");
      count.textContent = `${item.marker.visitors} visitor${item.marker.visitors === 1 ? "" : "s"}`;
      tooltip.replaceChildren(strong, count);
    }
    updateTooltip();
  };
  const draw = () => {
    projection.rotate(rotation);
    gridPath.setAttribute("d", path(grid));
    landPath.setAttribute("d", path(land) || "");
    const center = projection.invert([450, 405]);
    markerNodes.forEach(item => {
      item.visible = geoDistance([item.marker.lng, item.marker.lat], center) < Math.PI / 2 - .01;
      item.node.style.display = item.visible ? "" : "none";
      if (item.visible) {
        item.point = projection([item.marker.lng, item.marker.lat]);
        item.node.setAttribute("transform", `translate(${item.point[0]},${item.point[1]})`);
      }
    });
    updateTooltip();
  };
  const canRotate = () => !destroyed && !document.hidden && onScreen && !reducedMotion.matches && !hovered && !pinned && !dragging;
  const animate = time => {
    frame = null;
    if (!canRotate()) return;
    const elapsed = time - lastFrame;
    if (elapsed >= 65) {
      rotation[0] = (rotation[0] + Math.min(elapsed, 100) * .006) % 360;
      lastFrame = time;
      draw();
    }
    frame = requestAnimationFrame(animate);
  };
  const syncPlayback = () => {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    if (canRotate()) {
      lastFrame = performance.now();
      frame = requestAnimationFrame(animate);
    }
  };
  const nearest = (event, limit) => {
    let match = null;
    markerNodes.forEach(item => {
      if (!item.visible) return;
      const point = screenPoint(item);
      if (!point) return;
      const distance = Math.hypot(event.clientX - point.x, event.clientY - point.y);
      if (distance < limit) { match = item; limit = distance; }
    });
    return match;
  };
  svg.addEventListener("pointerenter", () => { hovered = true; syncPlayback(); });
  svg.addEventListener("pointerleave", () => {
    hovered = false;
    if (!pinned && !dragging) showMarker(null);
    syncPlayback();
  });
  svg.addEventListener("pointerdown", event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragging = { id: event.pointerId, x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY };
    svg.setPointerCapture(event.pointerId);
    svg.style.cursor = "grabbing";
    syncPlayback();
  });
  svg.addEventListener("pointermove", event => {
    if (dragging?.id === event.pointerId) {
      rotation[0] += (event.clientX - dragging.x) * .35;
      rotation[1] = Math.max(-80, Math.min(80, rotation[1] - (event.clientY - dragging.y) * .35));
      dragging.x = event.clientX;
      dragging.y = event.clientY;
      pinned = false;
      showMarker(null);
      draw();
    } else if (event.pointerType === "mouse" && !pinned) {
      const item = nearest(event, 14);
      svg.style.cursor = item ? "pointer" : "grab";
      showMarker(item);
    }
  });
  const endDrag = event => {
    if (dragging?.id !== event.pointerId) return;
    const moved = Math.hypot(event.clientX - dragging.startX, event.clientY - dragging.startY);
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    dragging = null;
    svg.style.cursor = "grab";
    if (event.type === "pointerup" && moved < 6) {
      const item = nearest(event, event.pointerType === "mouse" ? 14 : 24);
      pinned = !!item;
      showMarker(item);
    }
    syncPlayback();
  };
  svg.addEventListener("pointerup", endDrag);
  svg.addEventListener("pointercancel", endDrag);
  svg.addEventListener("keydown", event => {
    const changes = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, 12], ArrowDown: [0, -12] };
    if (event.key === "Escape") { pinned = false; showMarker(null); syncPlayback(); }
    if (!changes[event.key]) return;
    event.preventDefault();
    const [x, y] = changes[event.key];
    rotation[0] += x;
    rotation[1] = Math.max(-80, Math.min(80, rotation[1] + y));
    pinned = false;
    showMarker(null);
    draw();
  });
  const observer = new IntersectionObserver(entries => { onScreen = entries.some(entry => entry.isIntersecting); syncPlayback(); });
  observer.observe(container);
  const resizeObserver = new ResizeObserver(updateTooltip);
  resizeObserver.observe(container);
  document.addEventListener("visibilitychange", syncPlayback);
  window.addEventListener("pageshow", syncPlayback);
  reducedMotion.addEventListener("change", syncPlayback);
  draw();
  syncPlayback();

  return {
    setMarkers(locations) {
      pinned = false;
      showMarker(null);
      markerGroup.replaceChildren();
      const max = Math.max(1, ...locations.map(item => item.visitors || 0));
      markerNodes = locations.map(marker => {
        const t = Math.log1p(marker.visitors || 0) / Math.log1p(max);
        const label = `${[marker.province, marker.country].filter(Boolean).join(", ")}: ${marker.visitors} visitors`;
        const node = element("g", { tabindex: "0", role: "button", "aria-label": label, "data-globe-marker": "" });
        node.appendChild(element("circle", { r: (2.5 + t) * ((style.size || 20) / 20), fill: markerFill(style.colors, t), stroke: "#fff", "stroke-width": .7 }));
        const item = { node, marker, visible: false, point: null };
        node.addEventListener("focus", () => { pinned = true; showMarker(item); syncPlayback(); });
        node.addEventListener("blur", () => { pinned = false; showMarker(null); syncPlayback(); });
        node.addEventListener("keydown", event => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          pinned = true;
          showMarker(item);
          syncPlayback();
        });
        markerGroup.appendChild(node);
        return item;
      });
      draw();
      syncPlayback();
    },
    destroy() {
      destroyed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      window.removeEventListener("pageshow", syncPlayback);
      reducedMotion.removeEventListener("change", syncPlayback);
      if (tooltip) tooltip.hidden = true;
      svg.remove();
    },
  };
}

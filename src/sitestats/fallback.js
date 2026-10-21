import { geoNaturalEarth1, geoPath } from "d3-geo";
import { colorAt } from "./marker-styles.js";

const svgNS = "http://www.w3.org/2000/svg";
const element = (name, attrs = {}) => {
  const node = document.createElementNS(svgNS, name);
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
  return node;
};

// All locations remain visible when WebGL is disabled or unavailable.
export function createFallbackMap(container, landData, style) {
  const projection = geoNaturalEarth1().fitExtent([[18, 24], [882, 456]], { type: "Sphere" });
  const path = geoPath(projection);
  const svg = element("svg", { viewBox: "0 0 900 480", role: "img", "aria-label": "World map of visitor locations" });
  svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  svg.appendChild(element("path", { d: path({ type: "Sphere" }), fill: "#f5f8fa", stroke: "#c9d6e0" }));
  if (landData?.features) svg.appendChild(element("path", { d: path(landData), fill: "#d5e0e7", stroke: "#809bac", "stroke-width": ".45" }));
  const markers = element("g");
  svg.appendChild(markers);
  container.appendChild(svg);
  return {
    setMarkers(locations) {
      markers.replaceChildren();
      const max = Math.max(1, ...locations.map(item => item.visitors || 0));
      locations.forEach(item => {
        const [cx, cy] = projection([item.lng, item.lat]);
        const t = Math.log1p(item.visitors || 0) / Math.log1p(max);
        const { from, to, mix } = colorAt(style.colors, t);
        const circle = element("circle", { cx, cy, r: (2.5 + t) * ((style.size || 20) / 20), fill: mix < .5 ? from : to, stroke: "#fff", "stroke-width": ".7" });
        const title = element("title");
        title.textContent = `${[item.province, item.country].filter(Boolean).join(", ")}: ${item.visitors} visitors`;
        circle.appendChild(title);
        markers.appendChild(circle);
      });
    },
    destroy() { svg.remove(); },
  };
}

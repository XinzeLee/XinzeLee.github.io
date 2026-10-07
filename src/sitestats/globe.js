// Globe — ported from the Originkit Globe component (base preset) to a plain ES module.
import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  SphereGeometry,
  MeshBasicMaterial,
  Color,
  Mesh,
  Group,
  InstancedMesh,
  Matrix4,
  Raycaster,
  Vector2,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
  CanvasTexture,
  Sprite,
  SpriteMaterial,
  NormalBlending,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { geoEquirectangular, geoPath } from "d3-geo";

function parseColorToRgba(input) {
  if (!input || input.trim() === "") return { r: 0, g: 0, b: 0, a: 0 };
  const str = input.trim();
  const rgbaMatch = str.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/i
  );
  if (rgbaMatch) {
    const r = Math.max(0, Math.min(255, parseFloat(rgbaMatch[1]))) / 255;
    const g = Math.max(0, Math.min(255, parseFloat(rgbaMatch[2]))) / 255;
    const b = Math.max(0, Math.min(255, parseFloat(rgbaMatch[3]))) / 255;
    const a = rgbaMatch[4] !== undefined ? Math.max(0, Math.min(1, parseFloat(rgbaMatch[4]))) : 1;
    return { r, g, b, a };
  }
  const hex = str.replace(/^#/, "");
  if (hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: parseInt(hex.slice(6, 8), 16) / 255,
    };
  }
  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16) / 255,
      g: parseInt(hex.slice(2, 4), 16) / 255,
      b: parseInt(hex.slice(4, 6), 16) / 255,
      a: 1,
    };
  }
  if (hex.length === 4) {
    return {
      r: parseInt(hex[0] + hex[0], 16) / 255,
      g: parseInt(hex[1] + hex[1], 16) / 255,
      b: parseInt(hex[2] + hex[2], 16) / 255,
      a: parseInt(hex[3] + hex[3], 16) / 255,
    };
  }
  if (hex.length === 3) {
    return {
      r: parseInt(hex[0] + hex[0], 16) / 255,
      g: parseInt(hex[1] + hex[1], 16) / 255,
      b: parseInt(hex[2] + hex[2], 16) / 255,
      a: 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function mapLinear(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  const t = (value - inMin) / (inMax - inMin);
  return outMin + t * (outMax - outMin);
}

function mapSpeedUiToInternal(ui) {
  if (ui === 0) return 0;
  const clamped = Math.max(0, Math.min(10, ui));
  return mapLinear(clamped, 0, 10, 0, 0.9);
}
function mapDensityUiToSpacing(ui) {
  const clamped = Math.max(1, Math.min(10, ui));
  return mapLinear(clamped, 1, 10, 24, 8);
}
function mapScaleUiToMultiplier(ui) {
  const clamped = Math.max(1, Math.min(20, ui));
  return mapLinear(clamped, 1, 20, 0.2, 2);
}
function mapDotSizeUiToMultiplier(ui) {
  const clamped = Math.max(1, Math.min(10, ui));
  return mapLinear(clamped, 1, 10, 0.1, 0.5);
}
function mapMarkerDotSizeUiToMultiplier(ui) {
  const clamped = Math.max(0, Math.min(100, ui));
  return mapLinear(clamped, 0, 100, 0.1, 2.5);
}
function normalizeSmoothing(ui) {
  return Math.max(0, Math.min(1, ui / 10));
}
function mapDragSpeedUiToSensitivity(ui) {
  return mapLinear(Math.max(0, Math.min(10, ui)), 0, 10, 0.001, 0.02);
}
function mapDetailToStepSize(ui) {
  const clamped = Math.max(1, Math.min(10, ui));
  return mapLinear(clamped, 1, 10, 10, 1);
}

function simplifyRing(ring, detail) {
  if (ring.length < 2) return ring;
  if (detail >= 10) return ring;
  const stepSize = Math.max(1, Math.floor(mapDetailToStepSize(detail)));
  const simplified = [ring[0]];
  for (let i = stepSize; i < ring.length - 1; i += stepSize) {
    simplified.push(ring[Math.min(i, ring.length - 1)]);
  }
  const lastPoint = ring[ring.length - 1];
  const firstPoint = ring[0];
  const isClosed =
    Math.abs(lastPoint[0] - firstPoint[0]) < 1e-4 &&
    Math.abs(lastPoint[1] - firstPoint[1]) < 1e-4;
  if (!isClosed) simplified.push(lastPoint);
  return simplified.length >= 2 ? simplified : ring;
}

function latLngToPosition(lat, lng) {
  const latRad = lat * (Math.PI / 180);
  const lngRad = lng * (Math.PI / 180);
  return {
    x: Math.cos(latRad) * Math.sin(lngRad),
    y: Math.sin(latRad),
    z: Math.cos(latRad) * Math.cos(lngRad),
  };
}

function tubeFromPoints(points, radius) {
  const curve = new CatmullRomCurve3(points);
  return new TubeGeometry(curve, points.length * 2, radius, 8, false);
}

function glowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.2, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.15)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new CanvasTexture(canvas);
}

const MARKER_DIM = new Color("#1a4a6b");
const MARKER_MID = new Color("#173f5f");
const MARKER_BRIGHT = new Color("#d7e6f0");
const MARKER_HALO = new Color("#173f5f");

function markerColor(t) {
  return t < 0.5
    ? MARKER_DIM.clone().lerp(MARKER_MID, t / 0.5)
    : MARKER_MID.clone().lerp(MARKER_BRIGHT, (t - 0.5) / 0.5);
}

export function formatCompact(value) {
  const n = Math.max(0, Math.round(Number(value) || 0));
  if (n < 1000) return String(n);
  const trim = tenths => String(tenths / 10).replace(/\.0$/, "");
  const thousands = Math.round(n / 100);
  if (thousands < 10000) return `${trim(thousands)}k`;
  return `${trim(Math.round(n / 100000))}M`;
}

const escapeHtml = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

export function createGlobe(container, {
  speed = 2,
  smoothing = 8,
  dots = { color: "#173f5f", size: 5, density: 9, allDots: false },
  fill = "dots",
  fillColor = "#173f5f",
  scale = 8,
  stopOnHover = true,
  markerConfig = { markers: [], color: "#173f5f", size: 40 },
  direction = "left",
  initialLatitude = 23,
  initialLongitude = -23,
  oceanColor = "#f5f8fa",
  outlineColor = "rgba(23, 63, 95, 0.55)",
  showOutline = true,
  graticuleColor = "rgba(207, 211, 213, 0.6)",
  showGrid = true,
  outlineWidth = 1,
  dragSpeed = 5,
  detail = 5,
  tooltip = null,
  landData = null,
} = {}) {
  const dotColor = dots.color;
  const dotSize = dots.size;
  const density = dots.density;
  const allDots = dots.allDots;
  const gridWidth = 1;
  const smoothingN = normalizeSmoothing(smoothing);

  const baseRotationSpeed = mapSpeedUiToInternal(speed);
  const rotationSpeed = direction === "left" ? -baseRotationSpeed : baseRotationSpeed;
  const dotSpacing = mapDensityUiToSpacing(density);
  const dotSizeMultiplier = mapDotSizeUiToMultiplier(dotSize);
  const markerRadiusMultiplier = mapMarkerDotSizeUiToMultiplier(markerConfig.size);
  const scaleMultiplier = mapScaleUiToMultiplier(scale);

  const containerWidth = container.clientWidth || container.offsetWidth || 800;
  const containerHeight = container.clientHeight || container.offsetHeight || 600;

  const scene = new Scene();
  const camera = new PerspectiveCamera(50, containerWidth / containerHeight, 0.1, 1e3);
  const globeRadius = 1 * scaleMultiplier;
  const cameraDistance = 2.5 / scaleMultiplier;
  camera.position.set(0, 0, cameraDistance);
  camera.lookAt(0, 0, 0);

  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(containerWidth, containerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = "srgb";
  const canvas = renderer.domElement;
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.display = "block";
  canvas.style.opacity = "0";
  canvas.style.visibility = "hidden";
  canvas.style.touchAction = "none";
  canvas.style.cursor = "grab";
  container.appendChild(canvas);

  const oceanRgba = parseColorToRgba(oceanColor);
  const outlineRgba = parseColorToRgba(outlineColor);
  const dotRgba = parseColorToRgba(dotColor);
  const graticuleRgba = parseColorToRgba(graticuleColor);
  const fillRgba = parseColorToRgba(fillColor);

  const oceanMesh = new Mesh(
    new SphereGeometry(globeRadius, 64, 64),
    new MeshBasicMaterial({
      color: oceanColor ? new Color(oceanColor) : new Color(0, 0, 0),
      transparent: oceanRgba.a < 1 || oceanRgba.a === 0,
      opacity: oceanRgba.a,
    })
  );

  const continentOutlineGroup = new Group();
  const graticuleGroup = new Group();

  if (showGrid && graticuleColor && graticuleRgba.a > 0) {
    const graticuleMaterial = new MeshBasicMaterial({
      color: new Color(graticuleColor),
      transparent: graticuleRgba.a < 1 || graticuleRgba.a === 0,
      opacity: graticuleRgba.a,
    });
    const gridSpacing = 15;
    const segments = 64;
    const radius = (gridWidth / 10) * 0.01;
    const tubes = [];
    for (let lat = -90; lat <= 90; lat += gridSpacing) {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const pos = latLngToPosition(lat, (i / segments) * 360 - 180);
        points.push(new Vector3(pos.x * globeRadius, pos.y * globeRadius, pos.z * globeRadius));
      }
      tubes.push(tubeFromPoints(points, radius));
    }
    for (let lng = -180; lng < 180; lng += gridSpacing) {
      const points = [];
      for (let i = 0; i <= segments; i++) {
        const pos = latLngToPosition((i / segments) * 180 - 90, lng);
        points.push(new Vector3(pos.x * globeRadius, pos.y * globeRadius, pos.z * globeRadius));
      }
      tubes.push(tubeFromPoints(points, radius));
    }
    const gridMesh = new Mesh(mergeGeometries(tubes), graticuleMaterial);
    tubes.forEach(tube => tube.dispose());
    gridMesh.renderOrder = 0;
    graticuleGroup.add(gridMesh);
  }

  const initialLongitudeRad = (initialLongitude * Math.PI) / 180;
  const initialLatitudeRad = (initialLatitude * Math.PI) / 180;
  const rotation = { x: initialLongitudeRad, y: initialLatitudeRad };
  const targetRotation = { x: initialLongitudeRad, y: initialLatitudeRad };
  const velocity = { x: 0, y: 0 };
  let isDragging = false;
  let isHovering = false;
  let animationFrameId = null;
  const lerpFactor = smoothingN === 0 ? 1 : mapLinear(smoothingN, 0, 1, 0.4, 0.03);
  const velocityDecay = mapLinear(smoothingN, 0, 1, 0.7, 0.96);

  const globeGroup = new Group();
  globeGroup.rotation.y = initialLongitudeRad;
  globeGroup.rotation.x = initialLatitudeRad;
  scene.add(globeGroup);
  globeGroup.add(oceanMesh);
  if (showGrid && graticuleColor && graticuleRgba.a > 0) globeGroup.add(graticuleGroup);
  globeGroup.add(continentOutlineGroup);

  let markerObjects = [];
  let hitSpheres = [];
  let activeMarker = null;
  let pinned = false;
  const glowMap = glowTexture();

  const updateMarkers = () => {
    markerObjects.forEach(object => globeGroup.remove(object));
    markerObjects = [];
    hitSpheres = [];
    const markers = (markerConfig.markers || []).filter(marker =>
      marker && typeof marker.lat === "number" && typeof marker.lng === "number"
    );
    if (markers.length === 0) return;
    const maxVisitors = Math.max(1, ...markers.map(marker => marker.visitors || 0));
    const markerSize = 0.01 * markerRadiusMultiplier;
    const hitGeometry = new SphereGeometry(0.06, 8, 8);
    const hitMaterial = new MeshBasicMaterial({ visible: false });
    markers.forEach(marker => {
      const t = Math.log(1 + (marker.visitors || 0)) / Math.log(1 + maxVisitors);
      const color = markerColor(t);
      const pos = latLngToPosition(marker.lat, marker.lng);
      const surface = new Vector3(pos.x, pos.y, pos.z).multiplyScalar(globeRadius);

      const dot = new Mesh(
        new SphereGeometry(markerSize * mapLinear(t, 0, 1, 0.8, 1.4), 16, 16),
        new MeshBasicMaterial({ color })
      );
      dot.position.copy(surface);
      dot.renderOrder = 3;

      // Normal blending: additive light disappears against the pale ocean.
      const glow = new Sprite(new SpriteMaterial({
        map: glowMap,
        color: MARKER_HALO,
        transparent: true,
        opacity: mapLinear(t, 0, 1, 0.35, 0.85),
        blending: NormalBlending,
        depthWrite: false,
      }));
      const glowSize = mapLinear(t, 0, 1, 0.05, 0.13);
      glow.scale.set(glowSize, glowSize, 1);
      glow.position.copy(surface).multiplyScalar(1.01);
      glow.renderOrder = 2;

      const hit = new Mesh(hitGeometry, hitMaterial);
      hit.position.copy(surface);
      hit.userData = { province: marker.province, country: marker.country, visitors: marker.visitors, dot };

      globeGroup.add(dot, glow, hit);
      markerObjects.push(dot, glow, hit);
      hitSpheres.push(hit);
    });
  };

  const tooltipPosition = new Vector3();
  const updateTooltip = () => {
    if (!tooltip) return;
    if (!activeMarker) {
      tooltip.hidden = true;
      return;
    }
    activeMarker.getWorldPosition(tooltipPosition);
    const facing = tooltipPosition.clone().normalize().dot(camera.position.clone().normalize());
    if (facing <= 0.05) {
      tooltip.hidden = true;
      return;
    }
    tooltipPosition.project(camera);
    const width = container.clientWidth;
    const height = container.clientHeight;
    tooltip.hidden = false;
    const half = tooltip.offsetWidth / 2 + 8;
    const x = ((tooltipPosition.x + 1) / 2) * width;
    const y = ((1 - tooltipPosition.y) / 2) * height;
    tooltip.style.left = `${Math.min(Math.max(x, half), Math.max(half, width - half))}px`;
    tooltip.style.top = `${Math.max(y, tooltip.offsetHeight + 20)}px`;
  };

  const showTooltip = marker => {
    if (marker === activeMarker) return;
    activeMarker = marker;
    if (tooltip && marker) {
      const { province, country, visitors } = marker.userData;
      const place = [province, country].filter(Boolean).join(", ");
      const count = formatCompact(visitors);
      tooltip.innerHTML = `<strong>${escapeHtml(place)}</strong><span>${count} visitor${visitors === 1 ? "" : "s"}</span>`;
    }
    updateTooltip();
    startAnimation();
  };

  const loadWorldData = async () => {
    try {
      const landFeatures = landData;
      if (!landFeatures?.features) throw new Error("Failed to load land data");

      while (continentOutlineGroup.children.length > 0) {
        continentOutlineGroup.remove(continentOutlineGroup.children[0]);
      }
      if (showOutline && outlineColor && outlineRgba.a > 0) {
        const outlineMaterial = new MeshBasicMaterial({
          color: new Color(outlineColor),
          transparent: outlineRgba.a < 1,
          opacity: outlineRgba.a,
          depthTest: true,
          depthWrite: true,
        });
        const radius = (outlineWidth / 10) * 0.01;
        const tubes = [];
        const processRing = ring => {
          if (ring.length < 2) return;
          const points = simplifyRing(ring, detail).map(([lng, lat]) => {
            const pos = latLngToPosition(lat, lng);
            return new Vector3(pos.x * globeRadius, pos.y * globeRadius, pos.z * globeRadius);
          });
          if (points.length < 2) return;
          if (points[0].distanceTo(points[points.length - 1]) > 0.001) points.push(points[0].clone());
          tubes.push(tubeFromPoints(points, radius));
        };
        landFeatures.features.forEach(feature => {
          const featureType = feature.properties?.featurecla || feature.properties?.type || "";
          const featureName = feature.properties?.name || "";
          const skip = ["graticule", "grid", "line"].some(word =>
            featureType.toLowerCase().includes(word) || featureName.toLowerCase().includes(word)
          );
          if (skip) return;
          const geometry = feature.geometry;
          if (!geometry || !geometry.coordinates) return;
          if (geometry.type === "Polygon" && geometry.coordinates.length > 0) {
            processRing(geometry.coordinates[0]);
          } else if (geometry.type === "MultiPolygon") {
            geometry.coordinates.forEach(polygon => {
              if (polygon.length > 0) processRing(polygon[0]);
            });
          }
        });
        if (tubes.length > 0) {
          const outlineMesh = new Mesh(mergeGeometries(tubes), outlineMaterial);
          tubes.forEach(tube => tube.dispose());
          outlineMesh.renderOrder = 0;
          continentOutlineGroup.add(outlineMesh);
        }
      }

      const bitmapWidth = 2048;
      const bitmapHeight = 1024;
      const offscreenCanvas = document.createElement("canvas");
      offscreenCanvas.width = bitmapWidth;
      offscreenCanvas.height = bitmapHeight;
      const ctx = offscreenCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Canvas not supported");
      const projection = geoEquirectangular().fitSize([bitmapWidth, bitmapHeight], { type: "Sphere" });
      const pathGenerator = geoPath().projection(projection).context(ctx);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, bitmapWidth, bitmapHeight);
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      landFeatures.features.forEach(feature => pathGenerator(feature));
      ctx.fill();
      const pixels = ctx.getImageData(0, 0, bitmapWidth, bitmapHeight).data;
      const isOnLand = (lng, lat) => {
        const x = Math.round(((lng + 180) / 360) * bitmapWidth) % bitmapWidth;
        const y = Math.round(((90 - lat) / 180) * bitmapHeight);
        const clampedY = Math.max(0, Math.min(bitmapHeight - 1, y));
        return pixels[(clampedY * bitmapWidth + x) * 4] > 128;
      };

      if (fill === "solid") {
        const texW = 1024;
        const texH = 512;
        const fillCanvas = document.createElement("canvas");
        fillCanvas.width = texW;
        fillCanvas.height = texH;
        const fctx = fillCanvas.getContext("2d");
        const img = fctx.createImageData(texW, texH);
        const data = img.data;
        const fr = Math.round(fillRgba.r * 255);
        const fg = Math.round(fillRgba.g * 255);
        const fb = Math.round(fillRgba.b * 255);
        const fa = Math.round((fillRgba.a || 1) * 255);
        for (let ty = 0; ty < texH; ty++) {
          for (let tx = 0; tx < texW; tx++) {
            let lng = (tx / texW - 0.25) * 360;
            lng = ((((lng + 180) % 360) + 360) % 360) - 180;
            const lat = (ty / texH - 0.5) * 180;
            const idx = (ty * texW + tx) * 4;
            if (allDots || isOnLand(lng, lat)) {
              data[idx] = fr;
              data[idx + 1] = fg;
              data[idx + 2] = fb;
              data[idx + 3] = fa;
            } else {
              data[idx + 3] = 0;
            }
          }
        }
        fctx.putImageData(img, 0, 0);
        const fillTexture = new CanvasTexture(fillCanvas);
        fillTexture.flipY = false;
        fillTexture.needsUpdate = true;
        globeGroup.add(new Mesh(
          new SphereGeometry(globeRadius * 1.002, 64, 64),
          new MeshBasicMaterial({ map: fillTexture, transparent: true })
        ));
      } else {
        const dotCoordinates = [];
        const baseStep = dotSpacing * 0.08;
        for (let lat = -90; lat <= 90; lat += baseStep) {
          const cosLat = Math.cos((Math.abs(lat) * Math.PI) / 180);
          const lngStep = cosLat > 0.01 ? baseStep / Math.max(0.3, cosLat) : 360;
          for (let lng = -180; lng < 180; lng += lngStep) {
            if (allDots || isOnLand(lng, lat)) dotCoordinates.push([lng, lat]);
          }
        }
        if (dotCoordinates.length > 0) {
          const instanced = new InstancedMesh(
            new SphereGeometry(0.01 * dotSizeMultiplier, 4, 4),
            new MeshBasicMaterial({
              color: dotColor ? new Color(dotColor) : new Color(0.6, 0.6, 0.6),
              transparent: dotRgba.a < 1 || dotRgba.a === 0,
              opacity: dotRgba.a,
            }),
            dotCoordinates.length
          );
          const matrix = new Matrix4();
          dotCoordinates.forEach(([lng, lat], i) => {
            const pos = latLngToPosition(lat, lng);
            matrix.makeScale(1, 1, 1);
            matrix.setPosition(pos.x * globeRadius, pos.y * globeRadius, pos.z * globeRadius);
            instanced.setMatrixAt(i, matrix);
          });
          instanced.instanceMatrix.needsUpdate = true;
          globeGroup.add(instanced);
        }
      }

      updateMarkers();
      renderer.render(scene, camera);
      canvas.style.opacity = "1";
      canvas.style.visibility = "visible";
      startAnimation();
    } catch (err) {
      const message = document.createElement("div");
      message.className = "globe-error";
      message.innerHTML = "<strong>Error loading Earth visualization</strong><span>Failed to load land map data</span>";
      container.appendChild(message);
    }
  };

  const animate = () => {
    let needsRender = false;
    const threshold = 0.01;
    if (!isDragging && !pinned && rotationSpeed !== 0 && (!stopOnHover || !isHovering)) {
      targetRotation.x += rotationSpeed * 0.01;
    }
    if (!isDragging && smoothingN > 0) {
      if (Math.abs(velocity.x) > threshold || Math.abs(velocity.y) > threshold) {
        targetRotation.x += velocity.x;
        targetRotation.y += velocity.y;
        targetRotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.y));
        velocity.x *= velocityDecay;
        velocity.y *= velocityDecay;
      } else {
        velocity.x = 0;
        velocity.y = 0;
      }
    }
    const dx = targetRotation.x - rotation.x;
    const dy = targetRotation.y - rotation.y;
    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold || rotationSpeed !== 0 || isDragging) {
      rotation.x += dx * lerpFactor;
      rotation.y += dy * lerpFactor;
      rotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotation.y));
      needsRender = true;
    }
    if (needsRender || rotationSpeed !== 0 || isDragging) {
      globeGroup.rotation.y = rotation.x;
      globeGroup.rotation.x = rotation.y;
      renderer.render(scene, camera);
    }
    updateTooltip();
    const hasVelocity = Math.abs(velocity.x) > threshold || Math.abs(velocity.y) > threshold;
    const hasLerpDelta = Math.abs(dx) > threshold || Math.abs(dy) > threshold;
    const needsContinue = isDragging || rotationSpeed !== 0 || hasVelocity || hasLerpDelta;
    animationFrameId = needsContinue ? requestAnimationFrame(animate) : null;
  };

  function startAnimation() {
    if (animationFrameId === null) animationFrameId = requestAnimationFrame(animate);
  }
  if (rotationSpeed !== 0) startAnimation();

  const raycaster = new Raycaster();
  const mouse = new Vector2();
  const pick = event => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([oceanMesh, ...hitSpheres], false);
    const first = intersects[0];
    return {
      onGlobe: intersects.length > 0,
      marker: first && first.object !== oceanMesh ? first.object : null,
    };
  };

  const markerScreen = new Vector3();
  const pickNearest = (event, maxDistance) => {
    const rect = canvas.getBoundingClientRect();
    const cameraDirection = camera.position.clone().normalize();
    let best = null;
    let bestDistance = maxDistance;
    hitSpheres.forEach(hit => {
      hit.getWorldPosition(markerScreen);
      if (markerScreen.clone().normalize().dot(cameraDirection) <= 0.05) return;
      markerScreen.project(camera);
      const x = rect.left + ((markerScreen.x + 1) / 2) * rect.width;
      const y = rect.top + ((1 - markerScreen.y) / 2) * rect.height;
      const distance = Math.hypot(event.clientX - x, event.clientY - y);
      if (distance < bestDistance) {
        best = hit;
        bestDistance = distance;
      }
    });
    return best;
  };

  const sensitivity = mapDragSpeedUiToSensitivity(dragSpeed);
  let dragPointerId = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let downX = 0;
  let downY = 0;
  let downTime = 0;

  const handlePointerDown = event => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    isDragging = true;
    dragPointerId = event.pointerId;
    velocity.x = 0;
    velocity.y = 0;
    lastPointerX = downX = event.clientX;
    lastPointerY = downY = event.clientY;
    downTime = performance.now();
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer already released; dragging still works without capture.
    }
    canvas.style.cursor = "grabbing";
    startAnimation();
  };

  const handlePointerMove = event => {
    if (isDragging && event.pointerId === dragPointerId) {
      const dx = event.clientX - lastPointerX;
      const dy = event.clientY - lastPointerY;
      targetRotation.x += dx * sensitivity;
      targetRotation.y += dy * sensitivity;
      targetRotation.y = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotation.y));
      velocity.x = dx * sensitivity * 0.3;
      velocity.y = dy * sensitivity * 0.3;
      lastPointerX = event.clientX;
      lastPointerY = event.clientY;
      return;
    }
    if (event.pointerType !== "mouse") return;
    const { onGlobe, marker } = pick(event);
    if (stopOnHover) isHovering = onGlobe;
    canvas.style.cursor = marker ? "pointer" : "grab";
    if (!pinned) showTooltip(marker);
  };

  const handlePointerUp = event => {
    if (event.pointerId !== dragPointerId) return;
    isDragging = false;
    dragPointerId = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = "grab";
    const moved = Math.hypot(event.clientX - downX, event.clientY - downY);
    if (event.type === "pointerup" && moved < 6 && performance.now() - downTime < 300) {
      const marker = event.pointerType === "mouse" ? pick(event).marker : pickNearest(event, 24);
      if (marker) {
        pinned = true;
        showTooltip(marker);
      } else {
        pinned = false;
        showTooltip(null);
      }
      startAnimation();
    }
  };

  const handlePointerLeave = event => {
    if (event.pointerType !== "mouse" || isDragging) return;
    isHovering = false;
    canvas.style.cursor = "grab";
    if (!pinned) showTooltip(null);
  };

  canvas.addEventListener("pointerdown", handlePointerDown);
  canvas.addEventListener("pointermove", handlePointerMove);
  canvas.addEventListener("pointerup", handlePointerUp);
  canvas.addEventListener("pointercancel", handlePointerUp);
  canvas.addEventListener("pointerleave", handlePointerLeave);

  const resizeObserver = new ResizeObserver(() => {
    const newWidth = container.clientWidth || container.offsetWidth || 800;
    const newHeight = container.clientHeight || container.offsetHeight || 600;
    camera.aspect = newWidth / newHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(newWidth, newHeight);
    camera.position.set(0, 0, 2.5 / scaleMultiplier);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
    updateTooltip();
  });
  resizeObserver.observe(container);

  loadWorldData();

  return {
    destroy() {
      if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerup", handlePointerUp);
      canvas.removeEventListener("pointercancel", handlePointerUp);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      resizeObserver.disconnect();
      renderer.dispose();
      container.removeChild(canvas);
    },
  };
}

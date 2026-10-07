/* Faint formula field for the cream page. The white article covers it. */
(() => {
  const root = document.querySelector(".site-shell");
  if (!root) return;

  const FORMULAS = [
    "∇ · E = ρ / ε₀",
    "∇ · B = 0",
    "∇ × E = −∂B/∂t",
    "∇ × B = μ₀J + μ₀ε₀ ∂E/∂t",
    "iℏ ∂Ψ/∂t = ĤΨ",
    "Ad Astra per Aspera",
    "知行合一",
    "E = ℏω",
    "Δx Δp ≥ ℏ/2",
    "nᵢ² = np",
    "E_g = E_c − E_v",
    "f(E) = 1 / (1 + e^((E − E_F) / kT))",
    "Jₙ = qnμₙE + qDₙ∇n"
  ];

  const NAVY = [23, 63, 95];
  const WARM = [138, 90, 59];
  const MOTTO = "Ad Astra per Aspera";
  const ZH = "知行合一";
  const LANES = 7;
  const REACH = 168;
  const PUSH = 22;
  const GAP = 64;
  const BOW = 12;

  const canvas = document.createElement("canvas");
  canvas.className = "formula-field";
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.position = "fixed";
  canvas.style.inset = "0";
  canvas.style.zIndex = "0";
  canvas.style.pointerEvents = "none";
  document.body.prepend(canvas);
  root.style.position = "relative";
  root.style.zIndex = "1";

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: -1e4, y: -1e4, on: false };
  let influence = 0;
  let quiet = false;
  let width = 1;
  let height = 1;
  let dpr = 1;
  let phase = 0;
  let last = 0;
  let raf = 0;
  let running = false;

  const tiers = [
    { size: 13, alpha: 0.13, speed: 16 },
    { size: 15, alpha: 0.18, speed: 24 },
    { size: 17, alpha: 0.24, speed: 32 }
  ];
  const coarse = window.matchMedia("(pointer: coarse)").matches;

  function phone() {
    return width <= 980;
  }

  function face(size, text) {
    const cjk = text === ZH ? ', "Microsoft YaHei", "PingFang SC", "Noto Sans SC", sans-serif' : "";
    return `italic ${size}px Georgia, "Times New Roman", serif${cjk}`;
  }

  function measure(size) {
    return FORMULAS.map((text) => {
      ctx.font = face(size, text);
      return ctx.measureText(text).width;
    });
  }

  let widths = tiers.map((tier) => measure(tier.size));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, document.documentElement.clientWidth);
    height = Math.max(1, document.documentElement.clientHeight);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    widths = tiers.map((tier) => measure(tier.size));
  }

  function profileZone() {
    const side = document.querySelector(".sidebar");
    const links = document.querySelector(".rail-links");
    if (!side || !links) return null;
    const box = side.getBoundingClientRect();
    const rail = links.getBoundingClientRect();
    if (box.width < 8 || box.right < 16) return null;
    return {
      left: box.left - 6,
      right: box.right + 6,
      top: box.top,
      bottom: rail.bottom + 10
    };
  }

  function crossesProfile(zone, x, y, textWidth) {
    if (!zone) return false;
    return x < zone.right && x + textWidth > zone.left && y + 12 > zone.top && y - 12 < zone.bottom;
  }

  function nearSidebar() {
    const side = document.querySelector(".sidebar");
    if (!side) return false;
    const box = side.getBoundingClientRect();
    if (box.width < 8 || box.right < 16) return false;
    const pad = 12;
    return pointer.x >= box.left - pad && pointer.x <= box.right + pad
      && pointer.y >= box.top && pointer.y <= box.bottom;
  }

  function displace(x, y) {
    if (coarse || quiet || influence < 0.01) return { x, y, tint: 0 };
    const dx = x - pointer.x;
    const dy = y - pointer.y;
    const dist = Math.hypot(dx, dy);
    if (dist >= REACH || dist < 0.001) return { x, y, tint: 0 };
    const envelope = Math.sin((Math.PI * dist) / REACH) * influence;
    return {
      x: x + (dx / dist) * PUSH * envelope,
      y: y + (dy / dist) * PUSH * envelope,
      tint: envelope
    };
  }

  function color(text, alpha, tint) {
    if (text === MOTTO || text === ZH) {
      const strength = Math.min(0.88, 0.78 + 0.1 * tint);
      return `rgba(${WARM[0]}, ${WARM[1]}, ${WARM[2]}, ${strength.toFixed(3)})`;
    }
    const strength = Math.min(0.5, alpha + (0.46 - alpha) * tint);
    return `rgba(${NAVY[0]}, ${NAVY[1]}, ${NAVY[2]}, ${strength.toFixed(3)})`;
  }

  function drawPhone() {
    const main = document.querySelector(".main-content");
    const band = main ? main.getBoundingClientRect().top : 0;
    if (band < 32) return;
    const toggle = document.querySelector(".mobile-toggle");
    const button = toggle ? toggle.getBoundingClientRect() : null;
    const left = (button ? button.right : 8) + 14;
    const right = width - 12;
    const room = right - left;
    if (room < 80) return;
    const size = 14;
    const gap = 36;
    const y = band * 0.52;
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, 0, room, band);
    ctx.clip();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const measured = FORMULAS.map((text) => {
      ctx.font = face(size, text);
      return ctx.measureText(text).width;
    });
    const period = measured.reduce((sum, item) => sum + item + gap, 0) || 1;
    let cursor = -((phase * 22) % period);
    let index = 0;
    while (cursor < right) {
      const text = FORMULAS[index % FORMULAS.length];
      const textWidth = measured[index % FORMULAS.length];
      if (cursor + textWidth > left) {
        ctx.font = face(size, text);
        ctx.fillStyle = color(text, 0.5, 0);
        ctx.fillText(text, cursor, y);
      }
      cursor += textWidth + gap;
      index += 1;
    }
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);
    if (phone()) {
      drawPhone();
      return;
    }
    const zone = profileZone();
    const active = tiers;
    const lanes = LANES;
    const gap = GAP;
    const band = height * 0.6;
    const bandTop = (height - band) / 2;
    const span = band / Math.max(lanes - 1, 1);
    for (let lane = 0; lane < lanes; lane += 1) {
      const tier = active[lane % active.length];
      const measured = widths[lane % active.length];
      const period = measured.reduce((sum, item) => sum + item + gap, 0) || 1;
      const baseY = bandTop + span * lane;
      const bow = BOW * (0.55 + (lane % active.length) * 0.25);
      let cursor = -((phase * tier.speed) % period);
      let index = lane % FORMULAS.length;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      while (cursor < width + 40) {
        const text = FORMULAS[index % FORMULAS.length];
        const textWidth = measured[index % FORMULAS.length];
        const center = cursor + textWidth / 2;
        const along = (center / Math.max(width, 1)) * Math.PI;
        const y = baseY - Math.sin(along) * bow;
        if (cursor < width && cursor + textWidth > -20 && !crossesProfile(zone, cursor, y, textWidth)) {
          const moved = displace(center, y);
          ctx.font = face(tier.size, text);
          ctx.fillStyle = color(text, tier.alpha, moved.tint);
          ctx.fillText(text, moved.x - textWidth / 2, moved.y);
        }
        cursor += textWidth + gap;
        index += 1;
      }
    }
  }

  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    const dt = last === 0 ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    phase += dt;
    quiet = nearSidebar();
    const goal = pointer.on && !quiet ? 1 : 0;
    influence += (goal - influence) * Math.min(1, dt * 6);
    draw();
  }

  function sync() {
    const should = !reduced && !document.hidden;
    if (should === running) return;
    running = should;
    if (running) {
      last = 0;
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
    }
  }

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.on = true;
  }, { passive: true });
  window.addEventListener("pointerleave", () => { pointer.on = false; });
  document.addEventListener("visibilitychange", sync);
  window.addEventListener("resize", () => {
    resize();
    if (!running) draw();
  });

  resize();
  draw();
  sync();
})();

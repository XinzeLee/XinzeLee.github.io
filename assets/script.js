(() => {
  // ---------- Theme ----------
  const root = document.documentElement;
  const themeBtn = document.getElementById("themeBtn");

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) root.setAttribute("data-theme", savedTheme);

  function toggleTheme() {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  }
  themeBtn?.addEventListener("click", toggleTheme);

  // ---------- Copy-to-clipboard ----------
  function toast(msg) {
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.position = "fixed";
    el.style.bottom = "18px";
    el.style.left = "50%";
    el.style.transform = "translateX(-50%)";
    el.style.padding = "10px 12px";
    el.style.borderRadius = "14px";
    el.style.border = "1px solid rgba(255,255,255,.18)";
    el.style.background = "rgba(0,0,0,.72)";
    el.style.color = "white";
    el.style.fontWeight = "800";
    el.style.zIndex = "9999";
    el.style.backdropFilter = "blur(10px)";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
  }

  document.querySelectorAll("[data-copy]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy");
      try {
        await navigator.clipboard.writeText(text);
        toast("Copied!");
      } catch {
        toast("Copy failed");
      }
    });
  });

  // ---------- Footer ----------
  document.getElementById("year").textContent = new Date().getFullYear();
  document.getElementById("lastUpdated").textContent =
    new Date(document.lastModified).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

  document.getElementById("printBtn")?.addEventListener("click", () => window.print());

  // ---------- AI dialog ----------
  const aiChip = document.getElementById("aiChip");
  const aiDialog = document.getElementById("aiDialog");
  const aiClose = document.getElementById("aiClose");
  const aiOk = document.getElementById("aiOk");

  function openAIDialog() { aiDialog?.showModal(); }
  function closeAIDialog() { aiDialog?.close(); }

  aiChip?.addEventListener("click", openAIDialog);
  aiClose?.addEventListener("click", closeAIDialog);
  aiOk?.addEventListener("click", closeAIDialog);

  // ---------- Publications (role-based tags: First/Corresponding author) ----------
  // Edit freely.
  const pubs = [
    {
      title: "Artificial-Intelligence-Based Design for Circuit Parameters of Power Converters",
      meta: "IEEE Transactions on Industrial Electronics (Nov 2022) • X. Li, X. Zhang, F. Lin, F. Blaabjerg",
      role: "First author"
    },
    {
      title: "Data-Light Physics-Informed Modeling for the Modulation Optimization of a Dual-Active-Bridge Converter",
      meta: "IEEE Transactions on Power Electronics (Jul 2024) • X. Li, F. Lin, X. Zhang, H. Ma, F. Blaabjerg",
      role: "First author"
    },
    {
      title: "Topology Transfer: A Generic Modeling Approach for Varied Dual-Active-Bridge Converters via Physics-in-Architecture and Mixture Density Networks",
      meta: "IEEE Transactions on Industrial Electronics (2024) • X. Li, F. Lin, C. Sun, X. Zhang, H. Ma, C. Wen, F. Blaabjerg, H. A. Mantooth",
      role: "First author"
    },
    {
      title: "STAR: One-Stop Optimization for Dual-Active-Bridge Converter With Robustness to Operational Diversity",
      meta: "IEEE JESTPE (Jun 2024) • F. Lin, X. Li, X. Zhang, H. Ma",
      role: "Corresponding author"
    },
    {
      title: "PE-GPT: a New Paradigm for Power Electronics Design",
      meta: "IEEE Transactions on Industrial Electronics (Oct 2024) • F. Lin, X. Li, X. Zhang, H. Ma",
      role: "Corresponding author"
    },
    {
      title: "NeurPecs: Physics-Informed AI-Based Adaptive Circuit Simulator for Power Converters",
      meta: "IEEE Transactions on Industrial Electronics (2025) • X. Li, F. Lin, J. J. Rodríguez-Andina, J. M. Guerrero, H. A. Mantooth, H. Ma",
      role: "First author"
    }
  ];

  const listEl = document.getElementById("pubList");
  const filterEl = document.getElementById("pubFilter");

  function highlight(text, query) {
    if (!query) return text;
    const safe = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(safe, "ig"), (m) => `<mark>${m}</mark>`);
  }

  function renderPubs(query = "") {
    const q = query.trim().toLowerCase();
    const filtered = pubs.filter(p =>
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.meta.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q)
    );

    listEl.innerHTML = filtered.map(p => `
      <article class="pub">
        <div class="pub__top">
          <div>
            <div class="pub__title">${highlight(p.title, query)}</div>
            <div class="pub__meta">${highlight(p.meta, query)}</div>
          </div>
          <div class="pub__tag">${p.role}</div>
        </div>
      </article>
    `).join("");

    if (filtered.length === 0) {
      listEl.innerHTML = `<div class="muted">No publications matched “${query}”.</div>`;
    }
  }

  renderPubs();
  filterEl?.addEventListener("input", (e) => renderPubs(e.target.value));

  // ---------- Command palette (Ctrl/⌘ K) ----------
  const cmdBtn = document.getElementById("cmdBtn");
  const cmdk = document.getElementById("cmdk");
  const cmdkInput = document.getElementById("cmdkInput");
  const cmdkList = document.getElementById("cmdkList");

  const commands = [
    { title: "Experience", desc: "Jump to roles & timeline", href: "#experience" },
    { title: "Education", desc: "Degrees & training", href: "#education" },
    { title: "Projects", desc: "Industry & research highlights", href: "#projects" },
    { title: "Teaching", desc: "Courses & mentoring", href: "#teaching" },
    { title: "Service", desc: "Talks, chairs, editorial", href: "#service" },
    { title: "Awards", desc: "Selected awards & honors", href: "#awards" },
    { title: "Publications", desc: "Filterable selected publications", href: "#pubs" },
    { title: "Skills", desc: "AI + power electronics toolkit", href: "#skills" },
    { title: "Contact", desc: "Email, phone, LinkedIn, address", href: "#contact" },
    { title: "Download CV (PDF)", desc: "Open assets/CV.pdf", href: "assets/CV.pdf" }
  ];

  function openCmdk() {
    cmdk.hidden = false;
    cmdkInput.value = "";
    renderCmdk("");
    setTimeout(() => cmdkInput.focus(), 0);
  }
  function closeCmdk() { cmdk.hidden = true; }

  function renderCmdk(q) {
    const query = q.trim().toLowerCase();
    const items = commands.filter(c =>
      !query || c.title.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query)
    );

    cmdkList.innerHTML = items.map((c, idx) => `
      <div class="cmdk__item" role="option" data-href="${c.href}" data-idx="${idx}">
        <div class="cmdk__itemTitle">${c.title}</div>
        <div class="cmdk__itemDesc">${c.desc}</div>
      </div>
    `).join("");

    cmdkList.querySelectorAll(".cmdk__item").forEach(el => {
      el.addEventListener("click", () => {
        const href = el.getAttribute("data-href");
        closeCmdk();
        if (href.startsWith("#")) location.hash = href;
        else window.open(href, "_blank", "noopener");
      });
    });
  }

  cmdBtn?.addEventListener("click", openCmdk);

  document.addEventListener("keydown", (e) => {
    const isK = (e.key.toLowerCase() === "k");
    const mod = (e.metaKey || e.ctrlKey);

    if (mod && isK) { e.preventDefault(); openCmdk(); }
    if (e.key === "Escape" && !cmdk.hidden) closeCmdk();
  });

  cmdk?.addEventListener("click", (e) => {
    if (e.target && e.target.matches("[data-cmdk-close]")) closeCmdk();
  });

  cmdkInput?.addEventListener("input", (e) => renderCmdk(e.target.value));
})();

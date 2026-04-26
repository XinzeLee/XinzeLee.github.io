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
  const yearEl = document.getElementById("year");
  const lastUpdatedEl = document.getElementById("lastUpdated");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  if (lastUpdatedEl) {
    lastUpdatedEl.textContent = new Date(document.lastModified).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

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

  if (listEl) {
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
  }

  // ---------- Command palette (Ctrl/⌘ K) ----------
  const cmdBtn = document.getElementById("cmdBtn");
  const cmdk = document.getElementById("cmdk");
  const cmdkInput = document.getElementById("cmdkInput");
  const cmdkList = document.getElementById("cmdkList");

  if (cmdk && cmdkInput && cmdkList) {
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
      { title: "Download CV (PDF)", desc: "Open assets/CV.pdf", href: "assets/CV.pdf" },
    ];

    function openCmdk() {
      cmdk.hidden = false;
      cmdkInput.value = "";
      renderCmdk("");
      setTimeout(() => cmdkInput.focus(), 0);
    }
    function closeCmdk() {
      cmdk.hidden = true;
    }

    function renderCmdk(q) {
      const query = q.trim().toLowerCase();
      const items = commands.filter(
        c => !query || c.title.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query)
      );

      cmdkList.innerHTML = items
        .map(
          (c, idx) => `
      <div class="cmdk__item" role="option" data-href="${c.href}" data-idx="${idx}">
        <div class="cmdk__itemTitle">${c.title}</div>
        <div class="cmdk__itemDesc">${c.desc}</div>
      </div>
    `
        )
        .join("");

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

    document.addEventListener("keydown", e => {
      const isK = e.key.toLowerCase() === "k";
      const mod = e.metaKey || e.ctrlKey;

      if (mod && isK) {
        e.preventDefault();
        openCmdk();
      }
      if (e.key === "Escape" && !cmdk.hidden) closeCmdk();
    });

    cmdk.addEventListener("click", e => {
      if (e.target && e.target.matches("[data-cmdk-close]")) closeCmdk();
    });

    cmdkInput.addEventListener("input", e => renderCmdk(e.target.value));
  }

  // ---------- Google Scholar stats (realtime from profile page) ----------
  const SCHOLAR_USER = "YilrlZMAAAAJ";
  const SCHOLAR_URL = `https://scholar.google.com/citations?user=${SCHOLAR_USER}&hl=en`;
  const statCitationsEl = document.getElementById("statCitations");
  const statHindexEl = document.getElementById("statHindex");
  const statI10El = document.getElementById("statI10");
  const statCitationsDateEl = document.getElementById("statCitationsDate");

  const defaultStats = { citations: 731, hindex: 15, i10: 18 };

  function parseScholarHtml(html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const stats = { citations: null, hindex: null, i10: null };

    // Google Scholar profile: table id="gsc_rsb_st" with rows like "Cited by", "h-index", "i10-index"
    const table = doc.getElementById("gsc_rsb_st");
    if (table) {
      const rows = table.querySelectorAll("tr");
      rows.forEach((tr) => {
        const cells = tr.querySelectorAll("td");
        if (cells.length >= 2) {
          const label = (cells[0].textContent || "").trim().toLowerCase();
          const value = parseInt((cells[1].textContent || "").replace(/\D/g, ""), 10);
          if (isNaN(value)) return;
          if (label.includes("cited") || label.includes("citation")) stats.citations = value;
          else if (label.includes("h-index") || label === "h-index") stats.hindex = value;
          else if (label.includes("i10")) stats.i10 = value;
        }
      });
    }

    // Fallback: regex for gsc_rsb_std numbers (order: Cited by, h-index, i10-index)
    if (stats.citations == null || stats.hindex == null || stats.i10 == null) {
      const stdMatches = html.match(/gsc_rsb_std[^>]*>(\d+)</g);
      if (stdMatches && stdMatches.length >= 3) {
        const nums = stdMatches.map((m) => parseInt(m.replace(/\D/g, ""), 10));
        if (stats.citations == null) stats.citations = nums[0];
        if (stats.hindex == null) stats.hindex = nums[1];
        if (stats.i10 == null) stats.i10 = nums[2];
      }
    }

    return stats;
  }

  function updateScholarUI(data, dateLabel) {
    if (data.citations != null && statCitationsEl) statCitationsEl.textContent = data.citations.toLocaleString();
    if (data.hindex != null && statHindexEl) statHindexEl.textContent = data.hindex;
    if (data.i10 != null && statI10El) statI10El.textContent = data.i10;
    if (dateLabel && statCitationsDateEl) statCitationsDateEl.textContent = dateLabel;
  }

  function setScholarFromFetch(citations, hindex, i10) {
    const d = new Date();
    const dateLabel = `(updated ${d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })})`;
    updateScholarUI({ citations, hindex, i10 }, dateLabel);
  }

  function applyScholarJson(data) {
    const c = data.citations ?? data.citation_count;
    const h = data.h_index ?? data.hindex;
    const i = data.i10_index ?? data.i10;
    if (typeof c === "number" && typeof h === "number" && typeof i === "number") {
      const dateLabel = data.updated ? `(updated ${data.updated})` : "";
      updateScholarUI({ citations: c, hindex: h, i10: i }, dateLabel);
      return true;
    }
    return false;
  }

  async function fetchScholarStats() {
    // 1. Load cached JSON first (same-origin, fast) so numbers show immediately
    try {
      const jsonRes = await fetch("scholar_stats.json");
      if (jsonRes.ok) {
        const data = await jsonRes.json();
        if (applyScholarJson(data)) {
          // 2. Optionally refresh from live source in background (no await)
          refreshScholarInBackground();
          return;
        }
      }
    } catch (_) {
      /* ignore */
    }

    // 3. No JSON or invalid: try CORS proxies (slower, may be blocked)
    const proxies = [
      () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(SCHOLAR_URL)}`),
      () => fetch(`https://corsproxy.io/?${encodeURIComponent(SCHOLAR_URL)}`),
    ];
    for (const proxy of proxies) {
      try {
        const res = await proxy();
        if (!res.ok) continue;
        const html = await res.text();
        const stats = parseScholarHtml(html);
        if (stats.citations != null && stats.hindex != null && stats.i10 != null) {
          setScholarFromFetch(stats.citations, stats.hindex, stats.i10);
          return;
        }
      } catch (_) {
        /* try next */
      }
    }

    // 4. Keep default static values (already in HTML)
  }

  function refreshScholarInBackground() {
    const proxies = [
      () => fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(SCHOLAR_URL)}`),
      () => fetch(`https://corsproxy.io/?${encodeURIComponent(SCHOLAR_URL)}`),
    ];
    (async () => {
      for (const proxy of proxies) {
        try {
          const res = await proxy();
          if (!res.ok) continue;
          const html = await res.text();
          const stats = parseScholarHtml(html);
          if (stats.citations != null && stats.hindex != null && stats.i10 != null) {
            setScholarFromFetch(stats.citations, stats.hindex, stats.i10);
            break;
          }
        } catch (_) {
          /* try next */
        }
      }
    })();
  }

  if (statCitationsEl && statHindexEl && statI10El) fetchScholarStats();
})();

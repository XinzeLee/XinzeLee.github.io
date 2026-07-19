(() => {
  const body = document.body;
  const toggle = document.querySelector("[data-nav-toggle]");
  const overlay = document.querySelector("[data-nav-close]");

  const closeNavigation = () => {
    body.classList.remove("nav-open");
    toggle?.setAttribute("aria-expanded", "false");
  };

  toggle?.addEventListener("click", () => {
    const open = body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  overlay?.addEventListener("click", closeNavigation);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeNavigation();
  });
  document.querySelectorAll(".site-nav a").forEach(link => {
    link.addEventListener("click", closeNavigation);
  });

  document.querySelectorAll("[data-year]").forEach(node => {
    node.textContent = String(new Date().getFullYear());
  });

  document.querySelectorAll("[data-copy]").forEach(button => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.copy || "");
        const original = button.textContent;
        button.textContent = "Copied";
        window.setTimeout(() => { button.textContent = original; }, 1200);
      } catch {
        window.location.href = `mailto:${button.dataset.copy || ""}`;
      }
    });
  });

  const search = document.querySelector("[data-publication-search]");
  const filterButtons = [...document.querySelectorAll("[data-publication-filter]")];
  const citations = [...document.querySelectorAll("[data-citation]")];
  const sections = [...document.querySelectorAll("[data-publication-section]")];
  const empty = document.querySelector("[data-publication-empty]");
  let activeCategory = "all";

  function filterPublications() {
    if (!citations.length) return;
    const query = (search?.value || "").trim().toLocaleLowerCase();
    let visibleTotal = 0;

    citations.forEach(citation => {
      const matchesCategory =
        activeCategory === "all" || citation.dataset.category === activeCategory;
      const matchesQuery = !query || citation.textContent.toLocaleLowerCase().includes(query);
      citation.hidden = !(matchesCategory && matchesQuery);
      if (!citation.hidden) visibleTotal += 1;
    });

    sections.forEach(section => {
      const visible = section.querySelectorAll("[data-citation]:not([hidden])").length;
      section.hidden = visible === 0;
      section.querySelector("[data-visible-count]")?.replaceChildren(String(visible));
    });
    if (empty) empty.hidden = visibleTotal !== 0;
  }

  search?.addEventListener("input", filterPublications);
  filterButtons.forEach(button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.publicationFilter || "all";
      filterButtons.forEach(item => {
        item.setAttribute("aria-pressed", String(item === button));
      });
      filterPublications();
    });
  });

  const stats = {
    citations: document.querySelector("[data-scholar-citations]"),
    hIndex: document.querySelector("[data-scholar-hindex]"),
    i10: document.querySelector("[data-scholar-i10]"),
    updated: document.querySelector("[data-scholar-updated]"),
  };
  if (stats.citations && stats.hIndex && stats.i10) {
    fetch("scholar_stats.json")
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        stats.citations.textContent = Number(data.citations ?? data.citation_count).toLocaleString();
        stats.hIndex.textContent = data.h_index ?? data.hindex;
        stats.i10.textContent = data.i10_index ?? data.i10;
        if (stats.updated && data.updated) stats.updated.textContent = `Updated ${data.updated}`;
      })
      .catch(() => {});
  }

  const highlights = [...document.querySelectorAll("[data-research-highlight]")];
  const syncCue = details => {
    const cue = details.querySelector("[data-expand-cue]");
    if (cue) cue.textContent = details.open ? "Collapse" : "Expand";
  };
  highlights.forEach(details => {
    syncCue(details);
    details.addEventListener("toggle", () => {
      syncCue(details);
      if (!details.open) return;
      highlights.forEach(other => {
        if (other !== details) {
          other.open = false;
          syncCue(other);
        }
      });
    });
  });

  document.querySelectorAll("[data-research-carousel]").forEach(carousel => {
    const slides = [...carousel.querySelectorAll("[data-carousel-slide]")];
    const status = carousel.closest(".research-carousel-block")?.querySelector("[data-carousel-status]");
    const prev = carousel.querySelector("[data-carousel-prev]");
    const next = carousel.querySelector("[data-carousel-next]");
    if (!slides.length) return;
    let index = Math.max(0, slides.findIndex(slide => slide.classList.contains("is-active")));

    const show = nextIndex => {
      index = ((nextIndex % slides.length) + slides.length) % slides.length;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === index;
        slide.classList.toggle("is-active", active);
        slide.hidden = !active;
        if (!active) {
          const video = slide.querySelector("video");
          if (video && !video.paused) video.pause();
        }
      });
      if (status) status.textContent = `${index + 1} / ${slides.length}`;
    };

    prev?.addEventListener("click", () => show(index - 1));
    next?.addEventListener("click", () => show(index + 1));
    show(index);
  });

  let lightbox = document.querySelector("[data-research-lightbox]");
  let lightboxStage = null;
  let lightboxClose = null;
  let lightboxTrigger = null;

  const ensureLightbox = () => {
    if (lightbox) return lightbox;
    lightbox = document.createElement("div");
    lightbox.className = "research-lightbox";
    lightbox.hidden = true;
    lightbox.dataset.researchLightbox = "";
    lightbox.setAttribute("role", "dialog");
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("aria-label", "Enlarged research media");
    lightbox.innerHTML = `
      <div class="research-lightbox__dialog">
        <button class="research-lightbox__close" type="button" data-lightbox-close aria-label="Close enlarged media">×</button>
        <div class="research-lightbox__stage" data-lightbox-stage></div>
      </div>`;
    document.body.appendChild(lightbox);
    lightboxStage = lightbox.querySelector("[data-lightbox-stage]");
    lightboxClose = lightbox.querySelector("[data-lightbox-close]");
    lightbox.addEventListener("click", event => {
      if (event.target === lightbox) closeLightbox();
    });
    lightboxClose?.addEventListener("click", closeLightbox);
    return lightbox;
  };

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    const playing = lightboxStage?.querySelector("video");
    if (playing && !playing.paused) playing.pause();
    if (lightboxStage) lightboxStage.replaceChildren();
    lightbox.hidden = true;
    document.body.style.overflow = "";
    lightboxTrigger?.focus?.();
    lightboxTrigger = null;
  };

  const openLightboxFrom = trigger => {
    ensureLightbox();
    const sourceImg = trigger.matches("img") ? trigger : trigger.closest(".research-carousel__media")?.querySelector("img");
    const sourceVideo = trigger.closest(".research-carousel__media")?.querySelector("video");
    lightboxStage.replaceChildren();
    if (sourceImg) {
      const img = document.createElement("img");
      img.src = sourceImg.currentSrc || sourceImg.src;
      img.alt = sourceImg.alt || "Enlarged research figure";
      lightboxStage.appendChild(img);
    } else if (sourceVideo) {
      const video = document.createElement("video");
      video.controls = true;
      video.playsInline = true;
      video.src = sourceVideo.currentSrc || sourceVideo.dataset.lightboxSrc || sourceVideo.querySelector("source")?.src || "";
      lightboxStage.appendChild(video);
    } else {
      return;
    }
    lightboxTrigger = trigger;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose?.focus();
  };

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-lightbox-trigger]");
    if (!trigger) return;
    event.preventDefault();
    openLightboxFrom(trigger);
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeLightbox();
      return;
    }
    if (event.key !== "Enter" && event.key !== " ") return;
    const trigger = event.target.closest("[data-lightbox-trigger]");
    if (!trigger || trigger.tagName === "BUTTON") return;
    event.preventDefault();
    openLightboxFrom(trigger);
  });
})();

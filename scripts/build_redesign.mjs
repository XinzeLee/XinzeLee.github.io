import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publications = JSON.parse(
  fs.readFileSync(path.join(root, "assets", "publications.json"), "utf8").replace(/^\uFEFF/, "")
);

const pages = [
  ["index.html", "Home"],
  ["group.html", "Group"],
  ["research.html", "Selected Research"],
  ["teaching.html", "Teaching"],
  ["publications.html", "Publications"],
  ["service.html", "Academic Services"],
  ["opensource.html", "Open-source Projects"],
];

const escapeHtml = value => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

function sidebar(active) {
  const links = pages.map(([href, label]) =>
    `<a href="${href}"${label === active ? ' aria-current="page"' : ""}>${label}</a>`
  ).join("");
  return `<button class="mobile-toggle" type="button" data-nav-toggle aria-label="Open navigation" aria-expanded="false">☰</button>
    <div class="overlay" data-nav-close></div>
    <aside class="sidebar" aria-label="Profile and main navigation">
      <a href="index.html"><img class="profile-photo" src="assets/XZL_photo.png" alt="Portrait of Xinze Li"></a>
      <div class="identity">
        <p class="identity__name">Xinze Li</p>
        <p class="identity__role">Assistant Professor<br>Electrical &amp; Computer Engineering<br>Florida State University</p>
      </div>
      <nav class="site-nav" aria-label="Main navigation">${links}</nav>
      <div class="rail-links">
        <a href="assets/CV.pdf">CV</a>
        <a href="https://scholar.google.com/citations?user=YilrlZMAAAAJ" target="_blank" rel="noopener">Scholar</a>
        <a href="https://github.com/XinzeLee" target="_blank" rel="noopener">GitHub</a>
        <a href="hiring.html">PhD opening</a>
      </div>
    </aside>`;
}

function footer() {
  return `<footer class="site-footer" aria-hidden="true"><!-- Reserved for the future group name. --></footer>`;
}

function layout({ title, description, active, content, schema = "" }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#24282c">
  <title>${escapeHtml(title)} — Xinze Li</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:title" content="${escapeHtml(title)} — Xinze Li">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  ${schema}
  <link rel="stylesheet" href="assets/redesign.css">
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <div class="site-shell">
    ${sidebar(active)}
    <main class="main-content" id="main-content">${content}${footer()}</main>
  </div>
  <script src="assets/site.js"></script>
</body>
</html>
`;
}

const homeSchema = `<script type="application/ld+json">
{"@context":"https://schema.org","@type":"Person","name":"Xinze Li","jobTitle":"Assistant Professor","affiliation":{"@type":"CollegeOrUniversity","name":"Florida State University"},"email":"mailto:xinzeli831@gmail.com","address":{"@type":"PostalAddress","addressLocality":"Tallahassee","addressRegion":"FL","addressCountry":"US"},"url":"https://xinzelee.github.io/","sameAs":["https://www.linkedin.com/in/xinze-li-8199561b0/","https://github.com/XinzeLee","https://scholar.google.com/citations?user=YilrlZMAAAAJ"]}
</script>`;

const home = layout({
  title: "Home",
  description: "Xinze Li is an Assistant Professor at Florida State University researching next-generation AI for power electronics and semiconductor technologies.",
  active: "Home",
  schema: homeSchema,
  content: `
    <header class="page-header">
      <p class="eyebrow">Florida State University</p>
      <h1>Xinze Li</h1>
      <p class="lead">Next-generation AI for power electronics technologies</p>
    </header>

    <section class="section" id="about">
      <h2 class="rule-title">About Me</h2>
      <p>Xinze Li (Member, IEEE) received the bachelor’s degree in Electrical Engineering from Shandong University, Shandong, China, in 2018, and the Ph.D. degree in Electrical and Electronic Engineering from Nanyang Technological University, Singapore, in 2023. He joined the University of Arkansas, USA, as a postdoctoral research fellow in 2024 and a lecturer in 2025. He is currently an Assistant Professor with the Department of Electrical and Computer Engineering, Florida State University, Tallahassee, FL, USA.</p>
      <p>His research interests center on next-generation AI for power electronics technologies, including AI for power electronics simulation and modeling, maintenance and reliability, and process automation, as well as digital twins and process optimization for semiconductor fabrication. His work is driven by three core AI themes: physical AI, explainable AI, and agentic AI.</p>
    </section>

    <section class="section" id="news">
      <h2 class="rule-title">News and Updates</h2>
      <ol class="news-feed">
        <li><span class="news-date">August 2026</span><span class="news-tag">[Appointment]</span><span class="news-copy">I joined Florida State University as an Assistant Professor in Electrical and Computer Engineering.</span></li>
        <li><span class="news-date">July 2026</span><span class="news-tag">[Publication]</span><span class="news-copy">“Quantum Computing for Smart Grid” is the cover story of the July 2026 issue of <em>Nature Reviews Electrical Engineering</em>. <a href="https://doi.org/10.1038/s44287-026-00295-6">Paper</a></span></li>
        <li><span class="news-date">May 2026</span><span class="news-tag">[Publication]</span><span class="news-copy">Our roadmap review “Quantum Computing for Smart Grid” was published in <em>Nature Reviews Electrical Engineering</em>. <a href="https://doi.org/10.1038/s44287-026-00295-6">Paper</a></span></li>
        <li><span class="news-date">March 2026</span><span class="news-tag">[Award]</span><span class="news-copy">Our physics-informed autonomous-agent research received the IAAI Deployed Application Award at AAAI 2026. <a href="https://doi.org/10.1609/aaai.v40i47.41441">Paper</a></span></li>
        <li><span class="news-date">October 2025</span><span class="news-tag">[Tutorial]</span><span class="news-copy">We presented the IEEE ECCE tutorial “Reimagine Power Electronics Design with Artificial Intelligence.” <a href="https://doi.org/10.5281/zenodo.17922626">Slides</a></span></li>
        <li><span class="news-date">March 2025</span><span class="news-tag">[Tutorial]</span><span class="news-copy">We delivered the IEEE APEC Professional Education Seminar “AI in Power Electronics Design: Present and Future.” <a href="https://doi.org/10.5281/zenodo.17922174">Slides</a></span></li>
        <li><span class="news-date">October 2024</span><span class="news-tag">[Publication]</span><span class="news-copy">“PE-GPT: A New Paradigm for Power Electronics Design” introduced a domain-specific generative-AI framework for power-electronics design. <a href="https://doi.org/10.1109/TIE.2024.3454408">Paper</a></span></li>
        <li><span class="news-date">March 2024</span><span class="news-tag">[Publication]</span><span class="news-copy">Our PANN paper established physics-in-architecture recurrent modeling for power converters. <a href="https://doi.org/10.1109/TIE.2024.3352119">Paper</a></span></li>
        <li><span class="news-date">July 2023</span><span class="news-tag">[Award]</span><span class="news-copy">I was the sole recipient of the NTU Graduate College Collaborative Research Award for the 2023–2024 academic year.</span></li>
        <li><span class="news-date">March 2023</span><span class="news-tag">[Award]</span><span class="news-copy">Our work on data-driven ZVS modeling received an APEC Outstanding Presentation Award. <a href="https://doi.org/10.1109/APEC43580.2023.10131519">Paper</a></span></li>
        <li><span class="news-date">September 2022</span><span class="news-tag">[Award]</span><span class="news-copy">“Automatic Triple Phase-Shift Modulation for DAB Converter With Minimized Power Loss” received an IEEE IAS Prize Paper Award, Second Prize. <a href="https://doi.org/10.1109/TIA.2021.3136501">Paper</a></span></li>
      </ol>
    </section>

    <section class="section" id="openings">
      <h2 class="rule-title">Openings</h2>
      <div class="opening"><h3>PhD students · Spring 2027–Spring 2028</h3><p>I am recruiting motivated PhD students to join my research group at Florida State University in AI for power electronics and semiconductor manufacturing.</p><a class="button button--primary" href="hiring.html">View position and application details</a></div>
    </section>

    <section class="section" id="contact">
      <h2 class="rule-title">Contact</h2>
      <div class="contact-columns">
        <ul class="contact-list">
          <li><span class="contact-label">Email</span><a href="mailto:xinzeli831@gmail.com">xinzeli831@gmail.com</a></li>
          <li><span class="contact-label">Location</span><span>Tallahassee, Florida, USA</span></li>
          <li><span class="contact-label">LinkedIn</span><a href="https://www.linkedin.com/in/xinze-li-8199561b0/">Profile</a></li>
        </ul>
        <ul class="contact-list">
          <li><span class="contact-label">GitHub</span><a href="https://github.com/XinzeLee">XinzeLee</a></li>
          <li><span class="contact-label">Scholar</span><a href="https://scholar.google.com/citations?user=YilrlZMAAAAJ">Google Scholar</a></li>
          <li><span class="contact-label">CV</span><a href="assets/CV.pdf">Download PDF</a></li>
        </ul>
      </div>
    </section>

    <section class="section page-notes" id="page-notes">
      <h2 class="rule-title">Page Notes</h2>
      <details class="page-note"><summary>AI-generated page note</summary><video controls playsinline preload="metadata"><source src="assets/intro.mp4" type="video/mp4">Your browser does not support video.</video></details>
      <details class="page-note"><summary>How the site was generated (legacy version)</summary><video controls playsinline preload="metadata"><source src="assets/website_gen.mp4" type="video/mp4">Your browser does not support video.</video></details>
    </section>`
});

const group = layout({
  title: "Group",
  description: "Research group information and PhD opportunities with Xinze Li at Florida State University.",
  active: "Group",
  content: `
    <header class="page-header"><p class="eyebrow">People</p><h1>Group</h1></header>
    <div class="placeholder">
      <h2>Group information coming soon</h2>
      <p class="muted">This page will introduce students, collaborators, and alumni as the group grows.</p>
      <a class="button button--primary" href="hiring.html">PhD openings · Spring 2027–Spring 2028</a>
    </div>`
});

function assetUrl(relativePath) {
  return relativePath.split("/").map(encodeURIComponent).join("/");
}

function paperItem(citation) {
  const match = citation.match(/^(.*?\bdoi:\s*)([^\s,]+)(.*)$/i);
  if (match) {
    const doi = match[2].replace(/\.$/, "");
    return `<li>${escapeHtml(match[1])}<a href="https://doi.org/${escapeHtml(doi)}">${escapeHtml(doi)}</a>${escapeHtml(match[3])}</li>`;
  }
  return `<li>${escapeHtml(citation)}</li>`;
}

function researchCarousel({ label = "", images = [], video = null, aspect = "landscape", title = "" }) {
  const slides = [
    ...images.map((src, index) =>
      `<figure class="research-carousel__slide${index === 0 ? " is-active" : ""}" data-carousel-slide${index === 0 ? "" : " hidden"}>
        <div class="research-carousel__media">
          <img src="${assetUrl(src)}" alt="${escapeHtml(title)}${label ? ` — ${escapeHtml(label)}` : ""} — slide ${index + 1}" loading="lazy" data-lightbox-trigger tabindex="0" role="button" aria-label="Enlarge figure">
        </div>
      </figure>`
    ),
    ...(video
      ? [`<figure class="research-carousel__slide${images.length === 0 ? " is-active" : ""}" data-carousel-slide${images.length === 0 ? "" : " hidden"}>
        <div class="research-carousel__media">
          <video controls playsinline preload="metadata" data-lightbox-src="${assetUrl(video)}"><source src="${assetUrl(video)}" type="video/mp4">Your browser does not support video.</video>
          <button class="research-carousel__enlarge" type="button" data-lightbox-trigger aria-label="Enlarge video">Enlarge</button>
        </div>
      </figure>`]
      : []),
  ];
  const total = slides.length;
  const aspectClass = aspect === "portrait" ? " research-carousel--portrait" : "";
  const labelBlock = label ? `<h4 class="research-carousel__label">${escapeHtml(label)}</h4>` : "";
  return `${labelBlock}
    <div class="research-carousel-block">
      <div class="research-carousel${aspectClass}" data-research-carousel${aspect === "portrait" ? ' data-aspect="portrait"' : ""}>
        <button class="research-carousel__nav research-carousel__nav--prev" type="button" data-carousel-prev aria-label="Previous slide">‹</button>
        <div class="research-carousel__frame">
          <div class="research-carousel__track">${slides.join("")}</div>
        </div>
        <button class="research-carousel__nav research-carousel__nav--next" type="button" data-carousel-next aria-label="Next slide">›</button>
      </div>
      <p class="research-carousel__status muted" data-carousel-status aria-live="polite">1 / ${total}</p>
    </div>`;
}

function researchHighlight({ title, images = [], groups = null, video = null, papers = [], aspect = "landscape" }) {
  const carousels = groups
    ? groups.map(group => researchCarousel({ ...group, aspect, title })).join("")
    : researchCarousel({ images, video, aspect, title });
  const papersBlock = papers.length
    ? `<div class="research-papers"><h4>Associated papers</h4><ul>${papers.map(paperItem).join("")}</ul></div>`
    : "";
  return `<details class="research-highlight" data-research-highlight>
    <summary class="research-highlight__summary">
      <span class="research-highlight__title">${escapeHtml(title)}</span>
      <span class="research-highlight__cue" data-expand-cue>Expand</span>
    </summary>
    <div class="research-highlight__body">
      ${carousels}
      ${papersBlock}
    </div>
  </details>`;
}

const researchHighlights = [
  researchHighlight({
    title: "One-stop AI-based solutions for the modulation design of dual-active-bridge converters, 2020~2023",
    images: [1, 2, 3, 4, 5, 6].map(n => `assets/research/DAB-Modulation/Slide${n}.PNG`),
    papers: [
      'X. Li, X. Zhang, F. Lin, C. Sun and K. Mao, "Artificial-Intelligence-Based Triple Phase Shift Modulation for Dual Active Bridge Converter With Minimized Current Stress," in IEEE Journal of Emerging and Selected Topics in Power Electronics, vol. 11, no. 4, pp. 4430-4441, Aug. 2023, doi: 10.1109/JESTPE.2021.3105522.',
      'F. Lin, X. Zhang, X. Li, C. Sun, W. Cai and Z. Zhang, "Automatic Triple Phase-Shift Modulation for DAB Converter With Minimized Power Loss," in IEEE Transactions on Industry Applications, vol. 58, no. 3, pp. 3840-3851, May-June 2022, doi: 10.1109/TIA.2021.3136501.',
      'F. Lin et al., "AI-Based Design With Data Trimming for Hybrid Phase Shift Modulation for Minimum-Current-Stress Dual Active Bridge Converter," in IEEE Journal of Emerging and Selected Topics in Power Electronics, vol. 12, no. 2, pp. 2268-2280, April 2024, doi: 10.1109/JESTPE.2022.3232534.',
      'X. Li, X. Zhang, F. Lin, C. Sun and K. Mao, "Artificial-Intelligence-Based Hybrid Extended Phase Shift Modulation for the Dual Active Bridge Converter With Full ZVS Range and Optimal Efficiency," in IEEE Journal of Emerging and Selected Topics in Power Electronics, vol. 11, no. 6, pp. 5569-5581, Dec. 2023, doi: 10.1109/JESTPE.2022.3185090.',
      'X. Li et al., "Data-Driven Modeling With Experimental Augmentation for the Modulation Strategy of the Dual-Active-Bridge Converter," in IEEE Transactions on Industrial Electronics, vol. 71, no. 3, pp. 2626-2637, March 2024, doi: 10.1109/TIE.2023.3265027.',
    ],
  }),
  researchHighlight({
    title: "Physics-in-architecture neural networks (PANN) for time-domain modeling of power converters, 2023~Now",
    images: [1, 2, 3, 4, 5, 6, 7].map(n => `assets/research/PANN/Slide${n}.PNG`),
    papers: [
      'X. Li et al., "Temporal Modeling for Power Converters With Physics-in-Architecture Recurrent Neural Network," in IEEE Trans. on Ind. Electron., vol. 71, no. 11, pp. 14111-14123, Nov. 2024.',
      'X. Li, F. Lin, X. Zhang, H. Ma and F. Blaabjerg, "Data-Light Physics-Informed Modeling for the Modulation Optimization of a Dual-Active-Bridge Converter," in IEEE Trans. on Power Electron., vol. 39, no. 7, pp. 8770-8785, July 2024.',
      'F. Lin, X. Li, X. Zhang and H. Ma, "STAR: One-Stop Optimization for Dual-Active-Bridge Converter With Robustness to Operational Diversity," in IEEE J. Emerg. Sel. Topics Power Electron., vol. 12, no. 3, pp. 2758-2773, June 2024.',
      'X. Li et al., "A Generic Modeling Approach for Dual-Active-Bridge Converter Family via Topology Transferrable Networks," in IEEE Transactions on Industrial Electronics, vol. 72, no. 2, pp. 1524-1536, Feb. 2025, doi: 10.1109/TIE.2024.3406858.',
      'X. Li, F. Lin, J. J. Rodríguez-Andina, J. M. Guerrero, H. A. Mantooth and H. Ma, "NeurPecs: Physics-Informed AI-Based Adaptive Circuit Simulator for Power Converters," in IEEE Transactions on Industrial Electronics, vol. 73, no. 1, pp. 494-506, Jan. 2026, doi: 10.1109/TIE.2025.3582591.',
    ],
  }),
  researchHighlight({
    title: "PE-GPT – the first AI agent in Power Electronics, 2023~Now",
    images: [1, 2, 3, 4].map(n => `assets/research/PE-GPT/Slide${n}.PNG`),
    video: "assets/pe-gpt.mp4",
    papers: [
      'F. Lin, X. Li, W. Lei, J. J. Rodriguez-Andina, J. M. Guerrero, C. Wen, X. Zhang and H. Ma, "PE-GPT: A New Paradigm for Power Electronics Design," in IEEE Transactions on Industrial Electronics, vol. 72, no. 4, pp. 3778-3791, 2024, doi: 10.1109/TIE.2024.3454408.',
    ],
  }),
  researchHighlight({
    title: "Quantum computing for smart grid – cover story of Nature Review Electrical Engineering, 2026",
    aspect: "portrait",
    images: [
      "assets/research/NREE/Fig0-1.jpg",
      "assets/research/NREE/Fig0-2.jpg",
      "assets/research/NREE/Fig1.jpg",
      "assets/research/NREE/Fig2.jpg",
      "assets/research/NREE/Fig3.jpg",
      "assets/research/NREE/Table2.jpg",
    ],
    papers: [
      'F. Lin, Z. Wang, C. Ren, X. Li, J. J. Rodríguez-Andina, S. Vazquez, H. A. Mantooth, M. Skoglund, T. van der Laan and M. Usman, "Quantum computing for smart grid," Nature Reviews Electrical Engineering, pp. 1-15, 2026, doi: 10.1038/s44287-026-00295-6.',
    ],
  }),
  researchHighlight({
    title: "Physics-informed machine learning for power semiconductor fabrication modeling and optimization – Ion implantation and annealing as examples, 2026~Now",
    groups: [
      {
        label: "Ion implantation",
        images: [
          "assets/research/power semiconductor/implantation/center_depth_profile.png",
          "assets/research/power semiconductor/implantation/pinn_error_map.png",
          "assets/research/power semiconductor/implantation/pinn_prediction_map.png",
        ],
      },
      {
        label: "Annealing",
        images: [
          "assets/research/power semiconductor/annealing/pinn_error_log10_map.png",
          "assets/research/power semiconductor/annealing/pinn_prediction_log10.png",
          "assets/research/power semiconductor/annealing/tcad_target_log10.png",
        ],
      },
    ],
  }),
  researchHighlight({
    title: "Fundamentals of AI for power electronics – a comprehensive guideline from practitioners, 2026",
    images: [0, 1, 2, 3, 4, 5, 6, 7].map(n => `assets/research/Fundamentals of AI for PE/Picture${n}.png`),
    papers: [
      'X. Li et al., "Fundamentals of Artificial Intelligence for Power Electronics," IEEE Transactions on Industrial Electronics, 2026.',
    ],
  }),
].join("");

const research = layout({
  title: "Selected Research",
  description: "Selected research projects and awards in AI, power electronics, and semiconductor technologies.",
  active: "Selected Research",
  content: `
    <header class="page-header"><p class="eyebrow">Defining the future</p><h1>Selected Research</h1><p class="lead">Research at the intersection of physical systems, trustworthy AI, and engineering automation.</p></header>
    <section><h2 class="rule-title">Research Directions</h2><div class="stack-list">
      <article class="card card--accent"><h3>AI for power electronics</h3><p>Simulation and modeling, maintenance and reliability, and intelligent process automation across the converter lifecycle.</p></article>
      <article class="card card--purple"><h3>AI for semiconductor manufacturing</h3><p>Digital twins, virtual metrology, and process optimization for semiconductor fabrication and qualification.</p></article>
      <article class="card card--warm"><h3>Core AI themes</h3><p>Physical AI, explainable AI, and agentic AI grounded in engineering knowledge and real systems.</p></article>
      <article class="card"><h3>Research vision</h3><p>From AI-aided workflows toward adaptive, autonomous, and eventually self-sustained engineering systems.</p></article>
    </div></section>
    <section><h2 class="rule-title">Research Highlights</h2><div class="research-highlights">${researchHighlights}</div></section>
    <section><h2 class="rule-title">Awards</h2><div class="card"><ul class="award-list">
      <li>Outstanding Mentor Award, University of Arkansas (2026)</li>
      <li>IAAI Deployed Application Award, AAAI (2026)</li>
      <li>Geneva International Exhibition of Inventions — Silver Award</li>
      <li>ESI Highly Cited Paper — AI-based triple-phase-shift modulation</li>
      <li>IEEE Industry Applications Society Prize Paper Award — Second Prize</li>
      <li>NTU Graduate College Collaborative Research Award (2023–2024)</li>
      <li>IEEE APEC Outstanding Presentation Award (2023)</li>
    </ul></div></section>`
});

const teaching = layout({
  title: "Teaching",
  description: "Courses, mentoring, REU supervision, and open educational initiatives by Xinze Li.",
  active: "Teaching",
  content: `
    <header class="page-header"><p class="eyebrow">Learning by building</p><h1>Teaching</h1></header>
    <section><h2 class="rule-title">Courses</h2><article class="card card--accent"><h3>Fundamentals of AI for Power Electronics Design</h3><p class="muted">University of Arkansas · Graduate course · 3 credits · 40 hours</p><p>Topics include metaheuristic optimization, machine learning, generative-AI engineering, reinforcement learning for control, and project-based implementation.</p>
      <div class="section-media">
        <figure class="media-card"><img src="assets/teaching_grad.jpg" alt="Teaching Fundamentals of AI for Power Electronics Design"><figcaption>Fundamentals of AI for Power Electronics Design</figcaption></figure>
        <div class="media-card"><video controls playsinline preload="metadata"><source src="assets/grad_course_outcome.mp4" type="video/mp4">Your browser does not support video.</video><div class="media-card__caption">Graduate-course outcome: Fundamentals of AI for Power Electronics Design</div></div>
      </div>
    </article></section>
    <section><h2 class="rule-title">Graduate Students</h2>
      <div class="teaching-split">
        <dl class="mentee-list">
          <div class="mentee"><dt>David Setor Agogo-Mawuli · 2024–Present</dt><dd>AI-based reliability analysis and layout optimization for SiC power modules.</dd></div>
          <div class="mentee"><dt>Anna Corbitt · 2025–Present</dt><dd>Energy-efficient remaining-useful-life prediction for traction inverters.</dd></div>
        </dl>
        <div class="section-media"><figure class="media-card"><img src="assets/teaching_awards_2026.jpg" alt="Outstanding Mentor Award with David Setor Agogo-Mawuli"><figcaption>Outstanding Mentor Award (2026) - David Setor Agogo-Mawuli</figcaption></figure></div>
      </div>
    </section>
    <section><h2 class="rule-title">REU Students</h2>
      <div class="teaching-split">
        <p>Supervised four NSF Research Experiences for Undergraduates students in AI for power-electronics design; student work led to a technical paper at IEEE DMC 2025.</p>
        <div class="section-media"><figure class="media-card"><img src="assets/teaching_reu.jpg" alt="Mentoring REU students"><figcaption>Mentoring REU students</figcaption></figure></div>
      </div>
    </section>
    <section><h2 class="rule-title">Initiatives &amp; Service</h2><div class="stack-list">
      <article class="card card--purple"><h3>IEEE PELSTube</h3><p>Peer-reviewed educational videos introducing AI-driven power-electronics design.</p><p><a href="https://doi.org/10.17024/pelstube.2026.003">Introduction to AI in Power Electronics</a><br><a href="https://doi.org/10.17024/pelstube.2026.004">Core Concepts of AI in Power Electronics Design</a></p></article>
      <article class="card card--warm"><h3>Fundamentals of AI for PE</h3><p>Open notebooks, datasets, and guided examples that connect an IEEE TIE review article with hands-on learning.</p><a href="https://github.com/XinzeLee/Fundamentals_of_AI_for_PE">Open the learning repository</a></article>
    </div></section>`
});

function citationMarkup(item) {
  const issue = [
    item.publication,
    item.volume && `vol. ${item.volume}`,
    item.number && `no. ${item.number}`,
    item.pages && `pp. ${item.pages}`,
    item.publisher && !item.publication.includes(item.publisher) && item.publisher,
    item.year,
  ].filter(Boolean).join(", ");
  return `<article class="citation" data-citation data-category="${item.category}">
    <div class="citation__title">${escapeHtml(item.title)}</div>
    <div>${escapeHtml(item.authors)}</div>
    <div class="citation__meta">${escapeHtml(issue)}</div>
  </article>`;
}

const categoryLabels = {
  journal: "Journal Articles",
  conference: "Conference Papers",
  book: "Books & Book Chapters",
  other: "Other Scholarly Works",
};
const publicationSections = Object.entries(categoryLabels).map(([category, label]) => {
  const records = publications.filter(item => item.category === category);
  return `<section class="publication-section" data-publication-section data-category="${category}">
    <h2 class="rule-title">${label} <span class="pub-count">(<span data-visible-count>${records.length}</span>)</span></h2>
    <div>${records.map(citationMarkup).join("")}</div>
  </section>`;
}).join("");

const pubs = layout({
  title: "Publications",
  description: "Complete journal, conference, book, thesis, preprint, and presentation record for Xinze Li.",
  active: "Publications",
  content: `
    <header class="page-header"><p class="eyebrow">Research record</p><h1>Publications</h1><p class="lead">Full list organized from the supplied citation export.</p><div class="button-row"><a class="button" href="https://scholar.google.com/citations?user=YilrlZMAAAAJ">Google Scholar</a><a class="button" href="assets/CV.pdf">CV (PDF)</a></div></header>
    <div class="stats-grid">
      <div class="stat"><strong data-scholar-citations>964</strong>Citations</div>
      <div class="stat"><strong data-scholar-hindex>16</strong>h-index</div>
      <div class="stat"><strong data-scholar-i10>21</strong>i10-index</div>
      <div class="stat"><strong>${publications.length}</strong>Works<br><small data-scholar-updated>CSV export</small></div>
    </div>
    <div class="pub-tools" aria-label="Publication filters"><input class="pub-search" type="search" placeholder="Search titles, authors, or venues" data-publication-search aria-label="Search publications"><div class="filter-group">
      <button class="filter-button" type="button" data-publication-filter="all" aria-pressed="true">All</button>
      <button class="filter-button" type="button" data-publication-filter="journal" aria-pressed="false">Journals</button>
      <button class="filter-button" type="button" data-publication-filter="conference" aria-pressed="false">Conferences</button>
      <button class="filter-button" type="button" data-publication-filter="book" aria-pressed="false">Books</button>
      <button class="filter-button" type="button" data-publication-filter="other" aria-pressed="false">Other</button>
    </div></div>
    ${publicationSections}
    <p class="empty-state" data-publication-empty hidden>No publications match this search.</p>
    <noscript><p class="card">All publications are shown above. Enable JavaScript only if you want search and category filters.</p></noscript>`
});

const service = layout({
  title: "Academic Services",
  description: "Tutorials, conference leadership, editorial service, and peer review by Xinze Li.",
  active: "Academic Services",
  content: `
    <header class="page-header"><p class="eyebrow">Professional community</p><h1>Academic Services</h1></header>
    <section><h2 class="rule-title">Invited Tutorials, Talks &amp; Chairs</h2><div class="card"><ul class="service-list">
      <li>IEEE DMC 2025 — Organizer, AI Challenge in Power Electronics Design</li>
      <li>IEEE WiPDA 2025 — Tutorial, AI in Power Electronics Design: Present and Future</li>
      <li>IEEE ECCE 2025 — Three-hour tutorial and technical-session chair</li>
      <li>IEEE APEC 2025 — Professional Education Seminar and session chair</li>
      <li>IEEE ECCE 2024 — Special session on next-generation AI for power electronics</li>
      <li>International Conference on Electrical Power Systems and Intelligent Control 2024 — Workshop talk on advanced DC–DC converter modeling and control</li>
    </ul></div></section>
    <section><h2 class="rule-title">Editorial Service</h2><div class="card-grid"><article class="card card--accent"><h3>Guest Editor</h3><p>Frontiers in Electronics: Advanced Control and Life Cycle Management for DC–DC Converters.</p></article><article class="card card--purple"><h3>Guest Editor</h3><p>MDPI Mathematics: Physics-Informed AI and Deep Learning Algorithms for Smart Grid.</p></article></div></section>
    <section><h2 class="rule-title">Peer Review</h2><div class="card"><p>Completed 90+ reviews across IEEE Transactions on Industrial Electronics, IEEE Transactions on Power Electronics, IEEE JESTPE, IEEE OJ-PEL, Nature Scientific Reports, and other journals and conferences.</p></div></section>`
});

const opensource = layout({
  title: "Open-source Projects",
  description: "Open-source software, educational resources, and tutorial presentations by Xinze Li.",
  active: "Open-source Projects",
  content: `
    <header class="page-header"><p class="eyebrow">Code and learning resources</p><h1>Open-source Projects</h1><p class="lead">Research software and educational materials for AI, power electronics, and computer vision.</p></header>
    <section><h2 class="rule-title">Projects</h2><div class="stack-list">
      <article class="card card--accent"><h3><a class="project-link" href="https://github.com/XinzeLee/PolygonObjectDetection">Polygon Object Detection</a></h3><p>A YOLOv5-derived framework for polygon prediction boxes in perspective-sensitive object detection.</p></article>
      <article class="card"><h3><a class="project-link" href="https://github.com/XinzeLee/Python_In_3Days">Python Learning Tutorials</a></h3><p>Notebook-based tutorials designed to help new learners acquire practical Python fundamentals quickly.</p></article>
      <article class="card card--purple"><h3><a class="project-link" href="https://github.com/XinzeLee/PANN">PANN</a></h3><p>Physics-in-architecture neural networks for explainable, data-light, and transferable power-converter modeling.</p><p><strong>Associated paper:</strong> “Temporal Modeling for Power Converters With Physics-in-Architecture Recurrent Neural Network.” <a href="https://doi.org/10.1109/TIE.2024.3352119">DOI</a></p></article>
      <article class="card card--warm"><h3><a class="project-link" href="https://github.com/XinzeLee/PE-GPT">PE-GPT</a></h3><p>A domain-specific generative-AI framework for power-electronics design, simulation, optimization, and verification.</p><p><strong>Associated paper:</strong> “PE-GPT: A New Paradigm for Power Electronics Design.” <a href="https://doi.org/10.1109/TIE.2024.3454408">DOI</a></p></article>
      <article class="card card--accent"><h3><a class="project-link" href="https://github.com/XinzeLee/ECCE2025">ECCE2025 Tutorials</a></h3><p>Code and tutorial materials accompanying the ECCE 2025 AI-for-power-electronics tutorial.</p><p><strong>Associated paper:</strong> “Automatic Triple Phase-Shift Modulation for DAB Converter With Minimized Power Loss.” <a href="https://doi.org/10.1109/TIA.2021.3136501">DOI</a></p></article>
      <article class="card card--purple"><h3><a class="project-link" href="https://github.com/XinzeLee/Fundamentals_of_AI_for_PE">Fundamentals of AI for PE</a></h3><p>Open notebooks, datasets, and a What–Which–How learning pathway for AI in power electronics.</p><p><strong>Associated paper:</strong> “Fundamentals of Artificial Intelligence for Power Electronics,” IEEE TIE (2026).</p></article>
    </div></section>
    <section><h2 class="rule-title">Tutorial Presentations</h2><div class="stack-list">
      <article class="card"><h3>IEEE ECCE Special Session 2024</h3><p>“Next Generation of AI for Power Electronics: Explainable, Light, and Flexible.”</p><a href="https://doi.org/10.5281/zenodo.14036281">Slides and DOI</a></article>
      <article class="card"><h3>IEEE APEC 2025 Professional Education Seminar</h3><p>“AI in Power Electronics Design: Present and Future.”</p><a href="https://doi.org/10.5281/zenodo.17922174">Slides and DOI</a></article>
      <article class="card"><h3>IEEE ECCE 2025 Tutorial</h3><p>“Reimagine Power Electronics Design with Artificial Intelligence (AI).”</p><a href="https://doi.org/10.5281/zenodo.17922626">Slides and DOI</a></article>
    </div></section>`
});

const output = new Map([
  ["index.html", home],
  ["group.html", group],
  ["research.html", research],
  ["teaching.html", teaching],
  ["publications.html", pubs],
  ["service.html", service],
  ["opensource.html", opensource],
]);

for (const [filename, html] of output) {
  fs.writeFileSync(path.join(root, filename), html, "utf8");
  console.log(`Wrote ${filename}`);
}

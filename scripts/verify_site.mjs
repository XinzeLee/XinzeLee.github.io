import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mainPages = [
  "index.html",
  "group.html",
  "research.html",
  "teaching.html",
  "publications.html",
  "service.html",
  "opensource.html",
];
const allPages = [...mainPages, "hiring.html", "postdoc.html"];
const errors = [];

for (const file of allPages) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1].split("#")[0].split("?")[0];
    if (!url || /^(https?:|mailto:|data:)/.test(url)) continue;
    const decoded = decodeURIComponent(url);
    const target = path.resolve(root, path.dirname(file), decoded);
    if (!fs.existsSync(target)) errors.push(`${file}: missing ${decoded}`);
  }
}

for (const file of mainPages) {
  const html = fs.readFileSync(path.join(root, file), "utf8");
  const activeLinks = (html.match(/aria-current="page"/g) || []).length;
  if (activeLinks !== 1) errors.push(`${file}: expected one active navigation link`);
  for (const tag of ["html", "head", "body", "main", "aside"]) {
    const opens = (html.match(new RegExp(`<${tag}(?:\\s|>)`, "g")) || []).length;
    const closes = (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
    if (opens !== closes) errors.push(`${file}: unbalanced ${tag} tags`);
  }
}

const publicFiles = [
  ...mainPages,
  "README.md",
  "assets/site.js",
].map(file => [file, fs.readFileSync(path.join(root, file), "utf8")]);
for (const [file, text] of publicFiles) {
  if (/href="postdoc\.html"/i.test(text)) {
    errors.push(`${file}: active postdoc link found`);
  }
  if (/Built for GitHub Pages|©\s*(?:<[^>]+>)*\s*Xinze Li/i.test(text)) {
    errors.push(`${file}: retired footer text found`);
  }
}

const home = fs.readFileSync(path.join(root, "index.html"), "utf8");
const homeOrder = ["id=\"about\"", "id=\"news\"", "id=\"openings\"", "id=\"contact\"", "id=\"page-notes\""];
const homePositions = homeOrder.map(marker => home.indexOf(marker));
if (homePositions.some(position => position < 0) ||
    homePositions.some((position, index) => index > 0 && position < homePositions[index - 1])) {
  errors.push("Homepage sections are missing or out of order");
}
if (home.includes("news-category") || !home.includes("[Appointment]") || !home.includes("[Award]")) {
  errors.push("Homepage news is not the expected flat tagged feed");
}
for (const media of ["assets/intro.mp4", "assets/website_gen.mp4"]) {
  if (!home.includes(media)) errors.push(`Homepage is missing ${media}`);
}

const teaching = fs.readFileSync(path.join(root, "teaching.html"), "utf8");
for (const content of [
  "David Setor Agogo-Mawuli",
  "Outstanding Mentor Award (2026) - David Setor Agogo-Mawuli",
  "Anna Corbitt",
  "assets/teaching_awards_2026.jpg",
  "assets/teaching_grad.jpg",
  "assets/teaching_reu.jpg",
  "assets/grad_course_outcome.mp4",
]) {
  if (!teaching.includes(content)) errors.push(`Teaching page is missing ${content}`);
}
if (!teaching.includes("class=\"teaching-split\"") ||
    !teaching.includes("class=\"section-media\"")) {
  errors.push("Teaching page is missing balanced media layout hooks");
}
if (!home.includes("class=\"contact-columns\"") || !home.includes("class=\"news-copy\"")) {
  errors.push("Homepage is missing balanced contact or news layout hooks");
}

const recruitment = [
  fs.readFileSync(path.join(root, "hiring.html"), "utf8"),
  fs.readFileSync(path.join(root, "postdoc.html"), "utf8"),
].join("\n");
const legacyScript = fs.readFileSync(path.join(root, "assets", "script.js"), "utf8");
if (recruitment.includes("themeBtn") || legacyScript.includes("localStorage.getItem(\"theme\")")) {
  errors.push("Retired theme switching is still present");
}

const publications = JSON.parse(
  fs.readFileSync(path.join(root, "assets", "publications.json"), "utf8").replace(/^\uFEFF/, "")
);
const keys = publications.map(item =>
  [item.title.toLowerCase(), item.publication.toLowerCase(), item.year, item.pages.replace(/\s/g, "")].join("|")
);
if (keys.length !== new Set(keys).size) errors.push("Duplicate publication records found");
const categoryCounts = Object.fromEntries(
  ["journal", "conference", "book", "other"].map(category => [
    category,
    publications.filter(item => item.category === category).length,
  ])
);
if (Object.values(categoryCounts).some(count => count === 0)) {
  errors.push("One or more publication categories is empty");
}
const magazineAsJournal = publications.some(
  item => /magazine/i.test(item.publication) && item.category === "journal"
);
if (magazineAsJournal) {
  errors.push("Magazine publications must be classified as other, not journal");
}
if (teaching.includes("Hui Cao")) {
  errors.push("Teaching page still lists Hui Cao");
}

const research = fs.readFileSync(path.join(root, "research.html"), "utf8");
const recruitmentCss = fs.readFileSync(path.join(root, "assets", "recruitment.css"), "utf8");
if (!/color:\s*#fff/.test(recruitmentCss) || !recruitmentCss.includes(".hiring-mailto")) {
  errors.push("Hiring apply email is missing forced white text styles");
}
for (const title of [
  "One-stop AI-based solutions for the modulation design of dual-active-bridge converters, 2020~2023",
  "Physics-in-architecture neural networks (PANN) for time-domain modeling of power converters, 2023~Now",
  "PE-GPT – the first AI agent in Power Electronics, 2023~Now",
  "Quantum computing for smart grid – cover story of Nature Review Electrical Engineering, 2026",
  "Physics-informed machine learning for power semiconductor fabrication modeling and optimization – Ion implantation and annealing as examples, 2026~Now",
  "Fundamentals of AI for power electronics – a comprehensive guideline from practitioners, 2026",
]) {
  if (!research.includes(title)) errors.push(`Research page is missing highlight: ${title}`);
}
for (const marker of [
  "assets/research/DAB-Modulation/Slide1.PNG",
  "assets/research/PANN/Slide1.PNG",
  "assets/research/PE-GPT/Slide1.PNG",
  "assets/research/NREE/Fig0-1.jpg",
  "assets/research/power%20semiconductor/implantation/",
  "assets/research/Fundamentals%20of%20AI%20for%20PE/Picture0.png",
  "assets/pe-gpt.mp4",
  "type=\"video/mp4\"",
  "data-aspect=\"portrait\"",
  "research-carousel--portrait",
  "Ion implantation",
  "Annealing",
  "data-expand-cue",
  "data-lightbox-trigger",
  "10.1109/JESTPE.2021.3105522",
  "10.1109/TIE.2024.3406858",
  "10.1109/TIE.2024.3454408",
  "10.1038/s44287-026-00295-6",
  "data-research-highlight",
  "data-research-carousel",
]) {
  if (!research.includes(marker)) errors.push(`Research page is missing expected marker: ${marker}`);
}
if (research.includes("private-user-images.githubusercontent.com") ||
    research.includes("Machine-learning-optimized power electronics") ||
    research.includes("Wireless power transfer") ||
    research.includes("Closed-loop one-stop")) {
  errors.push("Research page still contains retired highlight content or JWT video URL");
}
const powerSemiBlock = research.split("power semiconductor")[1] || "";
if (/Associated papers/i.test(powerSemiBlock.split("Fundamentals of AI for power electronics")[0] || "")) {
  errors.push("Power Semiconductor highlight should not include an Associated papers block");
}
const siteJs = fs.readFileSync(path.join(root, "assets", "site.js"), "utf8");
if (!siteJs.includes("research-lightbox") || !siteJs.includes("closeLightbox")) {
  errors.push("site.js is missing research lightbox behavior");
}
const redesignCss = fs.readFileSync(path.join(root, "assets", "redesign.css"), "utf8");
if (!redesignCss.includes("research-highlight__cue") ||
    !redesignCss.includes("aspect-ratio: 3 / 4") ||
    !redesignCss.includes("research-lightbox")) {
  errors.push("redesign.css is missing highlight polish styles");
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`Validated ${allPages.length} pages and ${publications.length} publications.`);
console.log(categoryCounts);

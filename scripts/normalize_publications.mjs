import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2] || path.join(root, "data", "citations.csv");
const output = process.argv[3] || path.join(root, "assets", "publications.json");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        field += '"';
        i += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = false;
        continue;
      }
      field += char;
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\r") continue;
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }
    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function clean(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function classify(publication, publisher) {
  const venue = publication.toLowerCase();
  const publisherLower = publisher.toLowerCase();
  const conferenceMarkers = [
    "conference",
    "congress",
    "exposition",
    "symposium",
    "proceedings",
    "iecon",
    "apec",
    "ecce",
    "ipemc",
    "peas",
    "pedg",
    "cieec",
  ];
  if (conferenceMarkers.some((marker) => venue.includes(marker))) return "conference";
  if (
    publisherLower.includes("springer") ||
    venue.includes("automated design of electrical converters")
  ) {
    return "book";
  }
  if (
    !publication ||
    venue.includes("arxiv") ||
    venue.includes("zenodo") ||
    venue.includes("magazine") ||
    publisherLower.includes("nanyang technological university")
  ) {
    return "other";
  }
  return "journal";
}

const rows = parseCsv(fs.readFileSync(source, "utf8").replace(/^\uFEFF/, ""));
const headers = rows[0].map((header) => clean(header).toLowerCase());
const seen = new Set();
const records = [];

for (const values of rows.slice(1)) {
  if (!values.length || values.every((value) => !clean(value))) continue;
  const record = Object.fromEntries(headers.map((header, index) => [header, clean(values[index])]));
  const key = [
    record.title.toLowerCase(),
    record.publication.toLowerCase(),
    record.year,
    (record.pages || "").replace(/\s/g, ""),
  ].join("|");
  if (seen.has(key)) continue;
  seen.add(key);
  record.category = classify(record.publication, record.publisher || "");
  records.push(record);
}

records.sort(
  (a, b) =>
    a.category.localeCompare(b.category) ||
    Number(b.year || 0) - Number(a.year || 0) ||
    a.title.localeCompare(b.title)
);

fs.writeFileSync(output, `${JSON.stringify(records, null, 2)}\n`);
const counts = Object.fromEntries(
  ["journal", "conference", "book", "other"].map((category) => [
    category,
    records.filter((item) => item.category === category).length,
  ])
);
console.log(`Wrote ${records.length} records to ${output}`);
console.log(counts);

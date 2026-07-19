"""Normalize a Google Scholar CSV export for the static publications page."""

from __future__ import annotations

import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "data" / "citations.csv"
DEFAULT_OUTPUT = ROOT / "assets" / "publications.json"


def clean(value: str | None) -> str:
    return " ".join((value or "").strip().split())


def classify(publication: str, publisher: str, title: str) -> str:
    venue = publication.lower()
    publisher_lower = publisher.lower()
    conference_markers = (
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
    )
    if any(marker in venue for marker in conference_markers):
        return "conference"
    if "springer" in publisher_lower or "automated design of electrical converters" in venue:
        return "book"
    if (
        not publication
        or "arxiv" in venue
        or "zenodo" in venue
        or "magazine" in venue
        or "nanyang technological university" in publisher_lower
    ):
        return "other"
    return "journal"


def normalize(source: Path) -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    seen: set[tuple[str, str, str, str]] = set()

    with source.open(encoding="utf-8-sig", newline="") as handle:
        for row in csv.DictReader(handle):
            record = {key.lower(): clean(value) for key, value in row.items()}
            key = (
                record["title"].casefold(),
                record["publication"].casefold(),
                record["year"],
                record["pages"].replace(" ", ""),
            )
            if key in seen:
                continue
            seen.add(key)
            record["category"] = classify(
                record["publication"], record["publisher"], record["title"]
            )
            records.append(record)

    records.sort(
        key=lambda item: (
            item["category"],
            -int(item["year"] or 0),
            item["title"].casefold(),
        )
    )
    return records


def main() -> None:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    output = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUTPUT
    records = normalize(source)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(records, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    counts = {
        category: sum(item["category"] == category for item in records)
        for category in ("journal", "conference", "book", "other")
    }
    print(f"Wrote {len(records)} records to {output}")
    print(counts)


if __name__ == "__main__":
    main()

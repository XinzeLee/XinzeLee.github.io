#!/usr/bin/env python3
"""Fetch Google Scholar profile and write scholar_stats.json. Used by GitHub Actions."""
import json
import re
import urllib.request
from datetime import datetime
from pathlib import Path

SCHOLAR_USER = "YilrlZMAAAAJ"
URL = f"https://scholar.google.com/citations?user={SCHOLAR_USER}&hl=en"
OUTPUT = Path(__file__).resolve().parent.parent / "scholar_stats.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0"
)


def main():
    req = urllib.request.Request(URL, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as r:
        html = r.read().decode("utf-8", errors="replace")

    # Table cells with stats: gsc_rsb_std (order: Cited by, h-index, i10-index)
    nums = re.findall(r'gsc_rsb_std[^>]*>(\d+)', html)
    if len(nums) < 3:
        # Fallback: any digit sequence in stats area
        nums = re.findall(r'"gsc_rsb_std">(\d+)', html)
    if len(nums) < 3:
        print("Could not parse 3 stats from HTML")
        return

    citations = int(nums[0])
    h_index = int(nums[1])
    i10_index = int(nums[2])
    updated = datetime.utcnow().strftime("%b %d, %Y")

    data = {
        "citations": citations,
        "h_index": h_index,
        "i10_index": i10_index,
        "updated": updated,
    }

    prev = {}
    if OUTPUT.exists():
        try:
            prev = json.loads(OUTPUT.read_text(encoding="utf-8"))
        except Exception:
            pass

    if prev.get("citations") == citations and prev.get("h_index") == h_index and prev.get("i10_index") == i10_index:
        print("updated=false")
        return

    OUTPUT.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("updated=true")


if __name__ == "__main__":
    main()

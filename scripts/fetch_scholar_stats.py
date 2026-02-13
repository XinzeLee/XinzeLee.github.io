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
    try:
        req = urllib.request.Request(URL, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"Fetch failed: {e}", file=__import__("sys").stderr)
        print("updated=false")
        return

    # Parse by row label so we get "All" stats, not "Since 2019"
    def find_stat(label_pattern, text):
        m = re.search(label_pattern + r'.*?gsc_rsb_std[^>]*>(\d+)', text, re.DOTALL | re.IGNORECASE)
        return int(m.group(1)) if m else None

    citations = find_stat(r'Cited by|Citations', html)
    h_index = find_stat(r'h-index', html)
    i10_index = find_stat(r'i10-index', html)

    if citations is None or h_index is None or i10_index is None:
        # Fallback: first table block
        table_start = html.find('id="gsc_rsb_st"')
        block = html[table_start : table_start + 2000] if table_start >= 0 else html
        nums = re.findall(r'gsc_rsb_std[^>]*>(\d+)', block)
        if len(nums) >= 3:
            citations = int(nums[0])
            h_index = int(nums[1])
            i10_index = int(nums[2])
    if citations is None or h_index is None or i10_index is None:
        print("Could not parse 3 stats from HTML")
        return
    updated = datetime.utcnow().strftime("%b %d, %Y")

    data = {
        "citations": citations,
        "h_index": h_index,
        "i10_index": i10_index,
        "updated": updated,
    }

    # Always write when we have valid data (refresh "updated" timestamp); report so workflow can push
    OUTPUT.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("updated=true")


if __name__ == "__main__":
    main()

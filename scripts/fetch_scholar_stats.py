#!/usr/bin/env python3
"""Fetch Google Scholar profile and write scholar_stats.json. Used by GitHub Actions."""
import json
import re
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

SCHOLAR_USER = "YilrlZMAAAAJ"
SCHOLAR_URL = f"https://scholar.google.com/citations?user={SCHOLAR_USER}&hl=en"
OUTPUT = Path(__file__).resolve().parent.parent / "scholar_stats.json"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0"
)

# Proxies fetch the page from their server (avoids GitHub IP being blocked by Google)
# Each is (url, None) for raw HTML or (url, 'contents') to read JSON and use key 'contents'
PROXIES = [
    (f"https://api.allorigins.win/raw?url={urllib.parse.quote(SCHOLAR_URL)}", None),
    (f"https://api.allorigins.win/get?url={urllib.parse.quote(SCHOLAR_URL)}", "contents"),  # returns {"contents": "..."}
    (f"https://corsproxy.io/?{urllib.parse.quote(SCHOLAR_URL)}", None),
    (f"https://corsproxy.io/?{urllib.parse.quote(SCHOLAR_URL, safe='')}", None),
    (f"https://proxy.corsfix.com/?url={urllib.parse.quote(SCHOLAR_URL)}", None),
]


def fetch_html():
    # Try direct first (works when run locally)
    try:
        req = urllib.request.Request(SCHOLAR_URL, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception:
        pass
    # Then try via proxies (for GitHub Actions where Google blocks datacenter IPs)
    for proxy_url, json_key in PROXIES:
        try:
            req = urllib.request.Request(proxy_url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(req, timeout=25) as r:
                body = r.read().decode("utf-8", errors="replace")
            if json_key:
                data = json.loads(body)
                body = data.get(json_key) or data.get("contents", "")
            if body and "gsc_rsb_st" in body:
                return body
            if body and ("Cited by" in body or "h-index" in body):
                return body
        except Exception as e:
            print(f"Proxy failed: {e}", file=__import__("sys").stderr)
            continue
    return None


def main():
    html = fetch_html()
    if not html:
        print("Fetch failed: direct and proxy requests failed", file=__import__("sys").stderr)
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
        print("Could not parse 3 stats from HTML", file=__import__("sys").stderr)
        print("updated=false")
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

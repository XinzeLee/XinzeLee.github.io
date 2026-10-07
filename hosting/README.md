# Visit counter (Cloudflare Worker + D1)

The counter runs on Cloudflare, not on GitHub Pages. Its code lives in
`hosting/cloudflare-counter/` on your machine and is gitignored (as is the retired
InfinityFree `counter.php`, which cannot work: its JavaScript cookie challenge is
refused inside a cross-site iframe by Chrome, Edge and Safari).

## Endpoints

- `POST /hit` — one page view, sent by `assets/counter.js` from every page.
  Only requests whose `Origin` is in `ALLOWED_ORIGINS` and that do not look like bots are counted.
- `GET /stats` — totals, daily, province and per-page aggregates. Requires
  `Authorization: Bearer <COUNTER_API_KEY>`.
- `GET /profile.svg?theme=dark` — live visit badge for the GitHub profile README. A countable image fetch adds one profile visit. The drawn number is stored profile visits plus a base of 22, truncated to one decimal with a `k` or `M` suffix from 1,000 upward.
- `GET /profile/stats` — profile visit total, daily counts, and province aggregates. Requires `Authorization: Bearer <COUNTER_API_KEY>`. These rows are separate from the website tables.
- `GET /ping` — health check.

Location is province level, taken from Cloudflare's own `request.cf` data. Raw IPs are
never stored; a visitor is a salted SHA-256 of IP + user agent. Each page counts separately. A repeat of the same page by that visitor within 30 minutes counts as one visit. A unique visitor is counted again only after 12 hours.

## One-time deploy

Run these in `hosting/cloudflare-counter/` (a free Cloudflare account is enough):

1. `npx wrangler login`
2. `npx wrangler d1 create xinzelee-counter`, then paste the printed `database_id` into `wrangler.toml`.
3. `npx wrangler d1 execute xinzelee-counter --remote --file=schema.sql`
4. `npx wrangler secret put COUNTER_API_KEY` (same value as the GitHub secret `COUNTER_API_KEY`)
5. `npx wrangler secret put HASH_SALT` (any long random string; keep it fixed)
6. `npx wrangler deploy`, which prints `https://xinzelee-counter.<your-subdomain>.workers.dev`.
7. Put that URL in `COUNTER_URL` in `assets/counter.js` and push. The weekly workflow reads the
   same constant, so there is nothing else to configure.

## Local testing

`.dev.vars` holds local-only values (`ALLOWED_ORIGINS=http://localhost:8765`, a test key and salt).
`npx wrangler d1 execute xinzelee-counter --local --file=schema.sql` then `npx wrangler dev --local --port 8787`.

## Repo integration

- Beacon: `assets/counter.js` (included by every page, including `hiring.html` and `postdoc.html`)
- Weekly sync: `.github/workflows/update-visit-stats.yml` writes `data/visit_stats.json`, then
  `scripts/geocode_visits.mjs` writes `data/geo_cache.json` and `data/site_stats.json`
- Profile badge: `GET /profile.svg` on the same worker. The XinzeLee/XinzeLee README shows that image to the right of Stars. Its weekly workflow saves `data/profile_visits.json` on Mondays at 12:00 UTC and needs the same `COUNTER_API_KEY` repository secret. No GitHub personal access token is required.

<div align="center">

### Now recruiting PhD students

**AI for power electronics & semiconductor manufacturing** — Spring 2027–Spring 2028 · FAMU-FSU / CAPS

[![PhD hiring page](https://img.shields.io/badge/PhD%20%2F%20hiring-%E2%86%92%20details-7c5cff?style=for-the-badge&labelColor=1a1f35)](https://xinzelee.github.io/hiring.html)

<br />

---

<br />

## Dr. Xinze Li

*From AI-aided to AI-native power electronics life cycle management*

<br />

[![Visit the site](https://img.shields.io/badge/Enter%20the%20site-%E2%86%92%20xinzelee.github.io-0b1020?style=for-the-badge&labelColor=1a1f35)](https://xinzelee.github.io/)

<sub>Academic CV · publications · projects · teaching · contact</sub>

<br />

---

</div>

### Welcome

You’ve found the **source** for my personal site — the polished, browsable version lives on GitHub Pages, not inside this `README`. Click the button above (or **[xinzelee.github.io](https://xinzelee.github.io/)**) to jump straight in: that’s where the story, papers, and updates actually live.

This repository is the static site GitHub serves from the `main` branch.

<br />

### Behind the scenes: the “GitHub agent”

Every night, a small automation wakes up on GitHub’s side and does the busywork for me:

| | |
| :--- | :--- |
| **What** | A [GitHub Actions](https://docs.github.com/en/actions) workflow ([`update-scholar-stats.yml`](.github/workflows/update-scholar-stats.yml)) |
| **Does** | Runs [`scripts/fetch_scholar_stats.py`](scripts/fetch_scholar_stats.py), pulls metrics from [Google Scholar](https://scholar.google.com/), writes [`scholar_stats.json`](scholar_stats.json) when something changed |
| **Why** | Citation counts on the site stay current without me copy-pasting numbers |
| **Who** | Commits appear as **github-actions[bot]** — the “agent” is really that bot plus the schedule |

You can also fire it yourself: **Actions** → *Update Google Scholar stats* → **Run workflow**.

<br />

<div align="center">

*Thanks for stopping by — see you on the site.*

</div>

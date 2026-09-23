# Get Lucky Sim

**Hole-in-One Simulator Software by Get Lucky Golf.** The world's best par-3s on any golf simulator. Play free, or back yourself with one insured swing to win up to **$100,000**.

This repo is the home of the new simulator product. Right now it holds the business case and research. Code comes once the architecture is signed off.

## Documents

| Document | Source | PDF |
|---|---|---|
| Business feasibility one-pager | [`docs/feasibility-onepager.md`](docs/feasibility-onepager.md) | [PDF](docs/Get-Lucky-Sim-Feasibility-Onepager.pdf) |
| Deep research report: market, tech, integrity, legal, insurance, economics, build plan | [`docs/research-report.md`](docs/research-report.md) | [PDF](docs/Get-Lucky-Sim-Research-Report.pdf) |
| Roadmap | [`docs/ROADMAP.md`](docs/ROADMAP.md) | |

`docs/web/` holds standalone web versions of both documents, with light and dark themes.

## The idea in one paragraph

Get Lucky Sim is a lightweight Unity app plus a cloud platform, and it plugs into the golfer's launch monitor. It hosts a rotating Collection of famous-inspired par-3s. Free play runs everywhere. Paid, insured shots are adjudicated on our own servers with our own physics. They are verified with cameras, a witness and ID checks, and they launch first at certified venues in South Africa and in the US states where paid skill contests are allowed. It reuses the claims, evidence and risk engine already running in [getluckyapp](https://github.com/getluckyjo/getluckyapp). It extends the gym-bay channel in [simulatorstrategy](https://github.com/getluckyjo/simulatorstrategy).

## Building the documents

The Markdown is the source of truth. After any edit, rebuild:

```bash
npm install
npm run docs
```

`scripts/build-docs.mjs` renders each document to a branded A4 PDF and a standalone web page using Playwright's Chromium. The one-pager build **fails if the content runs past one A4 page**.

Markdown extras:
- a ```` ```stats ```` fence renders one tile per line (`value | label`);
- a `> **Label** text` blockquote renders a callout;
- front matter sets the title, kicker, verdict and layout.

## Brand

The documents use the Get Lucky **V2 app look** from `getluckyapp/src/app/globals.css`:
- forest green `#345231`;
- lime accent `#d6fb4b`;
- gold `#c9a94e` for prize figures on green only;
- Poster Gothic headings, Inter body text, Space Mono numerals.

Tokens are in [`brand/tokens.css`](brand/tokens.css). The font and logos are in `brand/`.

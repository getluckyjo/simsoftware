# Get Lucky Sim

**Hole-in-One Simulator Software by Get Lucky Golf.** The world's best par-3s on any golf simulator. Play free, or back yourself with one insured swing to win up to **$100,000**.

This repo is the home of the new simulator product. Right now it holds the business case and research. Code comes once the architecture is signed off.

## Documents

| Document | Source | PDF |
|---|---|---|
| Business feasibility one-pager | [`docs/feasibility-onepager.md`](docs/feasibility-onepager.md) | [PDF](docs/Get-Lucky-Sim-Feasibility-Onepager.pdf) |
| Deep research report: market, tech, integrity, legal, insurance, economics, build plan | [`docs/research-report.md`](docs/research-report.md) | [PDF](docs/Get-Lucky-Sim-Research-Report.pdf) |
| Roadmap | [`docs/ROADMAP.md`](docs/ROADMAP.md) | |
| **Core strategy: the deal sequence** (Golfzon → gyms → RMB → Icons → Santam → Ernie at Fancourt), with meeting briefs | [`docs/deal-strategy.md`](docs/deal-strategy.md) | [PDF](docs/Get-Lucky-Deal-Sequence.pdf) |

`docs/web/` holds standalone web versions of both documents, with light and dark themes.

## The idea in one paragraph

**The base case is Golfzon.** Get Lucky is proposing 272 Golfzon bays for Virgin Active (200) and Planet Fitness (72) in South Africa, RMB-financed and phased from 2027 to 2029. We use that programme to get **Get Lucky mode** built into Golfzon's commercial software:
- Golfzon renders the Collection of par-3s and sends signed shot events to our cloud.
- Get Lucky runs the wallet, identity checks, insurance, claims and payouts, reusing the engine in [getluckyapp](https://github.com/getluckyjo/getluckyapp).
- The gym bays prove the product.
- Golfzon then takes it to its ~13,000 locations worldwide. Paid, insured shots run where legal; free play and sponsor prizes run everywhere else.

A lightweight Unity adjudicator follows later for other hardware (TrackMan, Uneekor) and is the fallback if the Golfzon terms don't land. The channel plan and bay economics live in [simulatorstrategy](https://github.com/getluckyjo/simulatorstrategy).

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

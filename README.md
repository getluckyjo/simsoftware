# simsoftware

Get Lucky's simulator integration: the insured hole-in-one challenge played on a GOLFZON bay, with the simulator as the verifier.

- **The design and the research behind it:** [`docs/golfzon-integration.md`](docs/golfzon-integration.md). It covers how a GOLFZON bay decides an ace, the integration we are asking GOLFZON for, the insurance question, and what changes in `getluckyjo/getluckyapp`.
- **The demo for the GOLFZON meeting:** this repo. It is a Next.js app, and everything below is about it.

## The demo in one line

There are three panes on one screen:
- **Left:** a simulated GOLFZON bay.
- **Middle:** every message between GOLFZON and Get Lucky.
- **Right:** the Get Lucky app.

The golfer pays on the phone, GOLFZON arms the bay, the golfer swings, and GOLFZON sends a signed record of the shot. Get Lucky verifies the record and settles the entry. A miss goes on the leaderboard. An ace opens a claim. Prices are in US dollars.

## What is real and what is simulated

| Real | Simulated |
|---|---|
| The v0.1 contract (`src/lib/protocol.ts`) | GOLFZON's side. It runs in the browser and signs with a demo key we made (`src/lib/golfzon-mock.ts`) |
| Ed25519 signing and verification | The shot and its physics (`src/lib/shot.ts`) |
| The endpoint GOLFZON would call, `POST /api/v0/golfzon/events`, which checks signatures with Node's crypto | The bay graphics (`src/lib/render.ts`). They are an illustration, not GOLFZON software, and the screen says so |
| The receiver's rules: signature, freshness, shape, settings lock, one shot per entry, duplicate events | Payments: sandbox copy, and nothing is charged |
| The claim file's re-verification in the browser, and the evidence pack with its SHA-256 | The Nasmo video and the leaderboard players |

**Verification is real.** Each event is signed in the browser with `@noble/ed25519`, POSTed to the real endpoint, and checked there with Node's OpenSSL, so two independent implementations agree on every record.

**If the venue's wifi drops, the demo carries on.** Once the page has loaded, the same checks run in the browser, and the wire says so under each message.

## Running the demo in the room

Open the site full screen on a laptop; 1440 × 900 or larger shows all three panes. Below 1180 px wide, the panes become tabs.

1. **The bay is waiting.** It shows the challenge and a check-in QR code. On the phone, tap **Scan a bay**, then **Continue**.
2. **Back yourself.** Pick **$5**, then **Pay $5** and **Confirm**. The wire shows three messages:
   - the charge;
   - `POST /v0/entries` asking GOLFZON to arm Bay 2;
   - GOLFZON's signed `challenge.armed`, with every check Get Lucky ran on it: signature, freshness, contract, and the bay's settings against the challenge.
3. **Swing.** Press the **Swing** button on the bay, or the space bar. The ball flies, lands and rolls. GOLFZON then sends `challenge.shot`, and the bet moves `active → miss (actor: machine)`. The phone shows the distance and the leaderboard. Nothing is filmed or declared.
4. **The ace, on cue.** Press **A**, then swing.
   - The claim opens itself.
   - Get Lucky fetches the swing video by shot id and asks the venue staff to confirm.
   - On the phone, tap **See your claim**, then **Open the claim file**. This is what the reviewer and the insurer see. Both records are re-verified in the browser against GOLFZON's public key, and the evidence pack downloads with its SHA-256.
5. **Try to break it.** Press **P** for the presenter panel:
   - **Forge an ace.** This edits the last miss into a hole-in-one and replays it with GOLFZON's real signature. The result is a 401, and nothing changes.
   - **GOLFZON retries the last webhook.** The same event arrives again, re-signed. The result is a 200 and "already recorded".
   - **Venue lowers the difficulty.** The next entry's bay reports Pro with the near-cup assist on. Get Lucky refuses the entry and refunds it. This is the 2022 Korean case, where a venue quietly lowered players' difficulty.
6. **For their engineers: `/spec`.** It is the contract as a page, with signed examples. The `curl` example works against the live endpoint for five minutes after the page loads, and changing one character makes it fail.

**Keys:**
- **Space:** swing
- **A**, **C**, **N:** next shot is an ace, a close miss, or natural
- **P:** presenter panel
- **Shift+R:** reset
- **Esc:** close the claim file

In the presenter panel, the golfer's name can be set so a guest sees their own name on the phone and the leaderboard.

## Run it

```bash
npm ci
npm run dev          # http://localhost:3000
```

Checks (CI runs the same):

```bash
npm run typecheck
npm test             # the contract, forgery, settings lock, ledger and shot model
npm run build
```

## Deploy

On Vercel:
1. Import `getluckyjo/simsoftware`. The framework is Next.js, and no environment variables are needed.
2. Add a domain the way the pitch sites have theirs.

Every response carries `X-Robots-Tag: noindex`.

`.npmrc` sets `legacy-peer-deps`: npm 10's resolver crashes on Next 16's optional peers without it.

## Where things are

```
src/lib/protocol.ts        the v0.1 contract: shapes, signature header, checkEvent()
src/lib/ledger.ts          what needs memory: duplicate events, one shot per entry
src/lib/golfzon-mock.ts    GOLFZON's side for the demo: arm the bay, report the shot, sign
src/lib/keys.ts            GOLFZON's published keys (the demo key's public half)
src/lib/challenge.ts       this week's hole, its locked settings, the bay, the $ tiers
src/lib/shot.ts            the shot model (launch data from where the ball lands)
src/lib/render.ts          the bay screen: tee camera, green camera, ball flight
src/app/api/v0/…           the endpoint GOLFZON would call, the JWKS, the challenge
src/app/spec/page.tsx      the contract as a page, with live signed examples
src/components/useDemo.ts  the flow between the three panes
__tests__/                 vitest
```

When GOLFZON says yes, this code moves into `getluckyjo/getluckyapp` as described in section 9 of the design doc:
- `protocol.ts` and `ledger.ts` become the feed route and a migration;
- the phone screens become the simulator play flow;
- the demo key is replaced by GOLFZON's JWKS URL.

---
layout: report
title: Hole-in-One Simulator Software
webTitle: Get Lucky Sim Research
short: Deep research report
kicker: Get Lucky Golf · Deep research
subtitle: Everything we need to know to build it, with the Golfzon order for Virgin Active and Planet Fitness as the base case for going global inside Golfzon's software.
verdictLabel: Feasible. Build it with Golfzon.
date: 23 September 2026
metaRows: Prepared for=Johannes Le Roux & build team;Date=23 September 2026;Status=Research v2 (Golfzon base case);Repo=getluckyjo/simsoftware
---

## Executive summary

**The idea.** Get Lucky Sim is software that runs on any golf simulator. It hosts a rotating collection of the world's most exciting par-3s. Anyone can play them free. Players can also back themselves with a paid, insured shot, and a hole-in-one wins up to **$100,000**. This takes the on-course Get Lucky model, already live in South Africa and insured by Santam through Indwe, to the fastest-growing part of golf.

**Verdict.** Feasible and worth building, but only in stages and only with discipline on one thing: **shot integrity**. The market is large and growing, and **9M+ Americans** already play on simulators. Paid shots on simulators are proven: Full Swing's Skill Strike paid out $400K in its first month. Insurance for simulator holes-in-one exists. But nobody owns **"one swing at a famous hole for life-changing money, on any simulator"**. Three facts shape how it has to be built:

1. **Simulator data can be faked.** The industry-standard GSPro Open Connect feed is unauthenticated JSON on a local port. A 20-line script can send a perfect ace. Paid shots therefore need our own server-side physics, fixed cameras, a witness and partner data feeds. They start at **certified venue bays**, not home sims.
2. **Simulator aces happen more often than real ones.** Golfzon's own data works out to about **1 in 7,000** par-3 shots, against about 1 in 12,500 for an amateur on a real course. Korea's per-game screen-golf insurance ran claims **16× higher** than on-course cover and loses money. Prizes must scale with distance, and paid attempts must be capped.
3. **Money on a single shot is a legal grey zone.** US precedent (Florida AGO 90-58; *Las Vegas Hacienda v. Gibson*) treats an insured hole-in-one contest as a prize contract, not a bet. But single-shot odds mean some markets will treat it as gambling. Free play goes global. Paid shots open market by market, starting with **South Africa and the US "dominant-factor" states**.

**The base case: Golfzon.** Get Lucky is proposing **272 Golfzon bays** for Virgin Active (200 bays, 130 clubs) and Planet Fitness (72 bays, 42 clubs) in South Africa. They are financed by RMB and phased from 2027 to 2029. That programme is our way into Golfzon's software:
- **Get Lucky mode goes inside Golfzon.** The holes, the prize ladder and the insured shot run inside Golfzon's own software, not in a separate app.
- **The gym bays prove it.** They are the live reference, with about **95 paid shots per bay per month** at maturity in the existing bay model.
- **Then it goes global.** Golfzon takes it to its **~13,000 locations in 40+ countries**. Paid play runs where it's legal, free play everywhere else.

Golfzon's closed platform works in our favour here. Its bays are installed by Golfzon, it logs members in, it records swing video (NASMO), and Golfzon holds a decade of ace data, including 143,020 aces in 2022. That covers the three hardest problems: shot integrity, insurer pricing and distribution.

**The recommendation.**
- Put the software integration on the table **in the same negotiation as the hardware order**. The full deal sequence (Golfzon, gyms, RMB, Icons, Santam and Ernie Els) is in the companion **Deal Sequence** document.
- Build the Get Lucky cloud platform: wallet, KYC, insurance, claims and payouts. Golfzon builds "Get Lucky mode" in its client.
- Go live on the first Virgin Active and Planet Fitness bays in 2027.
- Roll out to Golfzon's US venues in 2028, and to its global network from 2029.
- Add a lightweight Unity adjudicator later for other hardware (TrackMan, Uneekor), so we are never dependent on one partner.
- The first-year build is estimated at **$0.8–1.2M** with an eight-person, South Africa-led team. It reuses the claims, evidence and risk engine Get Lucky already runs in production.

```stats
**9M+** | US simulator players in 2025; half are not on-course golfers
**1 in 7,000** | Golfzon par-3 ace rate (2022), easier than the real world
**~30%** | Blended margin per paid shot after premium, venue and Golfzon shares (base case)
**~13,000** | Golfzon locations to roll out to
**272 bays** | Golfzon gym order, VA + PF, 2027–29
```

> **Next** Three things unlock everything else, and all three can run in parallel over the next 90 days:
> 1. A **Golfzon term sheet** that covers software integration and ace data, not just hardware.
> 2. A **Santam/Indwe term sheet** for simulator aces.
> 3. A **South African legal opinion**.

## The market

### How big it is
Analysts put the global golf-simulator market at **$2.0–2.9B in 2025**. Most estimates cluster at $2.0–2.2B, growing **7.4–9.8% a year** to $2.9–4.7B by 2030–34:
- Grand View: $2.1B
- Mordor: $1.97B
- Global Market Insights: $2.1B
- Straits: $2.08B
- M2 Square: $2.9B

Commercial venues account for about half, and home simulators are the fastest-growing segment at about 11.6% a year.

> **Read this carefully** These reports count **hardware and installation**, not what people spend on play. Korean screen golf alone is described as a ~$1.6B market. Treat "$2B" as the equipment market. The money we compete for is play spend: bay fees of about $55 a session in the US, plus about $40 on food and drink.

### Who plays

**United States**
- **9M+ Americans** played on a simulator in 2025, up from 3.8M in 2015 (NGF).
- **51% of them are not on-course golfers.** For Get Lucky that is the key point: half the audience is new to golf and plays for fun and competition.
- About **1,500 commercial simulator businesses** run 3–4 bays each, roughly 4,500–6,000 bays. That is before hotels, bars and gyms.
- 6.5% of US golf facilities have simulators today, and NGF expects 10–11% within two years.

**Korea**
- 8,700–9,700 screen-golf venues. Golfzon logged about 94M rounds in 2024, **nearly twice the country's outdoor rounds**.

**Golfzon worldwide**
- About 13,000 locations in 40+ countries, 6M+ members and 100M+ rounds in 2025.

**Rest of the world** (R&A, excluding the US and Mexico)
- 112M golfers, and **68M play off-course**, including ranges and simulators.

**UK and South Africa**
- UK simulator market about $118–194M, heading for about £235M by 2030.
- South Africa about $11M, doubling by 2033. It is small but it is our home market, and the simulator-channel plan targets 200+ gym bays.

```stats
**9M+** | US simulator players, 2025
**51%** | of US sim players are not on-course golfers
**~13,000** | Golfzon locations in 40+ countries
**100M+** | Golfzon rounds played in 2025
**68M** | off-course golfers outside the US (R&A)
```

### Hardware: fragmented, and that shapes the product
Around ten launch-monitor makers split the market, from the $600 Garmin R10 to $25K TrackMan and $90K Golfzon TwoVision bays.

| Maker | Typical price | Our access |
|---|---|---|
| TrackMan 4 / iO | $14–30K + ~$1,100/yr software | Closed, partner only |
| Golfzon TwoVision / Vision | $21K (home) – $90K (commercial) | Closed, partner only |
| Full Swing Pro / KIT | $45–70K / $4,999 | Partner (owns Skill Strike) |
| Foresight GCQuad / GC3 / Falcon; Bushnell LP | $2.5–18.5K | Partner programme |
| Uneekor EYE XO2 / Mini | $4.5–11K | Launcher allow-list |
| FlightScope Mevo+, Square Golf, ProTee | $0.7–2.2K | Open Connect, day one |
| Garmin R10 / R50, Rapsodo MLM2PRO, SkyTrak+ | $0.6–5K | Community bridges or partner |

No credible count of home simulators exists anywhere. We'll build our own count from free-play installs.

## Competitive landscape

### Paid shots on simulators already exist, so the concept is proven
| Offer | Model | Prize | Verification |
|---|---|---|---|
| **Full Swing Skill Strike** (Nov 2025) | $3–20 per swing, target size set by an AI handicap; 44 US states; 200+ venues | Up to 8× stake; **$750 for an ace** on a $3 swing. $400K paid out and 20 aces in month one | One player logged in, every swing stored, AI flags sudden changes in performance |
| **PinSeeker** | Cash closest-to-pin on Full Swing, E6, FSX | Claims $24K paid weekly | Not disclosed |
| **Five Iron Tournaments** (May 2026) | Real-money tournament network, ~50 TrackMan venues | $20K guaranteed closest-to-pin pool | In-venue TrackMan |
| **TrackMan NEXT Golf Tour** | $130 qualifiers, online | $100K+ purses; closest-to-pin $1,250 | Phone video + TrackMan data + rules committee |
| **Golfzon G-Membership ace pool** (Korea) | Paid membership | ₩30M shared between aces | Pro difficulty, no mulligans, NASMO swing video |
| **Korean per-game ace insurance** | ₩1,000–2,410 a game | ₩200–300K | Checked against the simulator record |
| **Venue specials** (Condor, 100 Kellogg Lane) | $10–20 for 8–10 shots | $5–10K | Staff witness, data and video review |

### Where the gap is
Nobody offers an **insured, big-prize hole-in-one** ($10K–$100K) that runs **across hardware brands**, sits under a **consumer brand** and has a **catalogue of famous holes**. The field divides into three camps:
- **Hardware makers** lock their games to their own devices. Skill Strike is Full Swing only.
- **Venue chains** run their own events.
- **Korean products** pay small prizes.

Skill Strike proves venues and players will pay per swing, and that 44 US states can host a skill game. It also shows the risk: **20 aces in under a month**.

> **Positioning** Skill Strike is a skill *wager* that pays small multiples. Get Lucky Sim is the **big moment**: one swing at a famous hole for life-changing money, insured and verified like the on-course product. It is on any hardware we can trust and free to play everywhere.

### Distribution partners
| Chain | Size | Hardware |
|---|---|---|
| Topgolf Swing Suite | 220 locations | Full Swing |
| X-Golf | 138 locations, 38 states | Own |
| Back Nine | 100+ | Full Swing (already runs Skill Strike) |
| Five Iron Golf | ~50 locations, 500+ bays, 7 countries | TrackMan |
| Golfzon (US) | ~160 sites, growing 90%+ a year | Golfzon |
| **Gyms (Virgin Active, Planet Fitness SA)** | **272 bays proposed by Get Lucky, 2027–29: the base case** | **Golfzon** |

## The Golfzon base case

### The bays are the way in
Get Lucky's simulator strategy puts Golfzon bays into two South African gym chains. Planet Fitness meets on 2 October. Virgin Active is in discussion through its product team. Get Lucky buys, installs and runs the bays under 10-year concessions, and asset finance pays for 90% of them.

| Chain | Bays | Clubs | Phasing (bays) | Hardware at list |
|---|---:|---:|---|---:|
| Virgin Active | 200 | 130 | 2027: 40 Signature; 2028: 100 Play; 2029: 20 Play + 40 Practice | ~$8M |
| Planet Fitness | 72 | 42 | 2027: 20 Signature; 2028: 40 Play; 2029: 6 Play + 6 Practice | ~$3M |
| **Total** | **272** | **172** | | **~$11M** |

Once signed, that makes Get Lucky a **chain customer** for Golfzon, with a three-phase order that is not a dealer sale. It also gives Golfzon its first gym-chain reference outside Korea and the US. The outreach to Sean Pyun (CEO, Golfzon America, and Head of Global Business) already offers "the insured shot on every bay: a prize product Golfzon can take to its other operators". This report makes that offer the product.

### What each side brings

**Get Lucky**
- **The order:** 272 bays, financed, in two gym chains.
- **The product:** the insured hole-in-one, live since 2025 on real South African courses with Santam and Indwe.
- **The back office:** wallet, payments, identity checks, claims, payouts, insurance and legal. These are the parts Golfzon doesn't run outside Korea.
- **The content:** the Collection, plus Get Lucky's 30 partner courses scanned into Golfzon's library.
- **The brand and the audience:** "Back yourself on any par-3."

**Golfzon**
- **"Get Lucky mode"** inside its commercial software (TwoVision, Vision, GDR). The mode:
  - locks the tee to the tier's distance;
  - enforces the settings, using the same rules as its own hole-in-one challenge (Pro difficulty, no mulligans);
  - shows the prize ladder.
- **Signed events** from Golfzon's cloud to ours: shot armed, launch data, result and the NASMO swing video.
- **Ace-rate history** by hole, distance and handicap, shared with our insurer under NDA, so the premium is priced on real data from day one.
- **Distribution:** Golfzon offers the mode to its operators worldwide.

### Why Golfzon solves the hard problems
- **Integrity.** Commercial Golfzon bays are installed and serviced by Golfzon, and players log in as members. The system records swing video, and venues can't edit its settings the way home software can be edited. A shot result that arrives as a signed event from Golfzon's cloud is far harder to fake than local open JSON.
- **Pricing.** Golfzon recorded **143,020 aces in 2022**, about 1 in 7,000 par-3 shots. No insurer has a better dataset for simulator aces.
- **Precedent.** In Korea, Golfzon already runs hole-in-one prize pools (checked against its own records plus NASMO video), and insurers sell per-game ace cover verified against the simulator's records. The model works at scale. Get Lucky adds big insured prizes and markets outside Korea.
- **Scale.** About 13,000 locations, 6M+ members, 100M+ rounds a year, and a US business growing 90%+ a year.

### Three stages
| Stage | When | Where | Mode |
|---|---|---|---|
| **1. Gym bays (SA)** | 2027–29 | 272 bays at Virgin Active and Planet Fitness | Paid ZAR ladder + free play. The live reference. |
| **2. Golfzon US and UK venues** | 2028–29 | Golfzon US (930 stores in Golfzon's FY2025 reporting) and Golfzon Social; UK/Europe after legal opinions | Paid USD/GBP ladder in permitted states and markets |
| **3. Golfzon global** | 2029+ | Golfzon's ~13,000 locations in 40+ countries | Paid where permitted; **free play with sponsor prizes** in Korea, Japan and other restricted markets |

### What the gym bays produce (from the existing bay model, base case)
The Virgin Active and Planet Fitness models already assume an insured shot:
- R50 a swing for a R25,000 prize;
- taken 0.625 times per booked hour;
- 24% of the entry paid as premium.

That gives:

| Year | Bays | Paid shots | Shots per bay per month | Insured-shot revenue (R50) | Expected aces (1 in 8,000) |
|---|---:|---:|---:|---:|---:|
| 2027 | 60 | 22,300 | 31 | R1.1m | ~3 |
| 2028 | 200 | 107,700 | 45 | R5.4m | ~13 |
| 2029 | 272 | 230,700 | 71 | R11.5m | ~29 |
| 2030 | 272 | 297,400 | 91 | R14.9m | ~37 |
| 2031 | 272 | 312,500 | **96** | R15.6m | ~39 |

This is deliberately conservative: every shot is priced at the lowest tier. A mix across the full ZAR ladder (R50 to R1,000) roughly doubles the revenue. The bigger value of stage 1 is **proof**:
- the real ace rates;
- the fraud controls;
- the insurer's loss ratio;
- a live Golfzon reference that other operators can visit.

### Terms to negotiate with Golfzon
1. **Scope.** Golfzon builds and maintains Get Lucky mode and the signed event feed. Get Lucky builds the cloud platform and runs the prize programme.
2. **Revenue share.** A platform share for Golfzon on paid shots. We **assume 15%** for planning. This is the main commercial lever, and it can be traded against the hardware price.
3. **Exclusivity.** Get Lucky is Golfzon's exclusive insured-prize partner in agreed markets. Golfzon is the hardware standard for Get Lucky-operated bays.
4. **Data.** Golfzon shares historic and live ace data with Get Lucky's insurer. Get Lucky shares claims outcomes back.
5. **Content.** The Collection and Get Lucky's partner courses go into Golfzon's library, co-branded.
6. **Timing.** Get Lucky mode is live on the first Signature bays when they open in 2027.

> **If Golfzon says no** The gym bays still run Golfzon for bay hire, and Get Lucky falls back to the any-simulator plan: its own Unity adjudicator on TrackMan or Uneekor bays. Keep that path alive, since it is also the route onto non-Golfzon hardware later.

## The product

### What the player sees
1. **Choose Get Lucky mode** in the Golfzon menu, or scan the QR code on the bay screen, which links the bay to the player's Get Lucky account and wallet.
2. **Pick a hole** from the Collection: signature par-3s from around the world, each with a story, a real yardage and a prize ladder.
3. **Play free.** Unlimited shots, closest-to-the-pin leaderboards, daily challenges and badges. No account is needed for a first swing.
4. **Back yourself.** Choose a paid tier. The tee locks at that tier's distance. The cameras arm, a shot code appears on screen, and the player gets one swing.
5. **Result.** A miss shows proximity and the leaderboard. An ace fires the celebration, freezes the evidence and starts the claim. The winner is verified and paid out within the published window, as with the on-course product.

### The Collection
The launch set has 8–12 par-3s, each "inspired by" a famous hole until it has been licensed (see *Course content & licensing*). The candidates cover the holes golfers already dream about:
- an island green in the style of Sawgrass 17;
- a Postage Stamp-style wedge;
- a cliff-top ocean carry in the style of Pebble Beach 7;
- a Fancourt Links hole;
- a Glendower 14th. The simulator strategy's pitch assets already include one.

Holes are delivered in Golfzon's course format. Golfzon already scans real courses for its library, for example through its Pebble Beach and Arcis Golf partnerships.

Seasonal holes and sponsor-named holes rotate through the Collection.

### Prize ladder (recommended)
The prize grows with the multiple and the distance. The longer tee protects the economics, and the gated top tier keeps the **"up to $100K"** headline honest. The multiples mirror the South African on-course ladder, which runs from 500× (R50 for R25,000) to 1,000× (R1,000 for R1,000,000).

| Tier | Entry | Prize | Multiple | Tee distance | Gate |
|---|---:|---:|---:|---|---|
| Starter | $5 | $2,500 | 500× | 150–165 yds | Age and location check |
| Classic | $10 | $5,000 | 500× | 160–175 yds | Age and location check |
| Pro | $25 | $15,000 | 600× | 170–185 yds | Account verified |
| Major | $50 | $35,000 | 700× | 180–195 yds | Full KYC, certified venue |
| **Legend** | **$100** | **$100,000** | 1,000× | 195–210 yds | Full KYC, handicap on file, 3 attempts a day, live witness |

Local-currency ladders follow the same multiples. A ZAR ladder for South African venues can reuse today's app tiers directly.

### Free-to-play is the engine, not a side dish
Free play serves three purposes:
- It is top-of-funnel for paid shots.
- It gives sponsors inventory: named holes, branded tee boxes, prizes.
- Most importantly, it is **the actuarial dataset**. Every free shot on our own physics tells the insurer, and us, what the real ace rate is for each hole, distance and handicap. That is how premiums come down over time.

## Simulator integration

### How shot data flows today
Almost every modern simulator setup speaks one de facto standard: **GSPro Open Connect v1**.
- The launch monitor's software opens a TCP socket to `127.0.0.1:921` and sends JSON.
- **BallData** carries speed, spin axis, total spin, and horizontal and vertical launch angles.
- **ClubData** is optional.
- The spec states plainly that the socket *"does not require authentication"* ([GSPro](https://gsprogolf.com/GSProConnectV1.html)).
- Open-source bridges translate most monitors into this format.

That makes free play easy to support broadly. For paid play, it is untrusted by design.

### Launch-monitor support matrix

| Launch monitor | Route to our app | Free play | Paid play |
|---|---|---|---|
| FlightScope Mevo+ / Gen2 | Official Open Connect output | ✅ Day one | Home tier with video |
| Square Golf | Official Open Connect connector | ✅ Day one | Home tier with video |
| ProTee VX / Full Swing KIT | Official partner integrations | ✅ Day one | Partner deal |
| Garmin R10 | Community bridge (emulates E6) | ✅ Community | ❌ Not trusted |
| Rapsodo MLM2PRO | Official via GSPro; community Bluetooth | ✅ Community | ❌ Until partnered |
| SkyTrak / SkyTrak+ | Community bridge (OpenSkyPlus) | ✅ Community | ❌ Until partnered |
| Uneekor EYE XO / QED / MINI | Uneekor Launcher allow-list | Partner deal | ⭐ Priority partner |
| Foresight GC3 / GCQuad / Bushnell | FSX partner programme (open API closed Oct 2023) | Partner deal | ⭐ Priority partner |
| TrackMan 4 / iO | Closed ecosystem; terms forbid replacement software | Partner deal | ⭐ Premium partner |
| Golfzon (commercial) | Closed platform | ❌ | Strategic deal only |

> **Golfzon first** Golfzon's commercial platform is closed to outside software. That is why the integration has to be part of the hardware negotiation: Golfzon builds Get Lucky mode, and Get Lucky runs the platform behind it. The open-hardware routes in this table are for free play and for stage 3 expansion onto other brands.

### Build, plug in, or partner?

| Option | What it is | Verdict |
|---|---|---|
| **A. Full simulator** | Compete with GSPro and E6: courses, putting, a full round | **No.** 12–24 months of work, a crowded market, and golfers won't switch simulator for a par-3 |
| **C. Host inside a partner** | Get Lucky mode runs inside **Golfzon**. Get Lucky's cloud handles money, identity, insurance and claims | **Yes. The core product.** It rides the 272-bay order, Golfzon's integrity and data, and its 13,000 locations |
| **B. Adjudicator app** | Lightweight Unity app: one tee, one green, our own versioned physics, with the outcome decided on our server | **Yes, second.** For non-Golfzon hardware (TrackMan, Uneekor, Foresight) and as the fallback if Golfzon terms don't land |

**Engine.** Use Unity. GSPro's whole course pipeline (OPCD, Blender and Unity) and its designer community are Unity-native. Unity scrapped its runtime fee in 2024. Unreal's 5% royalty above $1M could apply to entry revenue.

**Physics.** Inside Golfzon, Golfzon's physics decide the shot. Our server re-checks each paid result against the launch data, and the insurer audits Golfzon's settings and ace history. For the adjudicator (option B), implement the published Penner and Nathan ball-flight models (drag, Magnus lift, spin decay), then bounce, roll and cup capture. Holmes found a ball drops only below about 1.3 m/s at the cup. The ace is decided by bounce, roll, flagstick and cup, so that code must be deterministic, versioned and published to the insurer. Use libgolf (GPL) for validation only. MIT-licensed references such as openfairway can be used freely.

## Architecture

Get Lucky already runs a production claims pipeline for on-course aces. It has:
- an append-only claim state machine;
- SHA-256-sealed video evidence;
- email-confirmed witnesses;
- eleven risk rules;
- an admin review checklist;
- evidence packs for the underwriter.

**Get Lucky Sim reuses those concepts and that team knowledge.** It does not start again.

### Components
0. **Golfzon integration (primary).**
   - Get Lucky mode inside Golfzon's client, built by Golfzon to our spec.
   - A signed server-to-server event feed from Golfzon's cloud: attempt armed, launch data, result, NASMO video reference.
   - A bay link by QR, so the Golfzon member account maps to the Get Lucky wallet.
   - The spec and the API contract are Get Lucky's first engineering deliverable.
1. **Sim client (Windows, Unity; stage 3, non-Golfzon hardware).**
   - Renders the hole and listens for launch-monitor data: an Open Connect listener on a configurable port, plus partner SDK adapters.
   - Runs a local watchdog that looks for injector processes and loopback traffic.
   - Holds a TPM-backed device key.
   - Streams the bay cameras.
2. **Player web app and PWA.**
   - Handles account, wallet, KYC, history, leaderboards and claims.
   - The natural home is the existing Next.js + Supabase stack from `getluckyapp`.
   - Payments go through web checkout, so there are no app-store in-app purchase issues.
3. **Shot adjudication service.**
   - Stateless and deterministic, with physics versioned by git SHA.
   - Arms each attempt with a one-time nonce and a hidden per-attempt seed (micro-wind, firmness).
   - Computes the outcome server-side and writes every input, seed and output to an immutable log.
4. **Ledger.**
   - Double-entry in Postgres with append-only journal tables.
   - Keeps entry fees, premium accruals and prize liabilities separate.
5. **Evidence store.** Direct-to-object-storage upload with write-once locking (S3 Object Lock or equivalent) and SHA-256 manifest chains. The pattern is already proven in `getluckyapp`.
6. **Claims workflow.**
   - Ace → evidence freeze → KYC re-check → human review → insurer notification → payout.
   - It extends the `active → claimed → verified → paid` states the on-course app already uses.
7. **Venue console.** Bay registration, camera health, staff witness sign-off, revenue share reporting and event mode.
8. **Live proctoring (Legend tier).** A WebRTC stream (LiveKit or Amazon IVS) to a remote reviewer who watches the shot live.

### Suggested stack

| Layer | Recommended | Why |
|---|---|---|
| Golfzon integration | Signed webhooks (HMAC or mTLS) + REST, idempotent event store | Golfzon builds the in-sim mode; we verify and record every event |
| Client (stage 3) | Unity (C#) on Windows | Simulator PCs are Windows; the Unity course pipeline already exists |
| Web / API | Next.js 16 + TypeScript on Vercel | The same stack as `getluckyapp`; the team already knows it |
| Database / auth | Supabase Postgres (RLS), with a move to dedicated Postgres at scale | Reuse; append-only tables are already patterned |
| Adjudicator | TypeScript or Go service, deterministic | Portable physics, testable against Unity |
| Video | Object storage with write-once lock, Mux or Cloudflare Stream playback | Tamper-evident evidence |
| Real-time | WebSockets (Supabase Realtime, Ably or LiveKit) | Arm-shot, result, proctor |
| KYC / geo | Veriff or Sumsub; Radar or Xpoint, then GeoComply | Pay per check; KYC only at payout thresholds |
| Payments | PayFast / Peach (SA); Paysafe or Nuvei (US) | Stripe restricts skill games with prizes |
| Fraud | Fingerprint (device), SEON (account and payment) | Multi-account and ringer detection |

## Shot integrity & anti-fraud

Shot integrity is the whole business. One fake $100K ace costs more than a year of Starter-tier margin, and it would lose the insurer.

### Threats
- **Spoofing.** A script injects a perfect launch vector into the unauthenticated local feed.
- **Tampering.** A modified connector changes the data in flight. The Garmin R10 bridge already impersonates another program's server.
- **Replay** of a captured ace packet.
- **Golden vector.** With fixed conditions, the exact winning launch can be solved offline and injected once.
- **Physical cheats:**
  - a ball launcher or robot;
  - rolling a ball through the capture zone;
  - altitude or distance "adjust" settings;
  - hitting outside the strike zone.
- **Identity:**
  - a ringer takes the shot. This is the main fraud Samsung Fire blamed for Korea's 16× claim rate.
  - multiple accounts;
  - collusion with venue staff.

### Controls, layered by prize size

| Integrity tier | Where | Data path | Evidence | Max prize |
|---|---|---|---|---|
| **Free** | Anywhere | Any Open Connect source | None | No cash |
| **Home paid** (phase 2+) | Home sim | Official vendor path | Two-angle phone video from an attested app, physics checks, KYC | $2,500–5,000 |
| **Golfzon bay** (stage 1–2) | Gym or Golfzon venue | Signed Golfzon cloud events | NASMO swing video, member login, locked settings, bay camera face-match, staff witness above $5K | $35,000 |
| **Certified venue** | Partner bay, locked PC | Partner SDK or signed stream | Fixed dual cameras, staff witness, live upload | $35,000 |
| **Legend** | Golfzon bay or certified venue | Golfzon or partner cloud | All of the above plus a live remote proctor | $100,000 |

### What the system checks on every paid shot

**Arming and conditions**
- **Server-armed attempt.** It gets a nonce and a 90-second window. A shot code appears on screen and must be visible on camera.
- **Hidden variation.** A per-attempt seed changes conditions slightly and is revealed only after the shot is committed. That defeats the golden vector.

**The shot itself**
- **Physics consistency.**
  - Carry, apex and descent must fit the launch data.
  - Smash factor must stay under the physical ceiling for the club.
  - Spin loft must match the backspin.
  - The launch must sit inside the player's own free-play distribution for that club.
- **Timing.** The camera's audio impact spike must line up with the time the shot packet arrived.
- **Device.**
  - Is the launch monitor's value spacing what that device really produces?
  - Are there gaps in the shot numbers, or odd heartbeat timing?
  - Does any float vector exactly repeat an earlier shot?

**The player**
- **Identity.** KYC with a liveness check before any payout. The ID photo is face-matched to the swing video.

**TrackMan precedent.** TrackMan's NEXT Golf Tour already runs this way: tripod video behind the player, a split-screen of the bay and the tracer, locked settings, and taped strike zones ([NEXT rules](https://www.nextgolftour.com/faq-rules)).

> **Insurer mapping** On-course hole-in-one cover requires a non-playing witness, a confirmed yardage and a signed affidavit. For $100K+ prizes it also requires continuous video. The certified-venue tier meets all of these digitally: staff or a proctor as witness, a server-logged hole spec, video, and an e-signed affidavit.

## Course content & licensing

### Building the holes
- The GSPro community pipeline (OPCD: Blender, Inkscape, Unity) turns free LiDAR (USGS 3DEP in the US) and aerial imagery into playable holes.
- Full community courses cost roughly $375–2,500 to commission.
- A **hero-quality single par-3** (photoreal, custom planting, accurate green contours) costs an estimated **$3K–15K** and 40–120 artist hours.
- Where public LiDAR is poor, add a drone survey at roughly $1.5K–5K per hole. The club must agree to it.

### Can we use famous holes?
- ***Pebble Beach v. Tour 18* (5th Cir. 1998)** is the leading case.
  - A replica course *could* copy hole layouts, because layouts lacked trade-dress protection.
  - It *could not* use the course names, or the iconic Harbour Town lighthouse.
- Industry practice follows that line. GSPro designers ship "Georgia Golf Club" and "DPC Sodgrass".
- EA and 2K pay for official Augusta, majors and TPC licences. Fees are not public, and a real-money product makes approval harder.

**Our approach:**
1. Launch with "inspired-by" names and no logos or signature structures.
2. Sign branded deals with bucket-list resorts that want the exposure. In TrackMan's model the *course pays* to be mapped, and some will co-fund prizes.
3. Clear intellectual property formally before any real name appears in paid-prize marketing.

## Legal & regulatory

*This is desk research, not legal advice. Every paid market needs a written opinion.*

### The core question: skill contest or bet?
Gambling needs three things: **prize, chance and consideration**. A paid shot has a prize and consideration, so everything turns on chance. Courts use three tests:

| Test | What it asks | Where |
|---|---|---|
| Dominant factor | Does skill mostly decide the outcome? | Most US states, NY constitution, Illinois |
| Material element | Does chance play a *material* part? | NY criminal law and some others |
| Any chance | Is the outcome contingent on chance *at all*? | TN, AZ, SC; Canada in effect |

Two precedents help us directly:
- **Florida AGO 90-58.** A paid hole-in-one contest is not gambling when the prize is not funded from entry fees and the sponsor doesn't compete.
- ***Las Vegas Hacienda v. Gibson* (Nev. 1961).** A 50¢-a-shot $5,000 hole-in-one offer was an enforceable prize contract, "not gambling".

Insurance-funded prizes fit that reasoning. **Design choices that strengthen the skill case:**
- deterministic physics, published and lab-certified (GLI or BMM);
- distance and handicap tiers;
- a closest-to-the-pin skill ladder;
- published ace statistics;
- supervised venue play.

### Market-by-market

| Market | Position | Launch mode |
|---|---|---|
| **South Africa** | The National Gambling Act could treat a fixed prize as a fixed-odds bet. CPA s36 **bans charging entry** for promotional competitions, so we can't rely on it. The existing on-course product needs a refreshed opinion before extending to sims. | **Paid, phase 1** (venue bays), after an NGA/CPA opinion and provincial-board comfort letter |
| **USA, ~38–40 dominant-factor states** | Paid skill contests are widely run (Skillz, WorldWinner). Block AZ, AR, CT, DE, LA, MT, SC, SD, TN; review WA, IA, IN, ME, NV. Avoid sweepstakes "coins": CA, NY, NJ, CT, MT, IN, ME, TN, LA and OK banned them in 2025–26, with vendor liability. | **Paid, phase 1b** (venues, then home) |
| **UK** | The Gambling Act excludes "sport" from gaming, but a paid fixed prize could be *betting* (s9). Prize-competition rules (s14) are the target. | **Phase 2**, after a counsel opinion |
| **EU via Malta** | MGA skill-games regime (Type 4: €5K application, €10K a year), but it may classify us as gaming or betting. National regimes still apply. | **Phase 3**, after an MGA ruling |
| **Canada, Australia** | Chance *or mixed* games with paid entry are prohibited. | Free play and sponsor prizes (skill-testing question in Canada) |
| **Korea, Japan** | Golf betting is gambling "even if skill affects" the outcome. Japan caps promotional prizes. | Free play and sponsor prizes only |
| **India, China, Singapore, UAE** | Real-money games banned or high risk. | Exclude paid; free play only if useful |

### Prize promotions (free-entry sponsor prizes)
- **New York and Florida:** register and bond when total prizes exceed $5,000.
- **Rhode Island:** register when they exceed $500.

### Estimated legal budget
| Item | Range |
|---|---|
| SA opinion + regulator engagement | $10–25K |
| US 50-state memo + opinion letter (needed by card networks and PSPs) | $40–100K |
| US terms, privacy, responsible gaming, promotion filings | $15–30K |
| PSP / card-network onboarding | $5–15K |
| **Phase 0–1 subtotal** | **$70–170K** |
| UK opinion | $20–50K |
| Malta, first year all-in | $200–400K |
| Ongoing compliance counsel | $5–10K a month |

## Insurance & prize funding

### Who writes this cover
Hole-in-one cover is **prize indemnity**, part of the contingency market.
- **Capacity:** Lloyd's syndicates, Beazley, Tokio Marine HCC, Everest.
- **Retail brands:** Hole In One International, US Hole In One and Odds On (all under Prize Indemnity Holdings), plus SCA Promotions, which uses contracts rather than insurance.
- **UK:** UK Hole In One is underwritten by Aviva.
- **South Africa:** Santam through Indwe.

**Simulator aces are already insurable**:
- **Hole-in-WON** claims 95% of simulator events worldwide (AboutGolf, Full Swing, ProTee, TruGolf).
- **PGA of Alberta** sells simulator packages.
- In **Korea**, per-game screen-golf policies sell for ₩1,000–2,000.

All of this is *event-level* or low-limit cover. **A $100K always-on per-shot programme is new**. It needs a bespoke contingency facility with a deposit premium, per-shot declarations and a monthly aggregate cap.

### What it costs
Published tournament prices imply insurers charge about **1/3,700 to 1/4,500 of the prize per shot**. For example, $268 insures a $10K prize for 100 golfers on a 165-yd hole.

Against a true amateur rate near 1 in 12,500, that is roughly a **3× loading**. The South African simulator model's premium of 24% of the stake implies 3–6×, the same range.

### The Korean warning
Samsung Fire's screen-golf hole-in-one policy had a claim rate of **8.0%, sixteen times** the 0.5% on its on-course policy. Causes:
- controlled conditions;
- short forward tees;
- **suspected ringers**.

The product runs at a loss and is kept only for customer acquisition ([Chosun](https://www.chosun.com/economy/money/2023/09/04/WQHJS7BEQVC27OHN4SXSFZIVDY/)). Our integrity design, minimum distances and attempt caps exist so we don't repeat this.

### Odds to plan on
**Real world, by distance.** PGA Tour data shows odds roughly halving for every 30–40 yards added:
- 1 in 962 at 120–150 yds;
- 1 in 2,070 at 150–180 yds;
- 1 in 3,027 at 180–200 yds.

**On simulators:**
- Golfzon: 143,020 aces in 2022 from about 1bn par-3 shots, or **1 in 6,992**.
- Repeated attempts at one hole collapse the odds. YouTube challenges have needed only 119 to 2,627 swings.

**Planning cases:**

| Case | Ace rate | Who it describes |
|---|---|---|
| Stress | 1 in 3,000 | Skilled players, repeated attempts, short holes |
| Base | 1 in 8,000 | Mixed field, controls in place, 160–180 yds |
| Optimistic | 1 in 12,500 | Longer holes, like the on-course average |

### Recommended structure
1. **Insure Pro, Major and Legend** with a contingency carrier on an annual programme. Santam and Indwe get first refusal for South Africa. Run a Lloyd's broker process for the US.
2. **Self-insure Starter and Classic later.** Once free-play data proves the ace rate, add stop-loss reinsurance. That lifts margin to about 53–56%, but it needs a reserve of 25 maximum prizes and a regulatory check.
3. **No prize pools or jackpots funded by entries.** They look like a lottery. Fixed, insured prizes are the cleaner skill-contest structure. A weekly sponsor-funded closest-to-the-pin prize adds the jackpot feel without the risk.

## Payments, KYC & compliance

**Payments**
- **Card rails.** Skill games sit under **MCC 7994**. Mastercard requires registration (about $1K a year) and Visa's integrity-risk programme puts skill games in Tier 2. Acquirers will ask for the US legal opinion and the state block list.
- **PSPs.** Stripe lists skill games with prizes as restricted, so plan on **Paysafe or Nuvei** in the US. In South Africa use **PayFast** (already integrated in `getluckyapp`) or Peach Payments.
- **App stores.** Apple 5.3.3/5.3.4 and Google Play forbid in-app purchase for real-money contests. The PC client plus **web checkout** avoids this completely. A phone app handles accounts and video only.

**Identity and location**
- **KYC, tiered.**
  - Light checks at sign-up: age and database.
  - A full ID and liveness check at a deposit threshold, and always before a payout.
  - Veriff costs about $0.80–1.89 a check and Sumsub about $1.35–1.85. Because checks happen at payout, the cost is about **$0.15 a paid shot**.
- **Location.** A venue bay is a registered address, so one check per session is enough there. Home play needs Radar or Xpoint, moving to GeoComply if a regulator requires it.

**Player protection and tax**
- **Responsible play.** 18+ (21+ where local analogues require it), deposit and spend limits, cool-off, self-exclusion, odds disclosure and signposting. This carries forward Get Lucky's existing responsible-play pages.
- **Tax (US).**
  - Skill prizes of **$2,000 or more** (2026 threshold) go on a 1099-MISC. Collect a W-9, or apply 24% backup withholding.
  - Non-US winners have 30% withheld on a 1042-S unless a treaty applies.
  - Keep tax treatment consistent with the legal characterisation.

## Business model & financials

### Revenue streams
1. **Paid insured shots.** The core. About 45% margin before any platform share, and about **30% after a 15% Golfzon share**.
2. **Venue share, not a venue licence, in the Golfzon network.** Golfzon operators earn 20% of shot revenue. In the gym bays, that 20% is Virgin Active's or Planet Fitness's concession share. A paid **Venue Pro** licence ($49–99 per bay per month) applies only to non-Golfzon venues in stage 3.
3. **Sponsor-named holes.** "The [Brand] 17th", branded tee boxes, and sponsor-funded prize shots, at an indicative $2–10K per hole per month per region.
4. **Corporate events.** A packaged "$25K Shoot-out" for company days, at a fixed $500–2,000 plus premium and margin.
5. **Consumer subscription.** $79–99 a year as an *add-on* to GSPro ($250 a year) or E6 ($300–600 a year). It includes unlimited Collection play, stats and one free insured shot a month.
6. **Data.** Anonymised dispersion data by handicap, distance and hardware. Its biggest value is negotiating our own premiums down.

### Unit economics per paid shot (base case, ace rate 1 in 8,000)

**Assumptions:**
- Premium at 2× expected loss.
- Venue share 20%.
- Payment fees 5%.
- KYC $0.15, location and video $0.02.
- Claims handling $750 per ace.

| Tier | Entry | Premium | Venue 20% | Fees & ops | Margin | Margin % |
|---|---:|---:|---:|---:|---:|---:|
| Starter | $5.00 | $0.63 | $1.00 | $0.51 | **$2.86** | 57% |
| Classic | $10.00 | $1.25 | $2.00 | $0.76 | **$5.99** | 60% |
| Pro | $25.00 | $3.75 | $5.00 | $1.51 | **$14.74** | 59% |
| Major | $50.00 | $8.75 | $10.00 | $2.76 | **$28.49** | 57% |
| Legend | $100.00 | $25.00 | $20.00 | $5.26 | **$49.74** | 50% |

**The Golfzon share.** On Golfzon bays a platform share comes out of the margin. At the planning assumption of 15%, the margins above fall by 15 points: about **42–45% on Starter to Major and 35% on Legend** in the base case.

**Sensitivity to the ace rate:**
- At the **stress case** (1 in 3,000), margins fall to 27–37% on the lower tiers and **8% on Legend**. That is why Legend is gated.
- A flat 1,000× ladder ($5 for $5,000) makes **0%** at 1 in 3,000.
- The blended margin is about **35% in the stress case, 45% in the base case and 55% in the optimistic case**, before the Golfzon share. After a 15% share it is about 20%, 30% and 40%.

### Three-year scenarios (illustrative)
Year 3 is 2029. Bays are the 272 gym bays plus Golfzon bays connected in markets where paid play is permitted.

Assumptions:
- Average entry: $8 (low), $9 (base), $10 (high).
- Golfzon share 15%.
- Sponsor holes: $2K, $4K and $6K a month.

| Scenario | Year-3 bays | Paid shots per bay per month | Year-3 revenue | Year-3 contribution after Golfzon share |
|---|---:|---:|---:|---:|
| Low (gym bays + early US) | 750 | 40 | $2.4M | $0.8M |
| **Base** | **2,500** | **80** | **$16.4M** | **$5.8M** |
| High | 6,000 | 150 | $80.0M | $31.8M |

**Base-case sense checks:**
- The gym model reaches about 96 paid shots per bay per month at maturity, so 80 across the network is conservative.
- 80 paid shots a month is **fewer than 3 a day per bay**.
- The venue earns about $144 per bay per month.
- 2,500 bays is about **5% of Golfzon's ~47,000–51,000 simulators**.
- **Needs validating with Golfzon:** how many of those bays sit in markets where paid play is permitted. Korea, Japan and China are free-play only. Golfzon doesn't publish counts by country, and this is the single biggest assumption in the plan.
- The network produces about **210 aces a year**, four a week. That is enough winners for social proof without breaking the insurer.

**Break-even.** Fixed opex is about $1.5–3M a year from year 2. After the Golfzon share, the base case breaks even in the course of year 3.

**Free play in Korea and Japan.** About 94M Golfzon rounds a year are played in Korea alone. Paid shots aren't possible there, but sponsor-funded prize holes and branded Collection holes are, and they aren't in the numbers above.

## Team, budget & roadmap

### First-year team (8 people)
Golfzon renders the holes and builds Get Lucky mode. The first-year team is therefore platform-heavy, with less Unity work than the any-simulator plan.

| Role | FTE | SA-led cost (loaded) |
|---|---:|---:|
| Product lead (also owns the Golfzon relationship) | 1 | $60K |
| Backend: ledger, claims, verification | 2 | $110K |
| Integrations engineer: Golfzon API and event feed | 1 | $60K |
| Unity / physics: result verification now, adjudicator later | 1 | $55K |
| Course designer: Collection holes in Golfzon format | 1 | $40K |
| QA | 1 | $30K |
| UX/UI designer | 0.5 | $23K |
| Compliance / risk | 0.5 | $35K |
| **Team total** | **8** | **~$413K** |

### Non-payroll MVP costs
| Item | Estimate |
|---|---|
| Legal opinions (SA + US) | $70–170K |
| Hero par-3s (8–10) incl. surveys and early licences | $50–150K |
| Golfzon development bay and test kit (production bays come with the gym order) | $30–60K |
| Security review + GLI/BMM-style physics and fairness audit | $30–80K |
| Insurance programme set-up, deposit premium, E&O and cyber cover | $50–150K |
| Cloud, tooling, KYC and location minimums | $30–55K |
| **First-year total incl. team and 15% contingency** | **$0.8–1.2M** |

### Roadmap
| Phase | When | What ships |
|---|---|---|
| **0: The Golfzon deal** | Q4 2026 | Golfzon term sheet (hardware + Get Lucky mode + event feed + ace data), Santam/Indwe term sheet, SA legal opinion, integration spec and API contract |
| **1: Build** | H1 2027 | Cloud platform (wallet, ledger, KYC, claims, verification), Golfzon builds Get Lucky mode, first 6 Collection holes in Golfzon format |
| **2: Gym bays live** | Mid 2027 | Paid ZAR ladder on the first 60 Signature bays (40 Virgin Active, 20 Planet Fitness). Free play on all of them |
| **3: Scale SA + Golfzon US** | 2028 | 200 gym bays. US legal opinion, then paid USD ladder at Golfzon US venues in permitted states. Free play with sponsor prizes across Golfzon's global network |
| **4: Golfzon global** | 2029 | 272 gym bays. UK/EU after legal opinions; Golfzon offers Get Lucky mode to its operators worldwide. $100K Legend tier on certified bays |
| **5: Beyond Golfzon** | 2029+ | Unity adjudicator for TrackMan, Uneekor and Foresight venues, home-sim tier, self-insured lower tiers with stop-loss |

## Risk register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Fake or spoofed ace paid out | High without controls | Severe | Server-armed attempts, hidden seeds, physics checks, cameras, witness, KYC face-match; paid play at venues first |
| Real ace rate higher than priced | Medium | High | Distance-scaled ladder, attempt caps, free-play actuarial data, aggregate cap in the policy |
| Insurer won't write per-shot $100K cover | Medium | High | Start with Santam/Indwe in SA and lower limits; Lloyd's broker process; self-insured low tiers with stop-loss later |
| Market treats it as gambling | Medium | High | Market-by-market opinions, skill-strengthening design, free-play fallback everywhere |
| **Golfzon declines or stalls the software integration** | Medium | High | Negotiate it inside the 272-bay hardware order; offer revenue share and exclusivity; keep the Unity adjudicator on TrackMan/Uneekor as the fallback |
| **Dependence on one platform partner** | Medium | High | Exclusivity limited to agreed markets and terms; own the brand, wallet, players and insurance; add other hardware in stage 5 |
| Golfzon builds its own insured prize product | Medium | Medium | It already runs ace pools in Korea. We bring what it lacks outside Korea: insurance, payouts, legal cover, brand. Tie it into contract terms |
| Fewer Golfzon bays in permitted markets than assumed | Medium | High | Get Golfzon's bay counts by country before modelling further; the gym bays alone prove the product |
| Payment rails decline | Medium | Medium | Opinion letter up front; gaming-specialist PSPs; PayFast in SA |
| Course IP claims | Low–medium | Medium | "Inspired-by" naming, no logos, IP clearance before marketing real names |
| Venue staff collusion | Low | High | Remote proctor on high tiers, rotating reviewers, anomaly flags per venue |
| Competitor copies or upscales it (Full Swing Skill Strike, TrackMan) | High | Medium | Move first, lock insurer and venue partners, own the brand and the actuarial data |

## Open questions for Johannes

1. **Insurer.** Will Santam/Indwe extend the current policy to simulator aces in SA, and do they have appetite outside SA? Or do we run a Lloyd's broker process for USD cover?
2. **Golfzon terms.** What revenue share, and in which markets exclusivity, are we willing to give Golfzon? Should the software integration be a condition of the hardware order?
3. **Home or venue first.** Is a venue-only paid launch acceptable for the first 12 months? Home sims would stay free play plus low-limit paid shots later.
4. **Top prize.** Keep the **$100K Legend** tier gated (KYC, handicap, 3 attempts a day, live witness), or cap at $35K until the data is in?
5. **Brand.** Is it "Get Lucky Sim", "Get Lucky Hole-in-One Sim", or a product name under the Get Lucky umbrella?
6. **Team.** SA-led in-house build, or a studio partner for the Unity client with backend in-house?
7. **Funding.** Is the $0.8–1.2M first-year build funded from Get Lucky's balance sheet, the gym-bay financing package, or a separate raise?
8. **Golfzon data.** Can we get Golfzon's bay counts by country and its ace-rate history under NDA before the term sheet? The global numbers depend on both.

## Sources

Key sources below. Full research notes with every link are kept with the repo's working files.

**Market & competitors**
- Grand View Research, golf simulator market: [grandviewresearch.com](https://www.grandviewresearch.com/industry-analysis/golf-simulator-market-report)
- Mordor Intelligence: [mordorintelligence.com](https://www.mordorintelligence.com/industry-reports/golf-simulator-market)
- Global Market Insights: [gminsights.com](https://www.gminsights.com/industry-analysis/golf-simulator-market)
- NGF, The Golf Simulator Opportunity (2025): [ngf.org](https://www.ngf.org/wp-content/uploads/2025/04/2025-NGF-White-Paper-The-Golf-Simulator-Opportunity.pdf)
- NGF, growth in golf's simulator space: [ngf.org](https://www.ngf.org/short-game/growth-in-golfs-simulator-space/)
- R&A global participation 2025: [randa.org](https://www.randa.org/en/articles/the-randa-aims-to-open-golf-to-the-world-as-global-participation-rises-to-more-than-112-million)
- Golfzon Tour: [golfzontour.com](https://www.golfzontour.com/about)
- Full Swing Skill Strike: [golfdigest.com](https://www.golfdigest.com/story/full-swing-simulator-skills-based-betting-game-skill-strike-the-back-nine), [prnewswire.com](https://www.prnewswire.com/news-releases/full-swing-launches-skill-strike-an-ai-powered-skill-based-gaming-platform-for-golf-simulator-play-302617839.html)
- Five Iron Tournaments: [firstcallgolf.com](https://www.firstcallgolf.com/industry-news/release/2026-05-14/five-iron-golf-introduces-real-money-tournament-platform-turning-indoor-golf-into-a-national-competitive-network)
- Golfzon G-Membership hole-in-one challenge: [cs.golfzon.com](https://cs.golfzon.com/faq/view/826466/421/424)
- Topgolf Swing Suite locations: [swingsuite.topgolf.com](https://swingsuite.topgolf.com/locations/list/)
- TruGolf FY2025 10-K: [sec.gov](https://www.sec.gov/Archives/edgar/data/0001857086/000149315226016882/form10-k.htm)

**Technology**
- GSPro Open Connect API v1: [gsprogolf.com/GSProConnectV1.html](https://gsprogolf.com/GSProConnectV1.html)
- Launch-monitor software compatibility: [mygolfsimulator.com](https://mygolfsimulator.com/launch-monitor-software-compatibility/)
- Foresight third-party integrations: [thehackersparadise.com](https://www.thehackersparadise.com/foresight-sports-enhances-3rd-party-software-integration-options/)
- Uneekor third-party software: [uneekor.com](https://uneekor.com/golf-simulator-software/third-party)
- TrackMan software terms: [trackman.com/legal/software-terms](https://www.trackman.com/legal/software-terms)
- NEXT Golf Tour rules: [nextgolftour.com/faq-rules](https://www.nextgolftour.com/faq-rules)
- Penner, *The physics of golf* (2003): [raypenner.com/golf-physics.pdf](http://raypenner.com/golf-physics.pdf)
- OPCD course pipeline: [zerosandonesgcd.com](https://zerosandonesgcd.com/opcd-course-creation/)
- *Pebble Beach Co. v. Tour 18*, 155 F.3d 526: [law.justia.com](https://law.justia.com/cases/federal/appellate-courts/F3/155/526/523642/)

**Insurance & odds**
- Hole In One International pricing: [holeinoneinternational.com](https://www.holeinoneinternational.com/how-much-does-hole-in-one-insurance-cost/)
- US Hole In One witness rules: [holeinoneinsurance.com](https://www.holeinoneinsurance.com/what-are-the-witness-requirements.html)
- Hole-in-WON simulator insurance: [hole-in-won.com](https://www.hole-in-won.com/Virtual-Golf-Simulator.html)
- Korean screen-golf insurance claims: [chosun.com](https://www.chosun.com/economy/money/2023/09/04/WQHJS7BEQVC27OHN4SXSFZIVDY/)
- Simulator ace odds (Golfzon 2022): [golf.com](https://golf.com/news/odds-making-golf-simulator-hole-in-one/)
- PGA Tour odds by distance: [probablegolfinstruction.com](https://probablegolfinstruction.com/golf-science-newsletter-hole-in-one-odds-pga-yardage.html)
- Venue simulator ace contests: [condorgolfbar.com](https://condorgolfbar.com/hole-in-one/), [100kellogglane.com](https://100kellogglane.com/attractions/10k-hole-one-challenge)

**Legal, payments & compliance**
- Florida AGO 90-58: [myfloridalegal.com](https://www.myfloridalegal.com/ag-opinions/gambling-games-of-skill)
- *Las Vegas Hacienda v. Gibson* (1961): [law.justia.com](https://law.justia.com/cases/nevada/supreme-court/1961/4319-1.html)
- Skillz restricted states: [support.skillz.com](https://support.skillz.com/hc/en-us/articles/204372905-I-deposited-money-Why-does-it-say-cash-play-is-not-available-in-my-area)
- California AB 831 sweepstakes ban: [zwillgen.com](https://www.zwillgen.com/gaming/californias-ab-831-bans-sweepstakes-casinos-expands-liability-vendors/)
- UK Gambling Act 2005 s.6: [legislation.gov.uk](https://legislation.gov.uk/ukpga/2005/19/section/6)
- MGA controlled skill games: [mga.org.mt](https://www.mga.org.mt/skill-games-regulations-fantasy-sports-ruling/)
- SA Consumer Protection Act s36: [cliffedekkerhofmeyr.com](https://www.cliffedekkerhofmeyr.com/en/news/publications/2020/corporate/corporate-and-commercial-alert-22-january-Rules-of-the-game-Keep-the-consumer-protection-act-in-mind-when-facilitating-promotional-competitions.html)
- Visa Merchant Data Standards Manual: [visa.com](https://usa.visa.com/dam/VCOM/download/merchants/visa-merchant-data-standards-manual.pdf)
- Stripe restricted businesses: [stripe.com](https://stripe.com/legal/restricted-businesses)
- 1099-MISC $2,000 threshold: [verrill-law.com](https://www.verrill-law.com/blog/the-new-2000-threshold-for-sending-irs-form-1099-misc-to-prize-winners/)

**Get Lucky internal**
- Golfzon outreach brief and gym bay model: `getluckyjo/simulatorstrategy` (`docs/golfzon-outreach.md`, `model/model.py`, `model/model_pf.py`)
- On-course claims, evidence and risk engine: `getluckyjo/getluckyapp` (`ARCHITECTURE.md`)

**Build cost**
- Offshore development rates: [uvik.net](https://uvik.net/blog/offshore-software-development-rates-by-country/)
- Veriff pricing: [veriff.com](https://www.veriff.com/plans/self-serve)
- Sumsub pricing: [sumsub.com](https://sumsub.com/pricing/)

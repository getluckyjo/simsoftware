# Get Lucky on Golfzon: how it works, and how we integrate

Written 25 September 2026 for the Golfzon meeting. It covers how a Golfzon
bay decides a hole-in-one, what Golfzon already runs that we can build on,
the integration we should ask for, what changes in the Get Lucky app, and
what we show them next week. Sources are at the end. Anything we could not
confirm is marked **unconfirmed**.

## 1. The one-line version

The golfer pays in the Get Lucky app and takes one shot on a Golfzon bay.
Golfzon's servers send us a signed record of that shot. A miss settles
itself. An ace becomes a claim whose evidence is the machine's own record,
not phone footage and a signed affidavit. The app, the payments, the claim
state machine, the review and the insurer stay the same. Only the evidence
changes.

## 2. How a Golfzon bay decides a hole-in-one

**Cameras measure the launch. Software decides where the ball ends up.**

- The commercial bays measure with cameras:
  - TwoVision NX: two overhead and front high-speed cameras, up to 20 ball and club values (ball speed, launch, spin, spin axis, club path, face angle and so on).
  - Vision and GDR: a floor stereo camera at 2,000 fps.
  - GDR Plus: 34 ball and club values.
  - Only WAVE, the home unit, uses radar.
- After launch everything is simulated. Flight, bounce and roll are computed on a course model built from aerial imagery and elevation data. Golfzon maps about 30 courses a year.
- **So the rest position, the distance to the pin and "holed" are software outputs.** Nothing measures them. Whoever controls the settings controls the odds.
- **Settings that change an ace:**
  - difficulty (see below)
  - tee and pin position
  - green speed and hardness (harder greens bounce and roll more)
  - wind, weather and altitude (altitude changes carry)
  - concede distance, mulligans and tee height
  - practice mode versus round mode
- **Difficulty matters most:**
  - Rookie and Amateur correct mishits.
  - Pro adds a "slight correction for shots near the hole cup".
  - Only G-Tour applies no correction at all.
  - The challenge has to run on G-Tour.
- **Venues can tamper.** In 2022 a Korean Golfzon venue lowered players' difficulty without telling them, and Golfzon warned the franchisee. Settings therefore have to be locked and reported by Golfzon's servers. We cannot rely on whatever the venue has set.

## 3. What Golfzon already runs that we build on

| Golfzon has | Why it matters to us |
|---|---|
| **TOURNAMENT and GLF modes** with host-set conditions, e.g. "Difficulty TOUR, Mulligan 1" | A locked-settings mode already exists. We need a variant, not a new product |
| **US monthly challenges** that rank players on the software's "Nearest" list, with an ace recorded as 0'0" | Closest-to-the-pin and ace detection already exist in the software |
| **Korea: the G-Membership Hole-in-One Challenge**, ₩30m a month split among qualifying aces, with bundled screen hole-in-one insurance | Golfzon already runs an insured ace product at home. Its exclusion list (section 7) is close to a ready-made rule book for us |
| **Korean insurers** (Samsung Fire, Lotte) sell screen-golf ace cover, capped at about ₩200k | The prizes there are tiny. Our R1,000,000 prize is a different risk class and the thing we bring |
| **Feb 2024:** Golfzon dropped ace cover on courses of three stars or fewer after a rising loss ratio | Golfzon has already been burned on ace pricing. Lead with the insurer and the controls, not the idea |
| **GOLFZON ID and the app** (relaunched July 2026): scorecards, shot data, Nasmo swing video, a Round Planner that presets course and settings | Identity, the video evidence and remote setup exist |
| **Golf Genius** runs scoring for GOLFZON Tour (since Nov 2024) and signed a league partnership in Jan 2026 | Golfzon already sends live results to a third party. How the data moves is **not public** |
| **No public API, SDK or data export** | Any integration is a partner build by Golfzon. The ask has to be small and concrete |

## 4. Three ways to integrate

| Level | How the result reaches us | What Golfzon builds | Insurable? |
|---|---|---|---|
| **0. Film the screen** | Golfer films the bay screen in our app; venue staff confirm | Nothing | **No.** Practice mode, settings and a replayed screen are all invisible to us. Fine for a free swing, never for a real prize |
| **1. Result feed** (recommended first) | Golfzon's servers send a signed record of each challenge shot to our endpoint | A locked challenge mode, a bay check-in, the signed feed and Nasmo retrieval | **Yes**, and priced from Golfzon's ace data |
| **2. Built into Golfzon** | The challenge is a game mode in Golfzon's own menu and app. Golfzon charges the entry | Level 1, plus entry registration with us, their own UI, and monthly settlement (46 / 30 / 24 per the simulator plan) | Yes. This is the scale play: 12,697 venues |

**Recommendation.** Ask for Level 1 now, and design the API so Level 2 is
the same calls plus two more.

- Level 1 goes live first in bays we control: Virgin Active, Planet Fitness, or one Golfzon venue.
- There, we own the room, the staff and the settings, so the first claims are clean.
- It is a small, specific engineering ask, close to what Golfzon already does for Golf Genius.
- Level 2 is the roadmap slide. It needs Golfzon product, legal in each market, and pricing proven by Level 1 data.

## 5. The flow, Level 1

```mermaid
sequenceDiagram
    participant G as Golfer (Get Lucky app)
    participant B as Golfzon bay
    participant Z as Golfzon servers
    participant L as Get Lucky
    participant I as Insurer
    B->>G: Challenge lobby shows a QR (bay id + one-time nonce)
    G->>L: Scan, pick stake, pay (PayFast, as today)
    L->>Z: POST /entries {bay, nonce, entry_ref, golfer}
    Z->>B: Load challenge hole, lock settings (G-Tour, fixed pin, wind, greens)
    Z-->>L: challenge.armed {settings snapshot, settings_hash}
    G->>B: One swing
    B->>Z: Launch data, simulated result, Nasmo clip
    Z-->>L: challenge.shot {launch, rest, distance_to_pin, holed, signature}
    alt miss
        L->>L: bet active → miss (actor: machine); leaderboard updated
        L-->>G: "2.7 m. Third on this week's leaderboard"
    else hole-in-one
        L->>L: bet active → claimed; claim opened with the machine evidence
        L->>Z: GET Nasmo clip
        L->>I: Evidence pack (signed record verifiable with Golfzon's public key)
        I-->>L: Approved → paid
    end
```

**What the golfer sees:** scan the bay, choose the stake, pay, "You're live
on Bay 2", swing, the result in about a second. No filming, no declaring,
no affidavit. On an ace the app says the claim is already open.

**What stays exactly as it is:**
- sign-in and the age gate
- PayFast and the payments ledger
- the tiers table pattern
- the claim state machine and its append-only log
- admin review with its checklist
- the evidence pack
- the outbox, the alerts and retention

## 6. What we ask Golfzon to build (API v0.1, a proposal)

Keep it to five things. The field names are ours and open to theirs.

**Golfzon → Get Lucky (webhooks, signed):**

- `challenge.armed`: the bay has loaded the challenge.
  - Fields: `entry_ref, venue_id, bay_id, golfzon_id, sensor_model, sensor_serial, software_version, course, hole, tee, distance_m, pin {x,y}, settings {difficulty, green_speed, green_hardness, wind, altitude, weather, concede, mulligans}, settings_hash, armed_at`.
- `challenge.shot`: the one shot.
  - Fields: `event_id, entry_ref, shot_id, ball {speed, launch, direction, backspin, spin_axis}, club {speed, path, face} when the sensor has it, carry_m, total_m, rest {x, y, lie}, distance_to_pin_cm, holed, nasmo_id, struck_at, sensor_flags`.
- `challenge.void`: the sensor did not read a ball, or the bay faulted.
  - Only the machine can void a shot, never the player or the venue.
  - A shot that was read is final.

**Get Lucky → Golfzon:**

- `POST /entries`: arm a bay for a paid entry. The body holds the bay, the nonce from the QR, `entry_ref`, the tier and an expiry. The call is idempotent on `entry_ref`.
- `GET /shots/{shot_id}/video`: the Nasmo clip, for claims only.

**Two design points to hold firm on:**

1. **Signatures should be asymmetric (Ed25519 or ECDSA), not a shared
   secret.**
   - With a shared HMAC secret, we could in principle forge a record, so it is not evidence.
   - If Golfzon signs with a private key and publishes the public key, the insurer can verify every record itself.
   - That is the thing that makes the simulator "the verifier".
2. **One entry, one shot.**
   - The first `challenge.shot` for an `entry_ref` wins.
   - Anything after it is logged and ignored.
   - An entry that is not played before it expires is refunded or re-armed. That is our rule, not the venue's.

## 7. The challenge rules (the settings lock)

Adapted from Golfzon's own Korean hole-in-one challenge and the Korean
insurers' exclusions. Proposed defaults:

- G-Tour difficulty, no near-cup correction
- Par 3 of 140 m or more (our existing on-course rule), from a tee we set
- Golfzon sets the pin, wind, green speed, hardness, weather and altitude per challenge
  - The challenge rotates weekly, so the exact shot cannot be practised
- No mulligans, no concede, and no "funnel" greens that feed the ball to the cup
- Logged in with a GOLFZON ID linked to the Get Lucky account
- The bay must be a TwoVision NX or TwoVision with online services, on an allowed software version
- Venue staff cannot play at their own venue
- Every ace must be verifiable on Nasmo, or it is not paid
- A cap on entries per golfer per challenge per day (a risk rule, as on course)

## 8. The insurance question: the one number that decides the product

The insurer prices on the ace rate. On a simulator that rate is higher than
on a course, and much higher on a hole you can practise.

- **On course:** about 1 in 12,500 amateur tee shots, the figure the current premium is built on.
- **Golfzon overall:** 143,020 par-3 aces in 2022. GOLF.com estimates one ace per about 6,992 par-3 tee shots. That is across all difficulties, tees and courses.
- **One hole, repeated:** amateurs needed 868 to 2,627 swings.

Against our tiers, with the premium at 24% of the stake, as in the plan:

| Tier | Premium | Insurer breaks even at | Expected loss at 1 in 6,992 | At 1 in 868 (practised hole) |
|---|---|---|---|---|
| R50 → R25,000 | R12 | 1 in 2,083 | R3.58 (30% of premium) | R28.80 (240%) |
| R250 → R200,000 | R60 | 1 in 3,333 | R28.60 (48%) | R230 (384%) |
| R1,000 → R1,000,000 | R240 | 1 in 4,167 | R143 (60%) | R1,152 (480%) |
| $1 → $1,000 (simulator plan) | $0.24 | 1 in 4,167 | $0.14 (60%) | $1.15 (480%) |

What this means:

- At Golfzon's blended rate the plan works, with a thinner margin than on course.
- On a fixed, practised hole it does not work at any tier.
- **So the challenge must rotate, run on G-Tour and cap entries.**
- **Ask 1 for Golfzon is the data:** ace rates by hole, tee, pin, difficulty and handicap, anonymised, so Santam can price simulator tiers. Only Golfzon has it.
- Simulator tiers should be their own table (`SIM_TIERS`), priced from that data, not the on-course multiples.

## 9. What changes in the Get Lucky app (after Golfzon says yes)

**Additions to `getluckyjo/getluckyapp`:**

| Area | Change |
|---|---|
| Data | Migration: `venues`, `bays` (Golfzon bay id, model, software version), `sim_challenges` (the weekly hole and its locked settings), and on `bets`: `source` (`course` or `sim`), `bay_id`, `sim_challenge_id`, `sim_shot` (the signed record, stored verbatim), `distance_to_pin_cm` |
| Tiers | `SIM_TIERS` beside `BET_TIERS`, the same pattern as `FREE_TIER` and `PROMO_TIER` in `src/lib/tiers.ts` |
| State machine | A new actor, `machine`: `active → miss` or `active → claimed`, only from a verified `challenge.shot`. The player cannot declare a result on a simulator bet |
| Feed | `POST /api/partners/golfzon/events`, which: <ul><li>verifies the signature against Golfzon's public key</li><li>checks `entry_ref` is an armed entry</li><li>stores the event once, keyed on `event_id`</li><li>moves the bet</li></ul> It answers 200 to a duplicate and 500 to anything it could not record, so Golfzon retries. This is the same pattern as the PayFast ITN |
| Play | `/bay/[code]` (the QR target) → stake → PayFast → "live on Bay 2", then the result screen. It replaces `/record` and the declare step for simulator bets |
| Claim | Opened automatically on an ace. The evidence is the signed record, the settings snapshot and the Nasmo clip. The witnesses are the venue's staff, in the same way `course_contacts` works |
| Risk | Simulator rules: <ul><li>settings hash does not match the challenge</li><li>software version not on the allowed list</li><li>entries per golfer per challenge per day</li><li>staff at their own venue</li><li>the same bay acing more often than the network rate</li></ul> |
| Admin | A shot panel in the verification queue (launch data, rest position, settings, signature check). The evidence pack carries the record and the public key |
| Leaderboard | Closest to the pin per challenge, chain-wide. This is free engagement, and what gives a member in Sandton a reason to play a member in Umhlanga |

**Volume is not a concern:**
- At the bay model's figures (200 bays, 5 booked hours a day, 0.625 challenges an hour), that is about 625 entries a day.
- Even Level 2 at the plan's 2029 figure is about 3,900 a day.
- The feed route is the only hot path, and it is one insert and one conditional update.

**Keep it separate:** `ARCHITECTURE.md` warns about a second product on the
same database. Keep the partner feed in its own tables, and move it to its
own service if Level 2 happens.

## 10. What we show Golfzon next week

A live demo on one screen, built in this repo and deployed on Vercel. It
needs no Golfzon access, because we play Golfzon's side with the contract
from section 6.

- **Left, the bay:** a Golfzon-style challenge screen.
  - It shows the hole, the locked settings panel and the check-in QR.
  - Ball flight and a "Nearest" readout run from realistic shot data, with dispersion by handicap.
- **Middle, the wire:** each event as it goes across.
  - That covers `POST /entries`, `challenge.armed` and `challenge.shot`.
  - Each shows the signature verifying against the public key. This is the part their engineers will look at.
- **Right, the phone:** the Get Lucky flow in the app's own design.
  - Scan, stake, pay (sandbox), "live on Bay 2", then the result.
  - A miss shows the distance and a leaderboard place.
  - An ace shows the claim already built, then the reviewer's view and the evidence pack.
- **A presenter switch** makes the next shot an ace on cue.
- **A printed one-pager:** the API in section 6, the rules in section 7, and the data ask in section 8.

This is the "one more thing, for the room" the brief already promises:
"Your simulators measure it better than any camera on a tee."

## 11. Check these before the meeting

These come from the research above and are worth fixing before anyone says them to Golfzon:

- **Africa is not in Sean Pyun's stated remit.** The March 2026 release on the Chantilly Global Business Division names North America, Europe, the Middle East and select Southeast Asian markets. `simulatorstrategy/docs/golfzon-outreach.md` says Africa runs through him. Ask who owns Africa.
- **Five Iron's real-money platform runs on TrackMan,** not Golfzon (May 2026). Do not cite it as a Golfzon precedent. Use it the other way round: TrackMan venues already have money play, Golfzon has no insured prize, and we bring one.
- **Venue count:** Golfzon's own January 2026 figure is 12,697 venues worldwide. The simulator-channel PDF says 6,500+ and ~60% share, which is stale. The brief's "13,000" is fine.
- **Course count:** the brief says 240-plus. Golfzon's course-making blog says 190+. This is **unconfirmed** either way, so say "around 200" or check.
- **No current South African Golfzon distributor is confirmed.** iPlanet Golf supplied Golfzon from 2016, but its current status is **unconfirmed**. Justin Harding's shop sells WAVE only.
- **No public data on accuracy.** Golfzon publishes no numeric tolerances. We should ask for them. We do not need to claim them.

## 12. Questions for Golfzon

1. Can a locked challenge mode be set from your servers per venue, with G-Tour and a set tee, pin and conditions?
2. Can you send a signed result per challenge shot to a partner endpoint? How does Golf Genius get GOLFZON Tour results today?
3. Can GOLFZON IDs be linked to a partner account, with the golfer's consent?
4. How long is Nasmo kept, and can we retrieve a clip by shot id?
5. Ace rates by hole, tee, pin and difficulty, anonymised, for the insurer.
6. What did the Korean insurer see before the Feb 2024 change, and what fixed it?
7. Who owns Africa: the Chantilly division or Seoul? Who would service 200 bays in South Africa?
8. Your view on stake-based contests at your venues, by market.

## Sources

- Golfzon sensors: golfzongolf.com/global/user/technology/sensors.do; TwoVision NX: golfzongolf.com/gameplay-simulators/twovisionnx; GDR Plus: golfzongolf.com/global/user/simulator/gdr-plus.do
- Software and physics: golfzongolf.com/global/user/technology/software.do; course making: golfzongolf.com/blog/technology/how-golfzon-creates-the-most-realistic-simulator-golf-courses
- Difficulty levels, green settings: story.golfzon.com/1955
- Settings and tournament modes: Vision Premium user guide (golfzongolf.com file download, Vision_Premium_user_guide_eng.pdf); monthly challenge rules: golfzongolf.com/march-monthly-challenge-official-rules
- Venue lowering difficulty, 2022: golfjournal.co.kr/news/articleView.html?idxno=3813
- App relaunch, July 2026: golfzongolf.com/news/golfzon-global-app-relaunch
- Golf Genius: golfbusinessnews.com/news/sponsorship-and-events/golf-genius-partners-with-golfzon-tour/; golfzongolf.com/news/golf-genius-golfzon-simulator-league-partnership
- Arcis Golf: arcisgolf.com/press-releases/arcis-golf-and-golfzon-america-form-strategic-partnership
- Five Iron on TrackMan: firstcallgolf.com/industry-news/release/2026-05-14/five-iron-golf-introduces-real-money-tournament-platform-turning-indoor-golf-into-a-national-competitive-network
- Simulator ace odds: golf.com/news/odds-making-golf-simulator-hole-in-one/
- Korean hole-in-one challenge rules: cs.golfzon.com/faq/view/826466/421/424
- Screen ace insurance: economist.co.kr/article/view/ecn202207220021; etnews.com/20260120000041; businesspost.co.kr (article 321009); cover dropped Feb 2024: news1.kr/industry/sb-founded/5293551
- Pebble Beach hole-in-one contest: golfzongolf.com/blog/technology/hole-in-one-contest-pebble-beach-food-wine-festival
- Global Business Division: businesswire.com/news/home/20260309237983 (9 March 2026)
- Pebble Beach partnership: businesswire.com/news/home/20260225954391; USGA: usga.org (Oct 2025, official simulator of the U.S. Open); Miami Dolphins: businesswire.com/news/home/20260423143864
- South Africa, 2016: businesswire.com/news/home/20160306005040
- GSPro Open Connect (for comparison): gsprogolf.com/GSProConnectV1.html

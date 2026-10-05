'use client'
/**
 * The demo's state and the flow between the three panes.
 *
 *   phone pays → Get Lucky asks Golfzon to arm the bay → Golfzon signs
 *   challenge.armed → Get Lucky verifies → swing → Golfzon signs
 *   challenge.shot → Get Lucky verifies and settles → phone shows it
 *
 * Golfzon's side runs in the browser (src/lib/golfzon-mock.ts). Its events
 * are POSTed to the real endpoint (/api/v0/golfzon/events), which checks
 * them with Node's crypto; if the server cannot be reached the same checks
 * run in the browser, and the wire says so.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { randomId } from '@/lib/bytes'
import { BAY, CHALLENGE, DEFAULT_TIER_ID, tierById, type SimTier } from '@/lib/challenge'
import { armBay, reportShot, signRaw, type SignedEvent } from '@/lib/golfzon-mock'
import { applyVerdict, emptyLedger, expireEntry, openEntry, type LedgerState, type Outcome } from '@/lib/ledger'
import { rankShot, type Ranked } from '@/lib/leaderboard'
import { checkEvent, SIGNATURE_HEADER, type ArmedEvent, type Check, type EntryRequest, type ShotEvent, type Verdict } from '@/lib/protocol'
import { isRanked, simulateShot, type ShotMode, type SimulatedShot } from '@/lib/shot'
import { browserVerify } from '@/lib/verify'
import { feetInches, usd } from '@/lib/format'

export type Phase =
  | 'home' | 'scanning' | 'stake' | 'paying' | 'arming' | 'armed'
  | 'flight' | 'settling' | 'miss' | 'ace' | 'claim' | 'refunded'

export type Party = 'Get Lucky' | 'Golfzon' | 'Card processor' | 'Unknown sender' | 'Venue staff'

export interface WireMsg {
  id: string
  at: number
  from: Party
  to: Party
  method: string
  path: string
  title: string
  status?: number
  headers?: [string, string][]
  body?: string
  note?: string
  checks?: Check[]
  outcome?: { text: string; tone: Outcome['tone'] }
  via?: 'server' | 'browser'
  pending?: boolean
}

export interface Entry { ref: string; tier: SimTier; request: EntryRequest; expiresAt: number }

export interface Claim {
  id: string
  createdAt: number
  golferName: string
  entry: Entry
  armed: SignedEvent<ArmedEvent>
  shot: SignedEvent<ShotEvent>
}

export interface DemoState {
  session: number
  phase: Phase
  golferName: string
  handicap: number
  nextShot: ShotMode
  lowerDifficultyNext: boolean
  tierId: string
  nonce: string
  entry?: Entry
  armed?: SignedEvent<ArmedEvent>
  shot?: SimulatedShot
  shotKey: number
  lastShot?: SignedEvent<ShotEvent>
  lastEvent?: { raw: string; type: string }
  refund?: { kind: 'settings' | 'expired'; reason: string[] }
  ranked?: Ranked
  claim?: Claim
  wire: WireMsg[]
  ledger: LedgerState
  toast?: { text: string; tone: Outcome['tone']; key: number }
  claimOpen: boolean
  presenterOpen: boolean
  processing: boolean
  /** The hands-free tour: what it is saying now. */
  tour?: { caption: string }
}

const initial = (session = 0, keep?: Partial<DemoState>): DemoState => ({
  session,
  phase: 'home',
  golferName: keep?.golferName ?? 'Guest',
  handicap: keep?.handicap ?? 10,
  nextShot: 'natural',
  lowerDifficultyNext: false,
  tierId: DEFAULT_TIER_ID,
  nonce: randomId(8),
  shotKey: 0,
  wire: [],
  ledger: emptyLedger(),
  claimOpen: false,
  presenterOpen: keep?.presenterOpen ?? false,
  processing: false,
})

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))
const pretty = (raw: string) => JSON.stringify(JSON.parse(raw), null, 2)

export function useDemo() {
  const [state, setState] = useState<DemoState>(() => initial())
  const ref = useRef(state)
  const clockOffset = useRef(0)
  /** The running tour's token: replaced or cleared to stop it. */
  const tourToken = useRef<object | null>(null)

  const update = useCallback((fn: (s: DemoState) => DemoState) => {
    ref.current = fn(ref.current)
    setState(ref.current)
  }, [])

  const now = () => Date.now() + clockOffset.current

  // Use the server's clock for signing, so a laptop with a wrong clock still works.
  useEffect(() => {
    const t0 = Date.now()
    fetch('/api/v0/challenge', { cache: 'no-store' })
      .then(r => r.json())
      .then(j => {
        const server = Date.parse(j.server_time)
        if (Number.isFinite(server)) clockOffset.current = server - (t0 + Date.now()) / 2
      })
      .catch(() => {})
  }, [])

  /** Returns a guard that is false once the demo has been reset. */
  const live = () => {
    const s = ref.current.session
    return () => ref.current.session === s
  }

  const pushWire = (m: Omit<WireMsg, 'id' | 'at'>): string => {
    const id = randomId(10)
    update(s => ({ ...s, wire: [...s.wire, { ...m, id, at: now() }] }))
    return id
  }
  const patchWire = (id: string, patch: Partial<WireMsg>) =>
    update(s => ({ ...s, wire: s.wire.map(w => (w.id === id ? { ...w, ...patch } : w)) }))

  const toast = (text: string, tone: Outcome['tone']) =>
    update(s => ({ ...s, toast: { text, tone, key: Date.now() } }))

  /** Send a signed event to the receiver: the server if reachable, the browser otherwise. */
  const deliver = async (raw: string, header: string): Promise<Verdict & { verified_by: 'server' | 'browser' }> => {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 4000)
      const res = await fetch('/api/v0/golfzon/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', [SIGNATURE_HEADER]: header },
        body: raw,
        signal: ctrl.signal,
      })
      clearTimeout(timer)
      const json = await res.json()
      if (typeof json?.accepted === 'boolean') return json
      throw new Error('unexpected response')
    } catch {
      const v = await checkEvent({ raw, header, nowMs: now(), verify: browserVerify })
      return { ...v, verified_by: 'browser' }
    }
  }

  /** Put a signed event on the wire, deliver it, and apply the result to the ledger. */
  const sendEvent = async (
    from: Party,
    raw: string,
    header: string,
    opts: { title: string; note?: string },
  ): Promise<{ verdict: Verdict; outcome: Outcome }> => {
    const id = pushWire({
      from, to: 'Get Lucky', method: 'POST', path: '/api/v0/golfzon/events', title: opts.title, note: opts.note,
      headers: [['Content-Type', 'application/json'], [SIGNATURE_HEADER, header]], body: pretty(raw), pending: true,
    })
    const alive = live()
    const [verdict] = await Promise.all([deliver(raw, header), wait(650)])
    const { ledger, outcome } = applyVerdict(ref.current.ledger, verdict)
    // A reset while this was in flight starts a clean ledger; do not write the old session into it.
    if (alive()) update(s => ({ ...s, ledger }))
    patchWire(id, { pending: false, status: outcome.status, checks: verdict.checks, via: verdict.verified_by, outcome: { text: outcome.summary, tone: outcome.tone } })
    return { verdict, outcome }
  }

  // ── Actions ───────────────────────────────────────────────────────────

  const scan = () => update(s => ({ ...s, phase: 'scanning' }))
  const checkIn = () => update(s => ({ ...s, phase: 'stake' }))
  const selectTier = (tierId: string) => update(s => ({ ...s, tierId }))
  const openPay = () => update(s => ({ ...s, phase: 'paying' }))
  const closePay = () => update(s => (s.processing ? s : { ...s, phase: 'stake' }))
  const home = () => update(s => ({ ...s, phase: 'home', entry: undefined, shot: undefined, ranked: undefined, refund: undefined }))

  const confirmPay = async () => {
    const alive = live()
    const tier = tierById(ref.current.tierId)
    if (!tier || ref.current.processing) return
    update(s => ({ ...s, processing: true }))
    await wait(900)
    if (!alive()) return

    const entryRef = `GL-${randomId(6)}`
    pushWire({
      from: 'Get Lucky', to: 'Card processor', method: 'POST', path: '/v1/charges', title: `Stake ${usd(tier.stakeUsd)}.00`,
      status: 200, outcome: { text: `${usd(tier.stakeUsd)}.00 approved (sandbox). The stake is taken before the bay is armed.`, tone: 'ok' },
    })

    const expiresAt = now() + CHALLENGE.entryWindowMin * 60_000
    const request: EntryRequest = {
      entry_ref: entryRef,
      challenge_id: CHALLENGE.challenge_id,
      bay_id: BAY.id,
      nonce: ref.current.nonce,
      stake: { amount: tier.stakeUsd, currency: 'USD' },
      prize: { amount: tier.prizeUsd, currency: 'USD' },
      expires_at: new Date(expiresAt).toISOString(),
    }
    const entry: Entry = { ref: entryRef, tier, request, expiresAt }
    update(s => ({ ...s, processing: false, phase: 'arming', entry, ledger: openEntry(s.ledger, entryRef), shot: undefined, ranked: undefined, refund: undefined }))

    const reqId = pushWire({
      from: 'Get Lucky', to: 'Golfzon', method: 'POST', path: '/v0/entries', title: 'Arm Bay 2 for this entry',
      headers: [['Authorization', 'Bearer gl_demo_••••••••'], ['Idempotency-Key', entryRef]], body: JSON.stringify(request, null, 2), pending: true,
    })
    await wait(700)
    if (!alive()) return
    patchWire(reqId, { pending: false, status: 202, outcome: { text: 'Accepted. GOLFZON locks the challenge settings on Bay 2.', tone: 'ok' } })

    const lowered = ref.current.lowerDifficultyNext
    update(s => ({ ...s, lowerDifficultyNext: false }))
    const armed = await armBay(request, { venueLoweredDifficulty: lowered, nowMs: now() })
    await wait(600)
    if (!alive()) return
    update(s => ({ ...s, armed, lastEvent: { raw: armed.raw, type: armed.event.type } }))
    const { verdict, outcome } = await sendEvent('Golfzon', armed.raw, armed.header, { title: 'challenge.armed' })
    if (!alive()) return

    if (outcome.effect === 'arm') {
      update(s => ({ ...s, phase: 'armed' }))
      return
    }
    const reason = verdict.checks.filter(c => !c.ok).map(c => c.detail ?? c.label)
    pushWire({
      from: 'Get Lucky', to: 'Card processor', method: 'POST', path: '/v1/refunds', title: `Refund ${usd(tier.stakeUsd)}.00`,
      status: 200, outcome: { text: `${usd(tier.stakeUsd)}.00 refunded. The bay was not on the challenge settings.`, tone: 'warn' },
    })
    update(s => ({ ...s, phase: 'refunded', refund: { kind: 'settings', reason } }))
  }

  const swing = () => {
    const s = ref.current
    if (s.phase !== 'armed') return
    const shot = simulateShot({ handicap: s.handicap, mode: s.nextShot })
    update(x => ({ ...x, phase: 'flight', shot, shotKey: x.shotKey + 1, nextShot: 'natural' }))
  }

  /** The bay's animation has brought the ball to rest: Golfzon reports the shot. */
  const onRest = async () => {
    const alive = live()
    const s = ref.current
    if (s.phase !== 'flight' || !s.shot || !s.entry || !s.armed) return
    const entry = s.entry, armedEv = s.armed, shotResult = s.shot
    update(x => ({ ...x, phase: 'settling' }))
    const signed = await reportShot(entry.ref, shotResult, now())
    await wait(350)
    if (!alive()) return
    update(x => ({ ...x, lastShot: signed, lastEvent: { raw: signed.raw, type: signed.event.type } }))
    const { outcome } = await sendEvent('Golfzon', signed.raw, signed.header, { title: 'challenge.shot' })
    if (!alive()) return

    if (outcome.effect === 'claim') {
      const claim: Claim = {
        id: `GLS-2026-${String(40 + Math.floor(Math.random() * 900)).padStart(5, '0')}`,
        createdAt: now(),
        golferName: ref.current.golferName,
        entry,
        armed: armedEv,
        shot: signed,
      }
      update(x => ({ ...x, phase: 'ace', claim }))
      await wait(500)
      if (!alive()) return
      pushWire({
        from: 'Get Lucky', to: 'Golfzon', method: 'GET', path: `/v0/shots/${signed.event.shot_id}/video`, title: 'Fetch the Nasmo swing video',
        status: 200, outcome: { text: `video/mp4, 6.4 s, stored with the claim (${signed.event.nasmo_id}).`, tone: 'ok' },
      })
      await wait(350)
      if (!alive()) return
      pushWire({
        from: 'Get Lucky', to: 'Venue staff', method: 'QUEUE', path: 'outbox: witness_request', title: 'Ask Bay 2 staff to confirm',
        status: 202, outcome: { text: 'Queued. The same witness flow as on course, sent to the venue instead of a golf club.', tone: 'ok' },
      })
      return
    }
    if (outcome.effect === 'miss') {
      const ranked = isRanked(shotResult) ? rankShot(ref.current.golferName || 'You', shotResult.distanceToPinCm) : undefined
      update(x => ({ ...x, phase: 'miss', ranked }))
      return
    }
    // Rejected: nothing settles. Should not happen with a real Golfzon event.
    update(x => ({ ...x, phase: 'armed' }))
    toast(outcome.summary, 'bad')
  }

  const playAgain = () => update(s => ({ ...s, phase: 'stake', entry: undefined, shot: undefined, ranked: undefined, refund: undefined, armed: undefined }))
  const showClaim = () => update(s => ({ ...s, phase: 'claim' }))
  const setClaimOpen = (claimOpen: boolean) => update(s => ({ ...s, claimOpen }))

  // ── Presenter ─────────────────────────────────────────────────────────

  const setNextShot = (nextShot: ShotMode) => update(s => ({ ...s, nextShot }))
  const setHandicap = (handicap: number) => update(s => ({ ...s, handicap }))
  const setGolferName = (golferName: string) => update(s => ({ ...s, golferName }))
  const toggleLowerDifficulty = () => update(s => ({ ...s, lowerDifficultyNext: !s.lowerDifficultyNext }))
  const togglePresenter = (open?: boolean) => update(s => ({ ...s, presenterOpen: open ?? !s.presenterOpen }))

  /** Take the last real miss, change it into an ace, and replay it with Golfzon's signature. */
  const forgeAce = async () => {
    const last = ref.current.lastShot
    if (!last || last.event.holed) return
    const e = last.event
    const forged = {
      ...e,
      rest: { x_m: CHALLENGE.pin.x_m, y_m: CHALLENGE.pin.y_m, lie: 'cup' as const },
      distance_to_pin_cm: 0,
      holed: true,
    }
    const raw = JSON.stringify(forged)
    const note = `Edited after GOLFZON signed it: holed false → true · distance_to_pin_cm ${e.distance_to_pin_cm} → 0 (${feetInches(e.distance_to_pin_cm)} → 0' 0") · rest.lie ${e.rest.lie} → cup. GOLFZON's original signature kept.`
    const { outcome } = await sendEvent('Unknown sender', raw, last.header, { title: 'challenge.shot (forged ace)', note })
    toast(outcome.tone === 'bad' ? 'Forged ace refused: the signature does not match. Nothing changed.' : outcome.summary, outcome.tone === 'bad' ? 'ok' : 'bad')
  }

  /** Golfzon retries the last webhook: same body, same event id, a fresh signature. */
  const replayLast = async () => {
    const last = ref.current.lastEvent
    if (!last) return
    const header = await signRaw(last.raw, now())
    const { outcome } = await sendEvent('Golfzon', last.raw, header, { title: `${last.type} (retry)`, note: 'GOLFZON retries: the same event, re-signed. Delivery is at-least-once, so this must be harmless.' })
    toast(outcome.summary, outcome.duplicate ? 'ok' : outcome.tone)
  }

  const reset = () => {
    tourToken.current = null
    const keep = ref.current
    ref.current = initial(keep.session + 1, keep)
    setState(ref.current)
  }

  // ── Expiry ────────────────────────────────────────────────────────────

  /** An armed entry not played in its window: disarm the bay and refund the stake. */
  const expire = () => {
    const s = ref.current
    if (s.phase !== 'armed' || !s.entry || now() < s.entry.expiresAt) return
    const ledger = expireEntry(s.ledger, s.entry.ref)
    if (!ledger) return
    const { entry } = s
    update(x => ({ ...x, ledger, phase: 'refunded', refund: { kind: 'expired', reason: [`Not played within ${CHALLENGE.entryWindowMin} minutes`] } }))
    pushWire({
      from: 'Get Lucky', to: 'Golfzon', method: 'DELETE', path: `/v0/entries/${entry.ref}`, title: 'Disarm Bay 2: entry expired',
      status: 200, outcome: { text: `Entry ${entry.ref} was not played within ${CHALLENGE.entryWindowMin} minutes. GOLFZON returns the bay to normal play.`, tone: 'warn' },
    })
    pushWire({
      from: 'Get Lucky', to: 'Card processor', method: 'POST', path: '/v1/refunds', title: `Refund ${usd(entry.tier.stakeUsd)}.00`,
      status: 200, outcome: { text: `${usd(entry.tier.stakeUsd)}.00 refunded. An entry that is never played costs the golfer nothing.`, tone: 'warn' },
    })
  }

  const expireRef = useRef(expire)
  useEffect(() => { expireRef.current = expire })
  const expiresAt = state.phase === 'armed' ? state.entry?.expiresAt : undefined
  useEffect(() => {
    if (expiresAt === undefined) return
    const t = setTimeout(() => expireRef.current(), Math.max(0, expiresAt - now()) + 50)
    return () => clearTimeout(t)
  }, [expiresAt])

  // ── The hands-free tour ───────────────────────────────────────────────

  /** Plays the whole loop by itself, with a caption for each step: for someone who was sent the link. */
  const startTour = async () => {
    reset()
    const token = {}
    tourToken.current = token
    const on = () => tourToken.current === token
    const say = (caption: string) => { if (on()) update(s => ({ ...s, tour: { caption } })) }
    const pause = async (ms: number) => { await wait(ms); return on() }
    const until = async (pred: (s: DemoState) => boolean, ms = 20_000) => {
      for (let t = 0; t < ms; t += 100) {
        if (!on()) return false
        if (pred(ref.current)) return true
        await wait(100)
      }
      return false
    }
    const playOne = async (mode: ShotMode, waitFor: Phase) => {
      openPay()
      if (!(await pause(1300))) return false
      confirmPay()
      if (!(await until(s => s.phase === 'armed'))) return false
      if (!(await pause(2200))) return false
      setNextShot(mode)
      swing()
      return until(s => s.phase === waitFor)
    }

    say('A golfer at a GOLFZON bay opens the Get Lucky app and scans the QR code on the bay screen.')
    if (!(await pause(900))) return
    scan()
    if (!(await pause(2300))) return
    checkIn()
    say('They back themselves: $100 to win $100,000. The prize is insured, so Get Lucky carries no risk.')
    if (!(await pause(1400))) return
    selectTier('sim_100')
    if (!(await pause(1600))) return
    say('Get Lucky takes the stake and asks GOLFZON to arm Bay 2. GOLFZON locks the settings and sends back a signed message. Every message, and every check on it, is on the wire.')
    if (!(await playOne('close', 'miss'))) return
    say('A near miss. It settles itself from GOLFZON\'s signed shot record: no video, no forms. It goes on the leaderboard.')
    if (!(await pause(5000))) return
    say('Same again, and this time it drops.')
    playAgain()
    if (!(await pause(1400))) return
    if (!(await playOne('ace', 'ace'))) return
    say('Hole in one. The claim opens by itself, and the evidence is GOLFZON\'s signed record.')
    if (!(await pause(4200))) return
    showClaim()
    if (!(await pause(2200))) return
    say('This is what the reviewer and the insurer see. Both records are checked against GOLFZON\'s public key, right here.')
    setClaimOpen(true)
    if (!(await pause(7500))) return
    setClaimOpen(false)
    say('That is the whole loop. Your turn: press Play it yourself, or open Presenter and try to break it.')
    if (!(await pause(9000))) return
    stopTour()
  }

  const stopTour = () => {
    tourToken.current = null
    update(s => ({ ...s, tour: undefined }))
  }

  return {
    state,
    actions: {
      scan, checkIn, selectTier, openPay, closePay, confirmPay, swing, onRest, playAgain, home, showClaim, setClaimOpen,
      setNextShot, setHandicap, setGolferName, toggleLowerDifficulty, togglePresenter, forgeAce, replayLast, reset,
      startTour, stopTour,
    },
  }
}

export type DemoActions = ReturnType<typeof useDemo>['actions']

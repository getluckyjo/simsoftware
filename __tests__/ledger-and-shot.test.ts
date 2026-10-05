import { describe, expect, it } from 'vitest'
import { applyVerdict, emptyLedger, expireEntry, openEntry } from '@/lib/ledger'
import type { Verdict } from '@/lib/protocol'
import { CHALLENGE, challengeWeek } from '@/lib/challenge'
import { isRanked, mulberry32, simulateShot } from '@/lib/shot'

const verdict = (effect: Verdict['effect'], eventId: string): Verdict => ({
  status: 200, accepted: true, code: 'ok', message: '', checks: [], effect, event_id: eventId, entry_ref: 'GL-1', event_type: effect === 'arm' ? 'challenge.armed' : 'challenge.shot',
})

describe('ledger', () => {
  it('arms, settles, and refuses a second shot on the same entry', () => {
    let l = openEntry(emptyLedger(), 'GL-1')
    let r = applyVerdict(l, verdict('arm', 'evt_a'))
    expect(r.outcome.status).toBe(200)
    l = r.ledger
    r = applyVerdict(l, verdict('miss', 'evt_b'))
    expect(r.ledger.entries['GL-1']).toBe('miss')
    l = r.ledger
    r = applyVerdict(l, verdict('claim', 'evt_c'))
    expect(r.outcome.status).toBe(409)
    expect(r.ledger.entries['GL-1']).toBe('miss')
  })

  it('treats a repeated event id as a no-op', () => {
    const l = applyVerdict(openEntry(emptyLedger(), 'GL-1'), verdict('arm', 'evt_a')).ledger
    const r = applyVerdict(l, verdict('arm', 'evt_a'))
    expect(r.outcome).toMatchObject({ status: 200, duplicate: true })
    expect(r.ledger).toBe(l)
  })

  it('does not let a shot arrive for an entry that was never armed', () => {
    const r = applyVerdict(emptyLedger(), verdict('claim', 'evt_z'))
    expect(r.outcome.status).toBe(409)
  })
})

describe('expiry', () => {
  it('refunds an armed entry, and then refuses a late shot for it', () => {
    const armed = applyVerdict(openEntry(emptyLedger(), 'GL-1'), verdict('arm', 'evt_a')).ledger
    const expired = expireEntry(armed, 'GL-1')
    expect(expired?.entries['GL-1']).toBe('refunded')
    const late = applyVerdict(expired!, verdict('claim', 'evt_b'))
    expect(late.outcome.status).toBe(409)
    expect(late.ledger.entries['GL-1']).toBe('refunded')
  })

  it('leaves an entry that was played alone', () => {
    let l = applyVerdict(openEntry(emptyLedger(), 'GL-1'), verdict('arm', 'evt_a')).ledger
    l = applyVerdict(l, verdict('miss', 'evt_b')).ledger
    expect(expireEntry(l, 'GL-1')).toBeNull()
    expect(expireEntry(emptyLedger(), 'GL-404')).toBeNull()
  })
})

describe('challenge week', () => {
  it('runs Monday to Sunday, UTC, around any moment in it', () => {
    const week = { valid_from: '2026-10-05T00:00:00.000Z', valid_to: '2026-10-11T23:59:59.000Z' }
    expect(challengeWeek(new Date('2026-10-05T00:00:00Z'))).toEqual(week)
    expect(challengeWeek(new Date('2026-10-08T13:30:00Z'))).toEqual(week)
    expect(challengeWeek(new Date('2026-10-11T23:59:59Z'))).toEqual(week)
    expect(challengeWeek(new Date('2026-10-12T00:00:00Z')).valid_from).toBe('2026-10-12T00:00:00.000Z')
  })
})

describe('shot model', () => {
  it('natural shots look like a 168-yard iron', () => {
    const rng = mulberry32(1)
    const shots = Array.from({ length: 2000 }, () => simulateShot({ handicap: 10, mode: 'natural', rng }))
    const carries = shots.map(s => s.carryM).sort((a, b) => a - b)
    const median = carries[1000]
    expect(median).toBeGreaterThan(135)
    expect(median).toBeLessThan(155)
    const mph = shots.map(s => s.launch.ballSpeedMps / 0.44704).sort((a, b) => a - b)[1000]
    expect(mph).toBeGreaterThan(105)
    expect(mph).toBeLessThan(125)
    const onGreen = shots.filter(isRanked).length / shots.length
    expect(onGreen).toBeGreaterThan(0.3)
    expect(onGreen).toBeLessThan(0.65)
    expect(shots.filter(s => s.holed).length).toBeLessThan(10)
    for (const s of shots) expect(s.holed).toBe(s.distanceToPinCm === 0)
  })

  it('an ace finishes in the cup and a close shot finishes near but not in it', () => {
    for (let seed = 1; seed < 50; seed++) {
      const ace = simulateShot({ handicap: 10, mode: 'ace', rng: mulberry32(seed) })
      expect(ace).toMatchObject({ holed: true, distanceToPinCm: 0, lie: 'cup' })
      expect(ace.rest).toEqual([CHALLENGE.pin.x_m, CHALLENGE.pin.y_m])
      const close = simulateShot({ handicap: 10, mode: 'close', rng: mulberry32(seed) })
      expect(close.holed).toBe(false)
      expect(close.distanceToPinCm).toBeGreaterThanOrEqual(50)
      expect(close.distanceToPinCm).toBeLessThanOrEqual(230)
    }
  })
})

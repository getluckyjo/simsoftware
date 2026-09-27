import { describe, expect, it } from 'vitest'
import { armBay, reportShot, signRaw } from '@/lib/golfzon-mock'
import { checkEvent, parseSignatureHeader, settingsHash, type EntryRequest } from '@/lib/protocol'
import { nodeVerify } from '@/lib/verify-node'
import { browserVerify } from '@/lib/verify'
import { CHALLENGE, CHALLENGE_SETTINGS, LOWERED_SETTINGS } from '@/lib/challenge'
import { mulberry32, simulateShot } from '@/lib/shot'
import { POST } from '@/app/api/v0/golfzon/events/route'

const now = Date.parse('2026-09-30T10:00:00Z')
const entry: EntryRequest = {
  entry_ref: 'GL-TEST42',
  challenge_id: CHALLENGE.challenge_id,
  bay_id: 'GZ-DEMO-01-B2',
  nonce: 'N0NCE',
  stake: { amount: 5, currency: 'USD' },
  prize: { amount: 5000, currency: 'USD' },
  expires_at: new Date(now + 15 * 60_000).toISOString(),
}

describe('signatures', () => {
  it('an event signed in the browser verifies with Node crypto and with noble', async () => {
    const armed = await armBay(entry, { venueLoweredDifficulty: false, nowMs: now })
    for (const verify of [nodeVerify, browserVerify]) {
      const v = await checkEvent({ raw: armed.raw, header: armed.header, nowMs: now, verify })
      expect(v).toMatchObject({ status: 200, accepted: true, effect: 'arm', entry_ref: 'GL-TEST42' })
    }
  })

  it('an edited body fails, even when the edit is a single field', async () => {
    const shot = await reportShot(entry.entry_ref, simulateShot({ handicap: 10, mode: 'natural', rng: mulberry32(3) }), now)
    const forged = shot.raw.replace('"holed":false', '"holed":true')
    expect(forged).not.toBe(shot.raw)
    const v = await checkEvent({ raw: forged, header: shot.header, nowMs: now, verify: nodeVerify })
    expect(v).toMatchObject({ status: 401, accepted: false, code: 'bad_signature' })
  })

  it('rejects a missing header, an unknown key and an old signature', async () => {
    const shot = await reportShot(entry.entry_ref, simulateShot({ handicap: 10, mode: 'natural', rng: mulberry32(4) }), now)
    expect((await checkEvent({ raw: shot.raw, header: null, nowMs: now, verify: nodeVerify })).code).toBe('bad_signature_header')
    const otherKid = shot.header.replace('kid=gz-demo-2026-09', 'kid=gz-other')
    expect((await checkEvent({ raw: shot.raw, header: otherKid, nowMs: now, verify: nodeVerify })).code).toBe('unknown_key')
    expect((await checkEvent({ raw: shot.raw, header: shot.header, nowMs: now + 6 * 60_000, verify: nodeVerify })).code).toBe('stale')
  })

  it('parses the header it writes', async () => {
    const header = await signRaw('{}', now)
    const parsed = parseSignatureHeader(header)
    expect(parsed?.t).toBe(now / 1000)
    expect(parsed?.sig).toHaveLength(64)
    expect(parseSignatureHeader('t=1,kid=a,ed25519=***')).toBeNull()
  })
})

describe('settings', () => {
  it('a bay on lowered settings is recorded and refunded, with the fields that differ', async () => {
    const armed = await armBay(entry, { venueLoweredDifficulty: true, nowMs: now })
    const v = await checkEvent({ raw: armed.raw, header: armed.header, nowMs: now, verify: nodeVerify })
    expect(v).toMatchObject({ status: 200, accepted: true, effect: 'refund' })
    const detail = v.checks.find(c => !c.ok)?.detail ?? ''
    expect(detail).toContain('difficulty PRO, needs GTOUR')
    expect(detail).toContain('near_cup_assist true, needs false')
  })

  it('hashes settings the same regardless of key order', async () => {
    const reordered = Object.fromEntries(Object.entries(CHALLENGE_SETTINGS).reverse()) as typeof CHALLENGE_SETTINGS
    expect(await settingsHash(reordered)).toBe(await settingsHash(CHALLENGE_SETTINGS))
    expect(await settingsHash(LOWERED_SETTINGS)).not.toBe(await settingsHash(CHALLENGE_SETTINGS))
  })
})

describe('shots', () => {
  it('a miss settles and an ace opens a claim', async () => {
    const miss = await reportShot(entry.entry_ref, simulateShot({ handicap: 10, mode: 'close', rng: mulberry32(9) }), now)
    const ace = await reportShot(entry.entry_ref, simulateShot({ handicap: 10, mode: 'ace', rng: mulberry32(9) }), now)
    expect((await checkEvent({ raw: miss.raw, header: miss.header, nowMs: now, verify: nodeVerify })).effect).toBe('miss')
    expect((await checkEvent({ raw: ace.raw, header: ace.header, nowMs: now, verify: nodeVerify })).effect).toBe('claim')
    expect(ace.event).toMatchObject({ holed: true, distance_to_pin_cm: 0, rest: { lie: 'cup' } })
  })

  it('a correctly signed but self-contradicting result is refused', async () => {
    const shot = await reportShot(entry.entry_ref, simulateShot({ handicap: 10, mode: 'close', rng: mulberry32(10) }), now)
    const raw = shot.raw.replace('"holed":false', '"holed":true')
    const v = await checkEvent({ raw, header: await signRaw(raw, now), nowMs: now, verify: nodeVerify })
    expect(v).toMatchObject({ status: 422, code: 'inconsistent' })
  })
})

describe('POST /api/v0/golfzon/events', () => {
  it('answers 200 for a signed event and 401 for a forged one', async () => {
    const shot = await reportShot(entry.entry_ref, simulateShot({ handicap: 10, mode: 'close', rng: mulberry32(11) }), Date.now())
    const ok = await POST(new Request('http://x/api/v0/golfzon/events', { method: 'POST', headers: { 'Golfzon-Signature': shot.header }, body: shot.raw }))
    expect(ok.status).toBe(200)
    expect(await ok.json()).toMatchObject({ accepted: true, effect: 'miss', verified_by: 'server' })

    const forged = shot.raw.replace(/"distance_to_pin_cm":\d+/, '"distance_to_pin_cm":0')
    const bad = await POST(new Request('http://x/api/v0/golfzon/events', { method: 'POST', headers: { 'Golfzon-Signature': shot.header }, body: forged }))
    expect(bad.status).toBe(401)
  })
})

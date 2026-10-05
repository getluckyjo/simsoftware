/**
 * Golfzon's side of the demo, in the browser: turns an entry request and a
 * simulated shot into the events Golfzon's servers would send, and signs
 * them with the demo key. Nothing here is on the receiving side.
 */
import { signAsync } from '@noble/ed25519'
import { b64urlEncode, randomId } from './bytes'
import { BAY, CHALLENGE, CHALLENGE_SETTINGS, DEMO_GOLFZON_ID, LOWERED_SETTINGS } from './challenge'
import { DEMO_SIGNING_KEY } from './demo-golfzon-key'
import { API_VERSION, formatSignatureHeader, settingsHash, signedMessage, type ArmedEvent, type EntryRequest, type ShotEvent } from './protocol'
import type { SimulatedShot } from './shot'

export interface SignedEvent<E> {
  event: E
  /** The exact bytes sent and signed. */
  raw: string
  header: string
}

export async function signRaw(raw: string, nowMs: number): Promise<string> {
  const t = Math.floor(nowMs / 1000)
  const sig = await signAsync(signedMessage(t, raw), DEMO_SIGNING_KEY.secret)
  return formatSignatureHeader(t, DEMO_SIGNING_KEY.kid, b64urlEncode(sig))
}

async function sign<E>(event: E, nowMs: number): Promise<SignedEvent<E>> {
  const raw = JSON.stringify(event)
  return { event, raw, header: await signRaw(raw, nowMs) }
}

const round = (x: number, dp: number) => Math.round(x * 10 ** dp) / 10 ** dp

/** The bay loads the challenge and reports what it is actually running. */
export async function armBay(req: EntryRequest, opts: { venueLoweredDifficulty: boolean; nowMs: number }): Promise<SignedEvent<ArmedEvent>> {
  const settings = opts.venueLoweredDifficulty ? LOWERED_SETTINGS : CHALLENGE_SETTINGS
  const event: ArmedEvent = {
    type: 'challenge.armed',
    api_version: API_VERSION,
    event_id: `evt_${randomId(20)}`,
    entry_ref: req.entry_ref,
    challenge_id: req.challenge_id,
    bay: BAY,
    golfzon_id: DEMO_GOLFZON_ID,
    hole: {
      course: CHALLENGE.course,
      number: CHALLENGE.hole,
      par: CHALLENGE.par,
      tee: CHALLENGE.tee,
      distance_m: CHALLENGE.distance_m,
      pin: CHALLENGE.pin,
    },
    settings,
    settings_hash: await settingsHash(settings),
    armed_at: new Date(opts.nowMs).toISOString(),
    expires_at: req.expires_at,
  }
  return sign(event, opts.nowMs)
}

/** The one shot, as Golfzon's servers would report it once the ball is at rest. */
export async function reportShot(entryRef: string, shot: SimulatedShot, nowMs: number): Promise<SignedEvent<ShotEvent>> {
  const l = shot.launch
  const event: ShotEvent = {
    type: 'challenge.shot',
    api_version: API_VERSION,
    event_id: `evt_${randomId(20)}`,
    entry_ref: entryRef,
    challenge_id: CHALLENGE.challenge_id,
    shot_id: `gz_shot_${randomId(12)}`,
    bay_id: BAY.id,
    golfzon_id: DEMO_GOLFZON_ID,
    ball: {
      speed_mps: round(l.ballSpeedMps, 2),
      launch_deg: round(l.launchDeg, 1),
      direction_deg: round(l.directionDeg, 1),
      backspin_rpm: Math.round(l.backspinRpm),
      sidespin_rpm: Math.round(l.sidespinRpm),
      spin_axis_deg: round(l.spinAxisDeg, 1),
    },
    club: {
      speed_mps: round(l.clubSpeedMps, 2),
      path_deg: round(l.pathDeg, 1),
      face_deg: round(l.faceDeg, 1),
      attack_deg: round(l.attackDeg, 1),
    },
    flight: { carry_m: round(shot.carryM, 1), total_m: round(shot.totalM, 1), apex_m: round(shot.apexM, 1) },
    rest: { x_m: round(shot.rest[0], 2), y_m: round(shot.rest[1], 2), lie: shot.lie },
    distance_to_pin_cm: shot.distanceToPinCm,
    holed: shot.holed,
    settings_hash: await settingsHash(CHALLENGE_SETTINGS),
    nasmo_id: `nasmo_${randomId(12)}`,
    sensor_flags: [],
    struck_at: new Date(nowMs - 6_000).toISOString(),
  }
  return sign(event, nowMs)
}

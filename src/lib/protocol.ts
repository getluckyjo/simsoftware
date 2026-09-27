/**
 * The Golfzon → Get Lucky contract, v0.1 (docs/golfzon-integration.md §6).
 *
 * Golfzon's servers send two signed events per entry:
 *   challenge.armed  the bay has loaded the challenge, with the settings it is running
 *   challenge.shot   the one shot, with launch data and the simulated result
 *
 * Signing: Ed25519 over `${t}.${rawBody}`, sent as
 *   Golfzon-Signature: t=<unix seconds>,kid=<key id>,ed25519=<base64url signature>
 * Golfzon holds the private key and publishes the public one, so anyone who
 * has the record, including the insurer, can check it without trusting us.
 *
 * `checkEvent` is everything the receiver can decide from one request on
 * its own: signature, freshness, shape, and whether the settings are the
 * challenge's. What needs memory (have we seen this event, has this entry
 * already been played) is in ./ledger.ts. The API route and the browser run
 * the same function; only the Ed25519 verifier is injected, so the server
 * checks with Node's crypto what the browser signed with @noble/ed25519.
 */
import { z } from 'zod'
import { CHALLENGE } from './challenge'
import { b64urlDecode, canonicalJson, sha256Hex, utf8 } from './bytes'
import { PUBLIC_KEYS } from './keys'

export const API_VERSION = '0.1'
/** Header names are case-insensitive; this is how the docs spell it. */
export const SIGNATURE_HEADER = 'Golfzon-Signature'
export const TIMESTAMP_TOLERANCE_S = 300

// ── Shapes ───────────────────────────────────────────────────────────────

export const SettingsSchema = z.strictObject({
  difficulty: z.enum(['GTOUR', 'PRO', 'AMATEUR', 'ROOKIE']),
  near_cup_assist: z.boolean(),
  green_speed_m: z.number().min(2).max(4),
  green_firmness: z.enum(['soft', 'medium', 'firm']),
  wind_speed_mps: z.number().min(0).max(30),
  wind_from_deg: z.number().min(0).max(360),
  altitude_m: z.number().min(-500).max(5000),
  weather: z.enum(['clear', 'cloudy', 'rain']),
  mulligans: z.number().int().min(0),
  concede_m: z.number().min(0),
})
export type ChallengeSettings = z.infer<typeof SettingsSchema>

const Hash = z.string().regex(/^[0-9a-f]{64}$/)

const BaySchema = z.object({
  id: z.string().min(1).max(64),
  venue_id: z.string().min(1).max(64),
  venue_name: z.string().max(120),
  number: z.number().int().min(1),
  sensor_model: z.string().max(64),
  sensor_serial: z.string().max(64),
  software_version: z.string().max(32),
})

export const ArmedEventSchema = z.object({
  type: z.literal('challenge.armed'),
  api_version: z.literal(API_VERSION),
  event_id: z.string().min(8).max(64),
  entry_ref: z.string().min(4).max(32),
  challenge_id: z.string().min(1).max(64),
  bay: BaySchema,
  golfzon_id: z.string().min(1).max(64),
  hole: z.object({
    course: z.string().max(120),
    number: z.number().int().min(1).max(18),
    par: z.literal(3),
    tee: z.string().max(32),
    distance_m: z.number().positive(),
    pin: z.object({ x_m: z.number(), y_m: z.number() }),
  }),
  settings: SettingsSchema,
  settings_hash: Hash,
  armed_at: z.iso.datetime(),
  expires_at: z.iso.datetime(),
})
export type ArmedEvent = z.infer<typeof ArmedEventSchema>

export const LIES = ['cup', 'green', 'fringe', 'approach', 'rough', 'bunker', 'water'] as const
export type Lie = (typeof LIES)[number]

export const ShotEventSchema = z.object({
  type: z.literal('challenge.shot'),
  api_version: z.literal(API_VERSION),
  event_id: z.string().min(8).max(64),
  entry_ref: z.string().min(4).max(32),
  challenge_id: z.string().min(1).max(64),
  shot_id: z.string().min(1).max(64),
  bay_id: z.string().min(1).max(64),
  golfzon_id: z.string().min(1).max(64),
  ball: z.object({
    speed_mps: z.number(),
    launch_deg: z.number(),
    direction_deg: z.number(),
    backspin_rpm: z.number(),
    sidespin_rpm: z.number(),
    spin_axis_deg: z.number(),
  }),
  club: z.object({
    speed_mps: z.number(),
    path_deg: z.number(),
    face_deg: z.number(),
    attack_deg: z.number(),
  }).nullable(),
  flight: z.object({ carry_m: z.number(), total_m: z.number(), apex_m: z.number() }),
  rest: z.object({ x_m: z.number(), y_m: z.number(), lie: z.enum(LIES) }),
  distance_to_pin_cm: z.number().int().min(0),
  holed: z.boolean(),
  settings_hash: Hash,
  nasmo_id: z.string().min(1).max(64),
  sensor_flags: z.array(z.string().max(64)).max(16),
  struck_at: z.iso.datetime(),
})
export type ShotEvent = z.infer<typeof ShotEventSchema>

export const EventSchema = z.discriminatedUnion('type', [ArmedEventSchema, ShotEventSchema])
export type GolfzonEvent = z.infer<typeof EventSchema>

/** What Get Lucky sends Golfzon to arm a bay for a paid entry. */
export interface EntryRequest {
  entry_ref: string
  challenge_id: string
  bay_id: string
  /** The one-time value in the bay's QR, so an entry can only arm the bay the golfer is standing at. */
  nonce: string
  stake: { amount: number; currency: 'USD' }
  prize: { amount: number; currency: 'USD' }
  expires_at: string
}

// ── Settings ─────────────────────────────────────────────────────────────

export function settingsHash(settings: ChallengeSettings): Promise<string> {
  return sha256Hex(canonicalJson(settings))
}

/** Field-by-field differences, worded for a person: "difficulty PRO, needs GTOUR". */
export function settingsDiff(actual: ChallengeSettings, required: ChallengeSettings): string[] {
  return (Object.keys(required) as (keyof ChallengeSettings)[])
    .filter(k => actual[k] !== required[k])
    .map(k => `${k} ${String(actual[k])}, needs ${String(required[k])}`)
}

// ── Signature header ─────────────────────────────────────────────────────

export interface ParsedSignature { t: number; kid: string; sig: Uint8Array }

export function formatSignatureHeader(t: number, kid: string, sigB64url: string): string {
  return `t=${t},kid=${kid},ed25519=${sigB64url}`
}

export function parseSignatureHeader(header: string | null | undefined): ParsedSignature | null {
  if (!header) return null
  const parts = Object.fromEntries(
    header.split(',').map(p => {
      const i = p.indexOf('=')
      return i < 0 ? [p.trim(), ''] : [p.slice(0, i).trim(), p.slice(i + 1).trim()]
    }),
  )
  const t = Number(parts.t)
  if (!Number.isInteger(t) || t <= 0 || !parts.kid || !parts.ed25519) return null
  try {
    const sig = b64urlDecode(parts.ed25519)
    return sig.length === 64 ? { t, kid: parts.kid, sig } : null
  } catch {
    return null
  }
}

/** The bytes that are signed: the timestamp, a dot, and the body exactly as sent. */
export const signedMessage = (t: number, raw: string): Uint8Array => utf8(`${t}.${raw}`)

// ── The receiver ─────────────────────────────────────────────────────────

export type Ed25519Verify = (sig: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => Promise<boolean>

export interface Check { ok: boolean; label: string; detail?: string }

export type VerdictCode =
  | 'ok'
  | 'bad_signature_header'
  | 'unknown_key'
  | 'bad_signature'
  | 'stale'
  | 'bad_json'
  | 'bad_schema'
  | 'unknown_challenge'
  | 'inconsistent'

/** What the receiver does with an accepted event, before the ledger has its say. */
export type Effect = 'arm' | 'refund' | 'miss' | 'claim'

export interface Verdict {
  status: number
  accepted: boolean
  code: VerdictCode
  message: string
  checks: Check[]
  event_type?: GolfzonEvent['type']
  event_id?: string
  entry_ref?: string
  effect?: Effect
}

export interface CheckEventInput {
  raw: string
  header: string | null
  nowMs: number
  verify: Ed25519Verify
  /** Defaults to Golfzon's published keys. */
  keys?: Record<string, Uint8Array>
}

function reject(status: number, code: VerdictCode, message: string, checks: Check[]): Verdict {
  return { status, accepted: false, code, message, checks }
}

export async function checkEvent({ raw, header, nowMs, verify, keys = PUBLIC_KEYS }: CheckEventInput): Promise<Verdict> {
  const checks: Check[] = []

  const sig = parseSignatureHeader(header)
  if (!sig) {
    checks.push({ ok: false, label: 'Signature header present and well formed' })
    return reject(400, 'bad_signature_header', `Missing or malformed ${SIGNATURE_HEADER} header.`, checks)
  }

  const publicKey = keys[sig.kid]
  if (!publicKey) {
    checks.push({ ok: false, label: `Signed with a GOLFZON key`, detail: `unknown key id ${sig.kid}` })
    return reject(401, 'unknown_key', `Key ${sig.kid} is not one of GOLFZON's published keys.`, checks)
  }

  const valid = await verify(sig.sig, signedMessage(sig.t, raw), publicKey).catch(() => false)
  checks.push({ ok: valid, label: `Signed by GOLFZON (key ${sig.kid})`, detail: valid ? undefined : 'the body is not what was signed' })
  if (!valid) return reject(401, 'bad_signature', 'The signature does not match the body. Nothing was changed.', checks)

  const ageS = Math.abs(nowMs / 1000 - sig.t)
  const fresh = ageS <= TIMESTAMP_TOLERANCE_S
  checks.push({ ok: fresh, label: `Sent within ${TIMESTAMP_TOLERANCE_S / 60} minutes`, detail: fresh ? undefined : `${Math.round(ageS)} s old` })
  if (!fresh) return reject(401, 'stale', 'The signature is too old to accept. GOLFZON should re-sign and resend.', checks)

  let json: unknown
  try {
    json = JSON.parse(raw)
  } catch {
    checks.push({ ok: false, label: 'Valid JSON' })
    return reject(400, 'bad_json', 'The body is not JSON.', checks)
  }
  const parsed = EventSchema.safeParse(json)
  checks.push({ ok: parsed.success, label: `Matches the v${API_VERSION} contract`, detail: parsed.success ? undefined : parsed.error.issues[0]?.path.join('.') })
  if (!parsed.success) return reject(422, 'bad_schema', 'The event does not match the contract.', checks)
  const event = parsed.data
  const base = { event_type: event.type, event_id: event.event_id, entry_ref: event.entry_ref }

  if (event.challenge_id !== CHALLENGE.challenge_id) {
    checks.push({ ok: false, label: 'For this week\'s challenge', detail: event.challenge_id })
    return { ...reject(422, 'unknown_challenge', `Unknown challenge ${event.challenge_id}.`, checks), ...base }
  }

  const requiredHash = await settingsHash(CHALLENGE.settings)

  if (event.type === 'challenge.armed') {
    const reportedHash = await settingsHash(event.settings)
    if (reportedHash !== event.settings_hash) {
      checks.push({ ok: false, label: 'Settings hash matches the settings sent' })
      return { ...reject(422, 'inconsistent', 'settings_hash does not match settings.', checks), ...base }
    }
    const diff = settingsDiff(event.settings, CHALLENGE.settings)
    const match = diff.length === 0 && reportedHash === requiredHash
    checks.push({ ok: match, label: 'Bay settings match the challenge', detail: match ? `sha256 ${requiredHash.slice(0, 12)}…` : diff.join('; ') })
    return match
      ? { status: 200, accepted: true, code: 'ok', message: 'Bay armed for the challenge.', checks, ...base, effect: 'arm' }
      : { status: 200, accepted: true, code: 'ok', message: 'Recorded. The bay is not on the challenge settings, so the entry is refunded.', checks, ...base, effect: 'refund' }
  }

  const bound = event.settings_hash === requiredHash
  checks.push({ ok: bound, label: 'Shot played on the challenge settings', detail: bound ? undefined : 'settings_hash differs' })
  if (!bound) return { ...reject(422, 'inconsistent', 'The shot was not played on the challenge settings.', checks), ...base }

  const consistent = event.holed === (event.distance_to_pin_cm === 0) && event.holed === (event.rest.lie === 'cup')
  checks.push({ ok: consistent, label: 'Result is self-consistent', detail: consistent ? undefined : 'holed, distance and lie disagree' })
  if (!consistent) return { ...reject(422, 'inconsistent', 'holed, distance_to_pin_cm and rest.lie disagree.', checks), ...base }

  return event.holed
    ? { status: 200, accepted: true, code: 'ok', message: 'Hole-in-one recorded. Claim opened.', checks, ...base, effect: 'claim' }
    : { status: 200, accepted: true, code: 'ok', message: 'Miss recorded. Entry settled.', checks, ...base, effect: 'miss' }
}

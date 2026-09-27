/**
 * Golfzon's published signing keys, as the receiver knows them.
 *
 * In the demo there is one key and we made it ourselves; its private half
 * is in ./demo-golfzon-key.ts so the browser can play Golfzon's part. In
 * production Golfzon generates the key pair, keeps the private key, and
 * publishes this list (a JWKS URL), so a rotated key is a new `kid` here.
 */
import { b64urlDecode } from './bytes'

export interface PublicJwk {
  kty: 'OKP'
  crv: 'Ed25519'
  x: string
  kid: string
  use: 'sig'
  alg: 'EdDSA'
}

export const DEMO_KID = 'gz-demo-2026-09'

export const GOLFZON_JWKS: { keys: PublicJwk[] } = {
  keys: [
    { kty: 'OKP', crv: 'Ed25519', x: 'VdbiaOGsP34fPxxOIaWkkK5ywQgV_ve8D83Fi5wiwQ0', kid: DEMO_KID, use: 'sig', alg: 'EdDSA' },
  ],
}

export const PUBLIC_KEYS: Record<string, Uint8Array> = Object.fromEntries(
  GOLFZON_JWKS.keys.map(k => [k.kid, b64urlDecode(k.x)]),
)

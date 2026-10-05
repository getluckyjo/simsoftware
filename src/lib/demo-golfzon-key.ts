/**
 * The PRIVATE half of the demo signing key, so the browser can play
 * Golfzon's servers. It is public on purpose: it signs demo events and
 * nothing else. In production this key exists only inside Golfzon.
 */
import { b64urlDecode } from './bytes'
import { DEMO_KID } from './keys'

export const DEMO_SIGNING_KEY = {
  kid: DEMO_KID,
  /** Ed25519 seed (JWK `d`). */
  secret: b64urlDecode('UpfmBrTeu26T6tAAv3M5Zd7IJC7wOmmXMzkXC79Uhxw'),
}

import { createPublicKey, verify } from 'node:crypto'
import { b64urlEncode } from './bytes'
import type { Ed25519Verify } from './protocol'

/** Ed25519 verification with Node's crypto, from the raw 32-byte public key. */
export const nodeVerify: Ed25519Verify = async (sig, message, publicKey) => {
  const key = createPublicKey({ key: { kty: 'OKP', crv: 'Ed25519', x: b64urlEncode(publicKey) }, format: 'jwk' })
  return verify(null, message, key, sig)
}

/**
 * The two Ed25519 verifiers `checkEvent` can be given. The server uses
 * Node's crypto (OpenSSL); the browser, when it cannot reach the server,
 * uses @noble/ed25519. Two implementations agreeing on every event is part
 * of the point: the signature is a standard, not our code.
 */
import { verifyAsync } from '@noble/ed25519'
import type { Ed25519Verify } from './protocol'

export const browserVerify: Ed25519Verify = (sig, message, publicKey) => verifyAsync(sig, message, publicKey)

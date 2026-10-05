/**
 * POST /api/v0/golfzon/events — the endpoint Golfzon's servers would call.
 *
 * Checks the Golfzon-Signature header against Golfzon's published key over
 * the raw body, then the timestamp, the v0.1 shape and the challenge
 * settings (src/lib/protocol.ts). Answers with what it decided. In the demo
 * it is stateless: duplicate events and one-shot-per-entry are the
 * ledger's job, which the demo page keeps (src/lib/ledger.ts).
 *
 *   curl -X POST $URL/api/v0/golfzon/events -H 'Golfzon-Signature: …' --data-binary @event.json
 */
import { checkEvent, SIGNATURE_HEADER } from '@/lib/protocol'
import { nodeVerify } from '@/lib/verify-node'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_BODY_BYTES = 64 * 1024

export async function POST(request: Request) {
  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) {
    return Response.json({ status: 413, accepted: false, code: 'too_large', message: 'Body over 64 KB.', checks: [] }, { status: 413 })
  }
  const verdict = await checkEvent({ raw, header: request.headers.get(SIGNATURE_HEADER), nowMs: Date.now(), verify: nodeVerify })
  return Response.json({ ...verdict, verified_by: 'server' }, { status: verdict.status })
}

export function GET() {
  return Response.json(
    { error: 'POST a signed GOLFZON event here. The contract is at /spec; the public keys at /api/v0/golfzon/keys.' },
    { status: 405, headers: { Allow: 'POST' } },
  )
}

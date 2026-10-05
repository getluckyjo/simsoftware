/** GET /api/v0/golfzon/keys — the public keys that Golfzon events are checked against, as a JWKS. */
import { GOLFZON_JWKS } from '@/lib/keys'

export function GET() {
  return Response.json(GOLFZON_JWKS, { headers: { 'Cache-Control': 'public, max-age=300' } })
}

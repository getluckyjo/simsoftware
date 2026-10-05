/**
 * GET /api/v0/challenge — this week's challenge and the hash of its locked
 * settings. Also returns the server's clock, which the demo page uses so a
 * laptop with a wrong clock does not sign events the server calls stale.
 */
import { CHALLENGE, challengeWeek, SIM_TIERS } from '@/lib/challenge'
import { settingsHash } from '@/lib/protocol'

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date()
  return Response.json({
    challenge: { ...CHALLENGE, ...challengeWeek(now), settings_hash: await settingsHash(CHALLENGE.settings) },
    tiers: SIM_TIERS,
    server_time: now.toISOString(),
  })
}

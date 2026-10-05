/**
 * The challenge on offer this week, the bay in the demo, and the simulator
 * stake tiers.
 *
 * Tiers are in US dollars for the Golfzon meeting, up to $100,000 for a
 * $100 swing. Every tier pays 1,000× the stake, the top multiple of the
 * on-course tiers and the $1 → $1,000 in the simulator plan. They are
 * illustrative: simulator tiers get priced from Golfzon's ace data
 * (docs/golfzon-integration.md, section 8).
 */
import type { ChallengeSettings } from './protocol'

export interface SimTier {
  id: string
  stakeUsd: number
  prizeUsd: number
}

export const SIM_TIERS: SimTier[] = [
  { id: 'sim_1', stakeUsd: 1, prizeUsd: 1_000 },
  { id: 'sim_5', stakeUsd: 5, prizeUsd: 5_000 },
  { id: 'sim_20', stakeUsd: 20, prizeUsd: 20_000 },
  { id: 'sim_50', stakeUsd: 50, prizeUsd: 50_000 },
  { id: 'sim_100', stakeUsd: 100, prizeUsd: 100_000 },
]

export const TOP_PRIZE_USD = Math.max(...SIM_TIERS.map(t => t.prizeUsd))

export const DEFAULT_TIER_ID = 'sim_5'

export function tierById(id: string): SimTier | undefined {
  return SIM_TIERS.find(t => t.id === id)
}

/** The settings Golfzon locks for every entry. G-Tour is the only level with no correction near the cup. */
export const CHALLENGE_SETTINGS: ChallengeSettings = {
  difficulty: 'GTOUR',
  near_cup_assist: false,
  green_speed_m: 3.0,
  green_firmness: 'firm',
  wind_speed_mps: 2.7,
  wind_from_deg: 270,
  altitude_m: 0,
  weather: 'clear',
  mulligans: 0,
  concede_m: 0,
}

/** What a venue that "helps" its players might set instead (the 2022 Korean case). */
export const LOWERED_SETTINGS: ChallengeSettings = {
  ...CHALLENGE_SETTINGS,
  difficulty: 'PRO',
  near_cup_assist: true,
  green_firmness: 'medium',
}

export const CHALLENGE = {
  /** Stable, so a link opened in any week signs and verifies the same. */
  challenge_id: 'gl-gz-hole-7',
  label: 'Hole of the week',
  course: 'Get Lucky Demo Links',
  hole: 7,
  par: 3 as const,
  tee: 'Black',
  /** Tee to pin. 170 yards over water: a par 3 over the 140 m the on-course challenge requires. */
  distance_m: 155.4,
  /** Tee at the origin, y down the hole, x to the right. The pin is left, where the photo's flag is (src/lib/course.ts). */
  pin: { x_m: -10.4, y_m: 155 },
  pinLabel: 'Left',
  settings: CHALLENGE_SETTINGS,
  /** Minutes a paid entry stays armed before it is refunded. */
  entryWindowMin: 15,
}

/** The challenge runs Monday to Sunday (UTC); this is the week that contains `at`. */
export function challengeWeek(at: Date): { valid_from: string; valid_to: string } {
  const day = (at.getUTCDay() + 6) % 7
  const from = Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate() - day)
  return {
    valid_from: new Date(from).toISOString(),
    valid_to: new Date(from + 7 * 86_400_000 - 1000).toISOString(),
  }
}

export const VENUE = { id: 'GZ-DEMO-01', name: 'Demo venue' }

export const BAY = {
  id: 'GZ-DEMO-01-B2',
  venue_id: VENUE.id,
  venue_name: VENUE.name,
  number: 2,
  sensor_model: 'TwoVision NX',
  sensor_serial: 'TVNX-DEMO-0002',
  software_version: '3.2.1',
}

/** The GOLFZON ID the demo golfer is logged in with at the bay. */
export const DEMO_GOLFZON_ID = 'gz_demo_7731'

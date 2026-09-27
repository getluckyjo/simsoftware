/**
 * The challenge on offer this week, the bay in the demo, and the simulator
 * stake tiers.
 *
 * Tiers are in US dollars for the Golfzon meeting. Every tier pays 1,000×
 * the stake, the top multiple of the on-course tiers and the $1 → $1,000
 * in the simulator plan. They are illustrative: simulator tiers get priced
 * from Golfzon's ace data (docs/golfzon-integration.md, section 8).
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
]

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
  challenge_id: 'gl-2026-w40',
  label: 'Hole of the week',
  week: 40,
  course: 'Get Lucky Demo Links',
  hole: 7,
  par: 3 as const,
  tee: 'Black',
  /** Tee to pin. 168 yards: a par 3 over the 140 m the on-course challenge requires. */
  distance_m: 153.6,
  /** Tee at the origin, y down the hole, x to the right. The pin is back left. */
  pin: { x_m: -2.4, y_m: 153.6 },
  pinLabel: 'Back left',
  settings: CHALLENGE_SETTINGS,
  valid_from: '2026-09-28T00:00:00Z',
  valid_to: '2026-10-04T23:59:59Z',
  /** Minutes a paid entry stays armed before it is refunded. */
  entryWindowMin: 15,
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

/**
 * A plausible iron shot for the demo, standing in for what a Golfzon
 * sensor measures and its software simulates. Launch numbers are derived
 * from where the ball lands so the data strip and the picture agree:
 * about 168 yards is a 6- or 7-iron, roughly 120 mph ball speed, 17° launch,
 * 6,800 rpm.
 *
 *   natural  the handicap sets the spread; an ace is possible but rare
 *   close    finishes 0.6–2.2 m from the pin (for the leaderboard story)
 *   ace      lands short and rolls in
 */
import { CHALLENGE } from './challenge'
import { CUP_RADIUS_M, lieAt, type Pt } from './course'
import type { Lie } from './protocol'

export type ShotMode = 'natural' | 'close' | 'ace'

export interface SimulatedShot {
  launch: {
    ballSpeedMps: number
    launchDeg: number
    directionDeg: number
    backspinRpm: number
    sidespinRpm: number
    spinAxisDeg: number
    clubSpeedMps: number
    pathDeg: number
    faceDeg: number
    attackDeg: number
  }
  /** Where the ball first lands; flight curves from the start line into it. */
  landing: Pt
  /** Lateral metres of the landing point that come from the start line (the rest is curve and wind). */
  startLineX: number
  apexM: number
  carryM: number
  rest: Pt
  totalM: number
  lie: Lie
  holed: boolean
  distanceToPinCm: number
  /** Metres the ball hops after landing, for the animation. */
  bounceM: number
}

export type Rng = () => number

/** Deterministic generator for tests. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function normal(rng: Rng, mean = 0, sd = 1): number {
  const u = Math.max(rng(), 1e-12), v = rng()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])
const DEG = 180 / Math.PI
const MPS_PER_MPH = 0.44704
const YD_PER_M = 1.09361

/** Distance from p to the segment a→b. */
function segmentDistance(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2, 0, 1)
  return dist(p, [a[0] + t * dx, a[1] + t * dy])
}

function rollFor(lie: Lie, rng: Rng): number {
  switch (lie) {
    case 'green': case 'fringe': return clamp(normal(rng, 3.2, 0.9), 0.8, 6)
    case 'approach': return clamp(normal(rng, 4, 1.2), 1, 7)
    case 'rough': return clamp(normal(rng, 1, 0.4), 0.2, 2)
    case 'bunker': return 0.25
    default: return 0
  }
}

export function simulateShot({ handicap, mode, rng = Math.random }: { handicap: number; mode: ShotMode; rng?: Rng }): SimulatedShot {
  const pin: Pt = [CHALLENGE.pin.x_m, CHALLENGE.pin.y_m]
  let landing: Pt
  let rest: Pt
  let lie: Lie
  let holed = false

  if (mode === 'ace' || mode === 'close') {
    // Pick the finish first, then back the landing out along the line of play.
    const roll = clamp(normal(rng, 3, 0.4), 2.2, 3.8)
    let finish: Pt = pin
    if (mode === 'close') {
      // Off the line from the tee, so the roll never passes over the cup.
      for (let i = 0; i < 20; i++) {
        const r = 0.6 + rng() * 1.6
        const a = rng() < 0.5 ? -Math.PI / 2 + (rng() - 0.5) * 1.6 : Math.PI / 2 + (rng() - 0.5) * 1.6
        const heading = Math.atan2(pin[0], pin[1])
        const cand: Pt = [pin[0] + r * Math.sin(heading + a), pin[1] + r * Math.cos(heading + a)]
        const h = Math.atan2(cand[0], cand[1])
        const land: Pt = [cand[0] - roll * Math.sin(h), cand[1] - roll * Math.cos(h)]
        if (segmentDistance(pin, land, cand) > 0.25 && lieAt(cand) === 'green') { finish = cand; break }
      }
    }
    const h = Math.atan2(finish[0], finish[1])
    landing = [finish[0] - roll * Math.sin(h), finish[1] - roll * Math.cos(h)]
    rest = finish
    holed = mode === 'ace'
    lie = holed ? 'cup' : 'green'
  } else {
    const hcp = clamp(handicap, 0, 36)
    const aim: Pt = [pin[0] - 1.8, pin[1] - 3]                   // plays for the roll, and aims into the wind
    const carryErr = normal(rng, -3 - 0.25 * hcp, 6 + 0.6 * hcp)  // amateurs come up short
    const sideErr = normal(rng, 2.4, 3 + 0.55 * hcp)              // 6 mph from the left pushes it right
    landing = [aim[0] + sideErr, aim[1] + carryErr]
    const landLie = lieAt(landing)
    const roll = rollFor(landLie, rng)
    const h = Math.atan2(landing[0], landing[1]) + normal(rng, 0, 0.05)
    rest = [landing[0] + roll * Math.sin(h), landing[1] + roll * Math.cos(h)]
    if (landLie === 'water') rest = landing
    holed = roll > 0 && segmentDistance(pin, landing, rest) <= CUP_RADIUS_M && lieAt(pin) === 'green'
    if (holed) rest = pin
    lie = holed ? 'cup' : landLie === 'water' ? 'water' : lieAt(rest)
  }

  const carryM = Math.hypot(landing[0], landing[1])
  const startLineX = landing[0] * 0.45
  const curveM = landing[0] - startLineX - 2.4                    // what the spin did, net of the wind
  const backspin = clamp(normal(rng, 6800, 420), 5600, 8200)
  const spinAxisDeg = clamp((curveM / Math.max(carryM, 1)) * 520, -24, 24)
  const directionDeg = Math.atan2(startLineX, landing[1]) * DEG
  const ballMph = carryM * YD_PER_M * 0.716 + normal(rng, 0, 1)
  const faceDeg = directionDeg * 0.85
  const launchDeg = clamp(normal(rng, 17.2, 1.3), 13, 22)

  const distanceToPinCm = holed ? 0 : Math.max(1, Math.round(dist(rest, pin) * 100))

  return {
    launch: {
      ballSpeedMps: ballMph * MPS_PER_MPH,
      launchDeg,
      directionDeg,
      backspinRpm: backspin,
      sidespinRpm: backspin * Math.tan(spinAxisDeg / DEG),
      spinAxisDeg,
      clubSpeedMps: (ballMph / clamp(normal(rng, 1.34, 0.02), 1.28, 1.4)) * MPS_PER_MPH,
      pathDeg: faceDeg - spinAxisDeg / 1.8,
      faceDeg,
      attackDeg: clamp(normal(rng, -3.8, 0.8), -7, -1),
    },
    landing,
    startLineX,
    apexM: clamp(26 + (launchDeg - 17.2) * 1.4 + normal(rng, 0, 1), 20, 34),
    carryM,
    rest,
    totalM: Math.hypot(rest[0], rest[1]),
    lie,
    holed,
    distanceToPinCm,
    bounceM: lie === 'water' ? 0 : clamp(0.9 - (lie === 'bunker' ? 0.6 : 0), 0.2, 1.2),
  }
}

/** Only balls on the green go on the closest-to-the-pin leaderboard, as in most nearest-the-pin contests. */
export function isRanked(shot: Pick<SimulatedShot, 'lie' | 'holed'>): boolean {
  return shot.holed || shot.lie === 'green'
}


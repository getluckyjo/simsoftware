import { describe, expect, it } from 'vitest'
import { CHALLENGE, SIM_TIERS, TOP_PRIZE_USD } from '@/lib/challenge'
import { BUNKERS, GREEN, lieAt, worldToPhoto, type Pt } from '@/lib/course'

const centroid = (poly: Pt[]): Pt => [poly.reduce((s, p) => s + p[0], 0) / poly.length, poly.reduce((s, p) => s + p[1], 0) / poly.length]

describe('the hole, traced from the bay photo', () => {
  it('puts the pin in the middle of the green, on the photo and on the ground', () => {
    const pin: Pt = [CHALLENGE.pin.x_m, CHALLENGE.pin.y_m]
    expect(lieAt(pin)).toBe('green')
    const [cx, cy] = centroid(GREEN)
    expect(Math.hypot(pin[0] - cx, pin[1] - cy)).toBeLessThan(1)
    const [x, y] = worldToPhoto(pin)
    expect(Math.hypot(x - 325, y - 395)).toBeLessThan(6)
    expect(Math.hypot(pin[0], pin[1])).toBeCloseTo(CHALLENGE.distance_m, 1)
    expect(Math.round(CHALLENGE.distance_m * 1.09361)).toBe(164)
  })

  it('is a carry over water to a green with bunkers behind and to the right', () => {
    expect(lieAt([0, 60])).toBe('water')
    expect(lieAt([0, 125])).toBe('water')
    expect(lieAt(centroid(GREEN))).toBe('green')
    for (const b of BUNKERS) expect(lieAt(centroid(b))).toBe('bunker')
    expect(lieAt([0, 195])).toBe('rough')
  })

  it('maps the green\'s ends to where they are in the photo', () => {
    const [lx, ly] = worldToPhoto([-16, 150]), [rx, ry] = worldToPhoto([16, 150])
    expect(Math.hypot(lx - 180, ly - 402)).toBeLessThan(1)
    expect(Math.hypot(rx - 472, ry - 392)).toBeLessThan(1)
  })
})

describe('tiers', () => {
  it('top out at $100,000 for $100, every tier paying 1,000×', () => {
    expect(TOP_PRIZE_USD).toBe(100_000)
    expect(SIM_TIERS.at(-1)).toMatchObject({ stakeUsd: 100, prizeUsd: 100_000 })
    for (const t of SIM_TIERS) expect(t.prizeUsd).toBe(t.stakeUsd * 1000)
  })
})

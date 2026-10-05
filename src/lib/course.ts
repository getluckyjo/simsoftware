/**
 * The demo hole, in metres: a par 3 over water to a wide, shallow green
 * behind a rock wall, with bunkers back left, back right and right. The
 * tee is at the origin, y runs down the hole and x to the right.
 *
 * The layout is traced from the bay's photograph of the hole
 * (public/bay/hole-7.jpg): each outline was marked on the photo in pixels
 * and mapped back to the ground with the homography below, so the lie the
 * shot model reports (water, bunker, green) is what the screen shows. The
 * same homography puts the ball, the pin and the distance line on the photo.
 */
import type { Lie } from './protocol'

export type Pt = [number, number]

/** World metres → photo pixels (1000 × 563), fitted on the green's four extremes. */
export const PHOTO_H = [
  [3.313609, -1.09315, 291.058799],
  [-0.495055, -2.637931, 553.188364],
  [-0.000935, -0.004023, 1],
] as const

export const PHOTO_SIZE = { w: 1000, h: 563 }

export function worldToPhoto([x, y]: Pt): Pt {
  const h = PHOTO_H
  const w = h[2][0] * x + h[2][1] * y + h[2][2]
  return [(h[0][0] * x + h[0][1] * y + h[0][2]) / w, (h[1][0] * x + h[1][1] * y + h[1][2]) / w]
}

/** Pixels per metre on the ground at a point, across the line of play. */
export function photoScaleAt(p: Pt): number {
  const a = worldToPhoto([p[0] - 0.5, p[1]]), b = worldToPhoto([p[0] + 0.5, p[1]])
  return Math.hypot(b[0] - a[0], b[1] - a[1])
}

export const GREEN: Pt[] = [
  [-16, 150], [-14.4, 154.4], [-11.4, 157.6], [-6.6, 159.6], [-0.6, 160.7], [5.1, 161.1],
  [10, 159.9], [13.6, 157], [15.5, 152.5], [16.2, 147], [14.5, 143.2], [9.8, 141.2],
  [2.9, 139.7], [-4.4, 140], [-11.8, 142.2], [-15.2, 145.7],
]

/** The fringe: the green grown by about a metre and a half all round. */
export const FRINGE: Pt[] = grow(GREEN, 1.5)

export const BUNKERS: Pt[][] = [
  // back left, two lobes
  [[-12.4, 159.4], [-11.2, 165.3], [-9.3, 167.6], [-7.5, 166.8], [-6.4, 163.8], [-5.6, 166], [-4.2, 167.1],
   [-2.9, 165.6], [-2.5, 162.1], [-3, 159.1], [-5.1, 157.5], [-8.8, 156.9]],
  // back right, the three-lobed one
  [[7.7, 165.5], [8.9, 166.4], [10.6, 165.4], [12, 163], [12.5, 164.6], [13.6, 165.2], [14.9, 163.2],
   [16.3, 160.2], [18.2, 158.2], [19.2, 155.3], [18.5, 153.5], [16.4, 154.1], [14.5, 156.3], [12.5, 159],
   [9.8, 161.1], [8.2, 163.3]],
  // right
  [[23.9, 166.2], [24.4, 167.3], [26.8, 165.8], [29.8, 163.2], [32.6, 161.3], [34.2, 158.9], [34.2, 156.7],
   [31.8, 157.3], [28.6, 160], [25.7, 163]],
]

/** The rock wall that holds the green above the water, left end to right. */
export const WALL: Pt[] = [
  [-20, 163.5], [-20.6, 157], [-21.2, 147.3], [-21.6, 138.9], [-20.5, 133.5], [-15.1, 131.9], [-8.3, 132.9],
  [-1.7, 133.3], [4.5, 134.7], [10.4, 137], [16, 138.3], [20.6, 138.2], [24.6, 135.5], [29.3, 131.2],
  [37.2, 124.7], [45.6, 118.3], [55, 110.6], [78.9, 88.7], [110, 59], [130, 40],
]

/** Everything between the tee and the wall is water, and so is the left side. */
export const WATER: Pt[] = [[-60, 168], ...WALL, [130, 18], [-60, 18]]

export const CUP_RADIUS_M = 0.054

export function inPolygon(p: Pt, poly: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

export function lieAt(p: Pt): Exclude<Lie, 'cup'> {
  if (inPolygon(p, WATER)) return 'water'
  if (BUNKERS.some(b => inPolygon(p, b))) return 'bunker'
  if (inPolygon(p, GREEN)) return 'green'
  if (inPolygon(p, FRINGE)) return 'fringe'
  return 'rough'
}

/** Push each point of a convex-ish outline out from its centroid by `m` metres. */
function grow(poly: Pt[], m: number): Pt[] {
  const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length
  const cy = poly.reduce((s, p) => s + p[1], 0) / poly.length
  return poly.map(([x, y]) => {
    const d = Math.hypot(x - cx, y - cy) || 1
    return [x + ((x - cx) / d) * m, y + ((y - cy) / d) * m] as Pt
  })
}

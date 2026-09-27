/**
 * The demo hole, in metres. The tee is at the origin, y runs down the hole
 * and x to the right. The shot model uses it to find the lie; the bay
 * screen draws it.
 */
import type { Lie } from './protocol'

export interface Ellipse { cx: number; cy: number; rx: number; ry: number; rot?: number }
export type Pt = [number, number]

export const GREEN: Ellipse = { cx: 0, cy: 150, rx: 11, ry: 14 }
export const FRINGE: Ellipse = { cx: 0, cy: 150, rx: 12.6, ry: 15.8 }
export const APPROACH: Ellipse = { cx: 1, cy: 133, rx: 10, ry: 5 }
export const BUNKERS: Ellipse[] = [
  { cx: 11, cy: 139, rx: 4.6, ry: 2.8, rot: -0.45 },
  { cx: -11.6, cy: 161, rx: 4.2, ry: 2.5, rot: 0.5 },
  { cx: -14, cy: 146, rx: 2.5, ry: 4.6, rot: 0.1 },
]
export const WATER: Pt[] = [
  [-28, 104], [-24, 97], [-12, 93], [2, 95], [13, 99], [19, 106], [20, 116],
  [15, 125], [6, 129.5], [-6, 129], [-16, 126], [-24, 119], [-29, 111],
]
export const CUP_RADIUS_M = 0.054

export function inEllipse(p: Pt, e: Ellipse, grow = 0): boolean {
  const c = Math.cos(-(e.rot ?? 0)), s = Math.sin(-(e.rot ?? 0))
  const dx = p[0] - e.cx, dy = p[1] - e.cy
  const x = dx * c - dy * s, y = dx * s + dy * c
  return (x / (e.rx + grow)) ** 2 + (y / (e.ry + grow)) ** 2 <= 1
}

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
  if (BUNKERS.some(b => inEllipse(p, b))) return 'bunker'
  if (inEllipse(p, GREEN)) return 'green'
  if (inEllipse(p, FRINGE)) return 'fringe'
  if (inEllipse(p, APPROACH)) return 'approach'
  return 'rough'
}

/** Points around an ellipse, for drawing and clipping. */
export function ellipsePoints(e: Ellipse, n = 48): Pt[] {
  const c = Math.cos(e.rot ?? 0), s = Math.sin(e.rot ?? 0)
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2
    const x = Math.cos(a) * e.rx, y = Math.sin(a) * e.ry
    return [e.cx + x * c - y * s, e.cy + x * s + y * c] as Pt
  })
}

export interface Tree { x: number; y: number; h: number; r: number; tone: number }

/** Tree lines down both sides and behind the green, the same every load. */
export const TREES: Tree[] = (() => {
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const out: Tree[] = []
  for (let y = 10; y < 215; y += 5.5) {
    out.push({ x: -30 - rnd() * 34, y: y + rnd() * 4, h: 11 + rnd() * 7, r: 3.2 + rnd() * 2.2, tone: rnd() })
    out.push({ x: 29 + rnd() * 36, y: y + rnd() * 4, h: 11 + rnd() * 7, r: 3.2 + rnd() * 2.2, tone: rnd() })
  }
  for (let x = -60; x <= 60; x += 6) {
    out.push({ x: x + rnd() * 3, y: 184 + rnd() * 26, h: 12 + rnd() * 8, r: 3.5 + rnd() * 2.5, tone: rnd() })
  }
  return out
})()

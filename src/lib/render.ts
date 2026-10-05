/**
 * Draws the bay screen on a canvas from two photographs:
 *
 *   attract  a GOLFZON course render, while the bay waits for a golfer
 *   hole     the challenge hole, a par 3 over water; the ball flies in from
 *            the tee below the frame, the view pushes in on the green as it
 *            comes down, and it lands and rolls where the shot model says
 *
 * Positions on the ground go through the homography in ./course.ts, so the
 * ball, the pin and the distance line sit where they are on the photo. The
 * flight itself is a screen-space arc (the tee is behind the camera).
 */
import { CHALLENGE } from './challenge'
import { PHOTO_SIZE, photoScaleAt, worldToPhoto, type Pt } from './course'
import type { SimulatedShot } from './shot'

export const ATTRACT_IMG = { src: '/bay/attract.jpg', w: 1377, h: 687 }
export const HOLE_IMG = { src: '/bay/hole-7.jpg', w: PHOTO_SIZE.w, h: PHOTO_SIZE.h }

/** What part of a photo is on screen: a focus point in photo pixels and a zoom over "cover". */
export interface View { cx: number; cy: number; zoom: number }
interface Xform { s: number; ox: number; oy: number }

const PIN: Pt = [CHALLENGE.pin.x_m, CHALLENGE.pin.y_m]
export const PIN_PX: Pt = worldToPhoto(PIN)
const GREEN_CENTRE_PX: Pt = [326, 392]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp01 = (t: number) => Math.min(1, Math.max(0, t))
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

export const WIDE_VIEW: View = { cx: 360, cy: 330, zoom: 1 }

/** Close on the green: wide enough for the bunkers behind it and the wall in front. */
export function greenView(w: number, h: number): View {
  const s0 = Math.max(w / HOLE_IMG.w, h / HOLE_IMG.h)
  const zoom = Math.max(1, Math.min(2, w / (s0 * 430), h / (s0 * 230)))
  return { cx: GREEN_CENTRE_PX[0], cy: GREEN_CENTRE_PX[1], zoom }
}

/** Close on what matters for this shot: the flag and wherever the ball came down and stopped. */
export function shotView(w: number, h: number, shot: SimulatedShot): View {
  const pts = [PIN_PX, [PIN_PX[0], PIN_PX[1] - 30] as Pt, groundPx(shot.landing), groundPx(shot.rest)]
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1])
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  const s0 = Math.max(w / HOLE_IMG.w, h / HOLE_IMG.h)
  const zoom = Math.max(1, Math.min(1.85, w / (s0 * (x1 - x0 + 300)), h / (s0 * (y1 - y0 + 220))))
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, zoom }
}

export function lerpView(a: View, b: View, t: number): View {
  return { cx: lerp(a.cx, b.cx, t), cy: lerp(a.cy, b.cy, t), zoom: lerp(a.zoom, b.zoom, t) }
}

function cover(img: { w: number; h: number }, v: View, w: number, h: number): Xform {
  const s = Math.max(w / img.w, h / img.h) * v.zoom
  const ox = Math.min(0, Math.max(w - img.w * s, w / 2 - v.cx * s))
  const oy = Math.min(0, Math.max(h - img.h * s, h / 2 - v.cy * s))
  return { s, ox, oy }
}

const toCanvas = (x: Xform, p: Pt): Pt => [p[0] * x.s + x.ox, p[1] * x.s + x.oy]

function drawPhoto(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, size: { w: number; h: number }, x: Xform) {
  if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, x.ox, x.oy, size.w * x.s, size.h * x.s)
  else { ctx.fillStyle = '#3b6a31'; ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height) }
}

/** The waiting screen: the course render with a slow drift, as a bay's attract loop does. */
export function drawAttract(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, w: number, h: number, time: number) {
  const v: View = { cx: 690 + Math.sin(time * 0.09) * 60, cy: 360, zoom: 1.06 + Math.sin(time * 0.13) * 0.04 }
  drawPhoto(ctx, img, ATTRACT_IMG, cover(ATTRACT_IMG, v, w, h))
}

// ── The shot on the photo ───────────────────────────────────────────────

/** Where a ball on the ground appears on the photo, kept inside the frame. */
export function groundPx(p: Pt): Pt {
  const [x, y] = worldToPhoto(p)
  return [Math.min(HOLE_IMG.w - 2, Math.max(2, x)), Math.min(HOLE_IMG.h - 2, Math.max(2, y))]
}

/** In flight, t from 0 (struck, below the frame) to 1 (landing). Photo pixels, and the ball's radius in photo pixels. */
export function flightPoint(shot: SimulatedShot, t: number): { pt: Pt; r: number } {
  const L = groundPx(shot.landing)
  const S: Pt = [420, 700]
  const P1: Pt = [S[0] + (L[0] - S[0]) * 0.25, S[1] - 620 - (shot.apexM - 26) * 6]
  const P2: Pt = [L[0] + (S[0] - L[0]) * 0.06, L[1] - 300]
  const u = 1 - t
  const pt: Pt = [
    u ** 3 * S[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t ** 3 * L[0],
    u ** 3 * S[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t ** 3 * L[1],
  ]
  return { pt, r: lerp(7, 1.6, Math.pow(t, 0.6)) }
}

/** Bouncing and rolling out, s from 0 (landing) to 1 (rest). Ground position in metres and the hop in metres. */
export function rollWorld(shot: SimulatedShot, s: number): { p: Pt; hop: number } {
  const [lx, ly] = shot.landing, [rx, ry] = shot.rest
  const hop = s < 0.28 ? shot.bounceM * 4 * (s / 0.28) * (1 - s / 0.28) : 0
  const k = s < 0.12 ? s * 0.6 : lerp(0.08, 1, 1 - Math.pow(1 - (s - 0.12) / 0.88, 3))
  return { p: [lerp(lx, rx, k), lerp(ly, ry, k)], hop }
}

export interface HoleOverlay {
  time: number
  /** The ball in photo pixels, its radius in photo pixels, and how far it is lifted off the ground in photo pixels. */
  ball?: { pt: Pt; r: number; lift?: number; shadow?: boolean }
  trail?: Pt[]
  landing?: Pt
  distanceLabel?: string
  /** 0..1, the ball dropping into the cup. */
  sink?: number
  /** Seconds since the ball went in the water. */
  splash?: number
}

export function drawHole(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, w: number, h: number, view: View, o: HoleOverlay) {
  const x = cover(HOLE_IMG, view, w, h)
  drawPhoto(ctx, img, HOLE_IMG, x)

  const pinScale = photoScaleAt(PIN) * x.s
  const pin = toCanvas(x, PIN_PX)

  // Pitch mark where it landed (not in the water).
  if (o.landing && o.splash === undefined) {
    const l = toCanvas(x, o.landing)
    ctx.fillStyle = 'rgba(25,40,20,0.45)'
    ctx.beginPath(); ctx.ellipse(l[0], l[1], Math.max(2, pinScale * 0.18), Math.max(1, pinScale * 0.08), 0, 0, Math.PI * 2); ctx.fill()
  }

  // Splash rings.
  if (o.splash !== undefined && o.ball) {
    const c = toCanvas(x, o.ball.pt)
    const sc = photoScaleAt(PIN) * x.s
    for (let i = 0; i < 3; i++) {
      const k = o.splash * 1.4 - i * 0.25
      if (k <= 0 || k > 1.2) continue
      ctx.strokeStyle = `rgba(255,255,255,${0.75 * (1 - k / 1.2)})`
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.ellipse(c[0], c[1], sc * (0.3 + k * 1.5), sc * (0.12 + k * 0.6), 0, 0, Math.PI * 2); ctx.stroke()
    }
  }

  // The cup and the flag, over the photo's own flag.
  ctx.fillStyle = 'rgba(15,25,12,0.85)'
  ctx.beginPath(); ctx.ellipse(pin[0], pin[1], Math.max(2, pinScale * 0.12), Math.max(1, pinScale * 0.05), 0, 0, Math.PI * 2); ctx.fill()
  const poleH = Math.max(22, pinScale * 2.2)
  const wave = Math.sin(o.time * 3.2) * 0.12
  ctx.strokeStyle = '#f7f7f2'
  ctx.lineWidth = Math.max(1.5, pinScale * 0.035)
  ctx.beginPath(); ctx.moveTo(pin[0], pin[1]); ctx.lineTo(pin[0], pin[1] - poleH); ctx.stroke()
  ctx.fillStyle = '#e4412b'
  ctx.beginPath()
  ctx.moveTo(pin[0], pin[1] - poleH)
  ctx.lineTo(pin[0] + poleH * (0.42 + wave * 0.2), pin[1] - poleH * (0.86 + wave * 0.05))
  ctx.lineTo(pin[0], pin[1] - poleH * 0.72)
  ctx.closePath(); ctx.fill()

  // Distance line from the ball to the pin.
  if (o.distanceLabel && o.ball) {
    const b = toCanvas(x, o.ball.pt)
    ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(pin[0], pin[1]); ctx.stroke(); ctx.setLineDash([])
  }

  // Tracer.
  if (o.trail && o.trail.length > 1) {
    const pts = o.trail.map(p => toCanvas(x, p))
    ctx.lineCap = 'round'
    for (let i = 1; i < pts.length; i++) {
      const a = i / pts.length
      ctx.strokeStyle = `rgba(255, 244, 196, ${0.12 + a * 0.78})`
      ctx.lineWidth = 1.4 + a * 2
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke()
    }
  }

  // Ball.
  const sink = o.sink ?? 0
  if (o.ball && sink < 1) {
    const g = toCanvas(x, o.ball.pt)
    const lift = (o.ball.lift ?? 0) * x.s
    const r = Math.max(2.4, o.ball.r * x.s) * (1 - sink)
    if (o.ball.shadow) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'
      ctx.beginPath(); ctx.ellipse(g[0], g[1], r * 1.1, r * 0.45, 0, 0, Math.PI * 2); ctx.fill()
    }
    const c: Pt = [g[0], g[1] - lift]
    const glow = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], r * 3)
    glow.addColorStop(0, 'rgba(255,255,255,0.55)')
    glow.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = glow
    ctx.beginPath(); ctx.arc(c[0], c[1], r * 3, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath(); ctx.arc(c[0], c[1], r, 0, Math.PI * 2); ctx.fill()
  }

  // Distance label above both the ball and the flag.
  if (o.distanceLabel && o.ball) {
    const b = toCanvas(x, o.ball.pt)
    const mx = (b[0] + pin[0]) / 2, my = Math.min(b[1], pin[1] - poleH) - 22
    ctx.font = '700 15px Inter, system-ui, sans-serif'
    const tw = ctx.measureText(o.distanceLabel).width
    ctx.fillStyle = 'rgba(14,24,16,0.85)'
    roundRect(ctx, mx - tw / 2 - 10, my - 13, tw + 20, 26, 13)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText(o.distanceLabel, mx, my)
  }
}

/** Ground point of a ball in metres, as photo pixels with its lift in photo pixels. */
export function ballOnGround(p: Pt, hopM: number): { pt: Pt; lift: number } {
  return { pt: groundPx(p), lift: hopM * photoScaleAt(p) * 0.9 }
}

export { clamp01 }

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

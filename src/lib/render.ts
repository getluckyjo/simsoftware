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
import { PHOTO_H, PHOTO_SIZE, photoScaleAt, worldToPhoto, type Pt } from './course'
import type { SimulatedShot } from './shot'

// w and h are the coordinate space positions are given in; the files are twice that, upscaled, so a push-in stays sharp.
export const ATTRACT_IMG = { src: '/bay/attract.jpg', w: 1377, h: 687 }
export const HOLE_IMG = { src: '/bay/hole-7.jpg', w: PHOTO_SIZE.w, h: PHOTO_SIZE.h }

/** What part of a photo is on screen: a focus point in photo pixels and a zoom over "cover". */
export interface View { cx: number; cy: number; zoom: number }
interface Xform { s: number; ox: number; oy: number }

const PIN: Pt = [CHALLENGE.pin.x_m, CHALLENGE.pin.y_m]
export const PIN_PX: Pt = worldToPhoto(PIN)
const GREEN_CENTRE_PX: Pt = [326, 392]
/** The sun in the photo is behind and to the left: shadows fall to the right and towards the camera. */
const SHADOW_DIR: Pt = [0.88, 0.2]

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
  /** Seconds since the ball came down on land. */
  impact?: number
  /** Before the shot: the yardage over the flag, and the target ring round the cup. */
  pinTag?: string
  /** Seconds since the ball dropped. */
  holedFor?: number
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

  // Where it came down: a ring that spreads out over the grass.
  if (o.impact !== undefined && o.impact < 0.9 && o.landing) {
    const k = o.impact / 0.9
    const c = worldOf(o.landing)
    ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k)})`
    ctx.lineWidth = 2
    strokeRing(ctx, x, c, 0.4 + k * 2.2)
  }

  // Before the shot, a target round the cup, breathing slowly.
  if (o.pinTag) {
    const pulse = 0.5 + 0.5 * Math.sin(o.time * 2.2)
    ctx.lineWidth = 1.5
    ctx.strokeStyle = `rgba(255,255,255,${0.32 + pulse * 0.2})`
    strokeRing(ctx, x, PIN, 2.5)
    ctx.strokeStyle = `rgba(214,251,75,${0.45 + pulse * 0.3})`
    strokeRing(ctx, x, PIN, 1)
  }

  // It dropped: gold rings go out from the cup.
  if (o.holedFor !== undefined && o.holedFor < 3) {
    for (let i = 0; i < 3; i++) {
      const k = (o.holedFor - i * 0.4) / 1.6
      if (k <= 0 || k >= 1) continue
      ctx.strokeStyle = `rgba(232,212,139,${0.95 * (1 - k)})`
      ctx.lineWidth = 1 + 3 * (1 - k)
      strokeRing(ctx, x, PIN, 0.3 + k * 5)
    }
  }

  const poleH = drawFlag(ctx, pin, pinScale, o.time)

  // Distance line from the ball to the pin.
  if (o.distanceLabel && o.ball) {
    const b = toCanvas(x, o.ball.pt)
    ctx.setLineDash([6, 5]); ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = 2
    ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(pin[0], pin[1]); ctx.stroke(); ctx.setLineDash([])
  }

  // Tracer: a warm glow with a bright core, fading towards the tee.
  if (o.trail && o.trail.length > 1) {
    const pts = o.trail.map(p => toCanvas(x, p))
    ctx.lineCap = 'round'
    for (const [glow, width, alpha] of [[true, 7, 0.22], [false, 2.6, 0.95]] as const) {
      for (let i = 1; i < pts.length; i++) {
        const a = i / pts.length
        ctx.strokeStyle = glow ? `rgba(255, 200, 70, ${a * a * alpha})` : `rgba(255, 249, 226, ${0.08 + a * alpha})`
        ctx.lineWidth = (glow ? 2 : 0.8) + a * width
        ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke()
      }
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
    tag(ctx, (b[0] + pin[0]) / 2, Math.min(b[1], pin[1] - poleH) - 22, o.distanceLabel, false)
  } else if (o.pinTag) {
    tag(ctx, pin[0], pin[1] - poleH - 20, o.pinTag, true)
  }
}

/** The flagstick: cup, shadow, pole and a flag that moves in the wind. Returns the pole's height on screen. */
function drawFlag(ctx: CanvasRenderingContext2D, pin: Pt, pinScale: number, time: number): number {
  const poleH = Math.max(26, pinScale * 2.3)
  const poleW = Math.max(1.6, pinScale * 0.045)
  const [px, py] = pin

  // Its shadow on the green.
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'rgba(16,34,10,0.3)'
  ctx.lineWidth = poleW * 1.2
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + SHADOW_DIR[0] * poleH * 0.62, py + SHADOW_DIR[1] * poleH * 0.62); ctx.stroke()

  // The cup, with its white liner catching the light.
  const rx = Math.max(2.2, pinScale * 0.13), ry = Math.max(1.1, pinScale * 0.055)
  ctx.fillStyle = 'rgba(12,20,9,0.92)'
  ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0.1, Math.PI - 0.1); ctx.stroke()

  // The pole, outlined so it reads against the sand and the sky.
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = poleW + 1.4
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - poleH); ctx.stroke()
  ctx.strokeStyle = '#fbfbf4'; ctx.lineWidth = poleW
  ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py - poleH); ctx.stroke()

  // The flag: a curved cloth with a travelling ripple, darker in its folds.
  const fw = poleH * 0.52, fh = poleH * 0.32, top = py - poleH
  const ph = time * 5.2
  const wv = (k: number) => Math.sin(ph - k * 3.4) * fh * 0.13 * k
  ctx.beginPath()
  ctx.moveTo(px, top)
  ctx.bezierCurveTo(px + fw * 0.33, top + wv(0.33) - fh * 0.04, px + fw * 0.66, top + wv(0.66) + fh * 0.02, px + fw, top + wv(1) + fh * 0.08)
  ctx.lineTo(px + fw * 0.96, top + fh + wv(1) - fh * 0.04)
  ctx.bezierCurveTo(px + fw * 0.66, top + fh + wv(0.66), px + fw * 0.33, top + fh + wv(0.33) - fh * 0.02, px, top + fh)
  ctx.closePath()
  const g = ctx.createLinearGradient(px, 0, px + fw, 0)
  const fold = (k: number) => 0.5 + 0.5 * Math.cos(ph - k * 3.4)
  for (const k of [0, 0.33, 0.66, 1]) g.addColorStop(k, `hsl(7, 82%, ${44 + fold(k) * 14}%)`)
  ctx.fillStyle = g
  ctx.fill()
  ctx.strokeStyle = 'rgba(90,10,4,0.45)'; ctx.lineWidth = 0.8; ctx.stroke()

  // The ball on top of the pole.
  ctx.fillStyle = '#ffffff'
  ctx.beginPath(); ctx.arc(px, top - poleW * 0.2, poleW * 0.9, 0, Math.PI * 2); ctx.fill()
  return poleH
}

/** A circle of r metres on the ground, through the photo's perspective. */
function strokeRing(ctx: CanvasRenderingContext2D, x: Xform, c: Pt, r: number) {
  ctx.beginPath()
  for (let i = 0; i <= 48; i++) {
    const a = (i / 48) * Math.PI * 2
    const p = toCanvas(x, worldToPhoto([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]))
    if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1])
  }
  ctx.stroke()
}

/** Back from photo pixels to the ground, for points the overlay only has on the photo. */
function worldOf(p: Pt): Pt {
  const [u, v] = p, H = PHOTO_H
  // Invert the homography by solving the 2×2 system it gives for (x, y).
  const a = H[0][0] - u * H[2][0], b = H[0][1] - u * H[2][1], c = u * H[2][2] - H[0][2]
  const d = H[1][0] - v * H[2][0], e = H[1][1] - v * H[2][1], f = v * H[2][2] - H[1][2]
  const det = a * e - b * d
  return [(c * e - b * f) / det, (a * f - c * d) / det]
}

/** A dark pill with a pointer, the way a simulator labels the flag. */
function tag(ctx: CanvasRenderingContext2D, cx: number, cy: number, text: string, pointer: boolean) {
  ctx.font = '700 15px Inter, system-ui, sans-serif'
  const tw = ctx.measureText(text).width
  ctx.fillStyle = 'rgba(14,24,16,0.86)'
  roundRect(ctx, cx - tw / 2 - 11, cy - 13, tw + 22, 26, 13)
  ctx.fill()
  if (pointer) {
    ctx.beginPath(); ctx.moveTo(cx - 6, cy + 12); ctx.lineTo(cx, cy + 19); ctx.lineTo(cx + 6, cy + 12); ctx.closePath(); ctx.fill()
  }
  ctx.fillStyle = '#ffffff'
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy + 0.5)
}

/** The screen's finish over either scene: a soft vignette, and shade at the top behind the hole card and chips. */
export function drawGrade(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const v = ctx.createRadialGradient(w / 2, h * 0.55, Math.min(w, h) * 0.35, w / 2, h * 0.55, Math.hypot(w, h) * 0.62)
  v.addColorStop(0, 'rgba(0,0,0,0)')
  v.addColorStop(1, 'rgba(0,0,0,0.34)')
  ctx.fillStyle = v
  ctx.fillRect(0, 0, w, h)
  const top = ctx.createLinearGradient(0, 0, 0, Math.min(140, h * 0.22))
  top.addColorStop(0, 'rgba(6,12,8,0.38)')
  top.addColorStop(1, 'rgba(6,12,8,0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, w, Math.min(140, h * 0.22))
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

/**
 * Draws the demo bay screen on a canvas: a tee camera that follows the
 * ball up, and a green camera for the landing and roll. Plain perspective
 * projection with near-plane clipping; painter's order for trees, flag and
 * ball. It is an illustration of a simulator screen, not Golfzon software.
 */
import { CHALLENGE } from './challenge'
import { APPROACH, BUNKERS, ellipsePoints, FRINGE, GREEN, TREES, WATER, type Ellipse, type Pt } from './course'
import type { SimulatedShot } from './shot'

export type V3 = [number, number, number]

export interface Camera { pos: V3; fwd: V3; right: V3; up: V3; f: number; cx: number; cy: number }

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm = (a: V3): V3 => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l] }
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
const NEAR = 0.5

function lookAt(pos: V3, target: V3, f: number, cx: number, cy: number): Camera {
  const fwd = norm(sub(target, pos))
  const right = norm(cross(fwd, [0, 0, 1]))
  const up = cross(right, fwd)
  return { pos, fwd, right, up, f, cx, cy }
}

function toCam(c: Camera, p: V3): V3 {
  const v = sub(p, c.pos)
  return [dot(v, c.right), dot(v, c.up), dot(v, c.fwd)]
}

function camToScreen(c: Camera, v: V3): [number, number] {
  return [c.cx + (c.f * v[0]) / v[2], c.cy - (c.f * v[1]) / v[2]]
}

function project(c: Camera, p: V3): [number, number, number] | null {
  const v = toCam(c, p)
  if (v[2] < NEAR) return null
  const [x, y] = camToScreen(c, v)
  return [x, y, v[2]]
}

/** Project a ground polygon, clipped against the near plane. */
function projectPoly(c: Camera, pts: Pt[], z = 0): [number, number][] {
  const cam = pts.map(p => toCam(c, [p[0], p[1], z]))
  const out: V3[] = []
  for (let i = 0; i < cam.length; i++) {
    const a = cam[i], b = cam[(i + 1) % cam.length]
    const ain = a[2] >= NEAR, bin = b[2] >= NEAR
    if (ain) out.push(a)
    if (ain !== bin) {
      const t = (NEAR - a[2]) / (b[2] - a[2])
      out.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t), NEAR])
    }
  }
  return out.map(v => camToScreen(c, v))
}

function fillPoly(ctx: CanvasRenderingContext2D, pts: [number, number][], fill: string | CanvasGradient, stroke?: string, lw = 1) {
  if (pts.length < 3) return
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1])
  ctx.closePath()
  ctx.fillStyle = fill
  ctx.fill()
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke() }
}

const PIN: Pt = [CHALLENGE.pin.x_m, CHALLENGE.pin.y_m]

// ── Cameras ─────────────────────────────────────────────────────────────

export function teeCamera(w: number, h: number, track?: { ball: V3; weight: number }): Camera {
  const base: V3 = [0, 150, 0]
  const target = track ? lerp3(base, [track.ball[0] * 0.5, lerp(150, track.ball[1], 0.35), track.ball[2] * 0.85], track.weight) : base
  return lookAt([0, -4, 16], target, Math.min(w * 2.15, h * 3.6), w / 2, h * 0.5)
}

/** Framed on a ball that finished away from the green (short, wide, wet). */
export function lookAtFor(rest: Pt, w: number, h: number): Camera {
  return lookAt([rest[0] + 6, rest[1] - 24, 10], [rest[0] * 0.8 + PIN[0] * 0.2, rest[1] + 5, 0], Math.min(w * 1.05, h * 1.9), w / 2, h * 0.52)
}

export function greenCamera(w: number, h: number): Camera {
  return lookAt([8, 124, 11], [PIN[0] * 0.5, 151.5, 0], Math.min(w * 1.05, h * 1.9), w / 2, h * 0.52)
}

// ── Ball path ───────────────────────────────────────────────────────────

/** Position in flight, t from 0 (struck) to 1 (landing). */
export function flightPos(shot: SimulatedShot, t: number): V3 {
  const [lx, ly] = shot.landing
  const s = shot.startLineX, curve = lx - s
  const y = ly * (1 - Math.pow(1 - t, 1.3))
  const u = Math.pow(t, 1.25)
  return [s * t + curve * t * t, y, shot.apexM * 4 * u * (1 - u)]
}

/** Position while bouncing and rolling out, s from 0 (landing) to 1 (rest). */
export function rollPos(shot: SimulatedShot, s: number): V3 {
  const [lx, ly] = shot.landing, [rx, ry] = shot.rest
  const hop = s < 0.28 ? shot.bounceM * 4 * (s / 0.28) * (1 - s / 0.28) : 0
  const m = s < 0.12 ? 0 : 1 - Math.pow(1 - (s - 0.12) / 0.88, 3)
  const k = lerp(0.08, 1, m)
  return [lerp(lx, rx, s < 0.12 ? s * 0.6 : k), lerp(ly, ry, s < 0.12 ? s * 0.6 : k), hop]
}

// ── Scene ───────────────────────────────────────────────────────────────

export interface SceneState {
  time: number
  ball?: V3
  trail?: V3[]
  /** 0..1 fade for the landing mark. */
  landing?: Pt
  /** Show the dashed line and label from the ball to the pin. */
  distanceLabel?: string
  /** 0..1, the ball dropping into the cup. */
  sink?: number
  /** Seconds since a ball went in the water. */
  splash?: number
}

const SKY_TOP = '#6fa3cf', SKY_LOW = '#d9e8ef'

function drawSky(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number): number {
  const horizon = cam.fwd[1] > 0 ? cam.cy - (cam.f * cam.up[1]) / cam.fwd[1] : -1
  const gy = Math.max(0, Math.min(h, horizon))
  const ground = ctx.createLinearGradient(0, gy, 0, h)
  ground.addColorStop(0, '#7f9f78')
  ground.addColorStop(0.08, '#56834a')
  ground.addColorStop(1, '#3b6a31')
  ctx.fillStyle = ground
  ctx.fillRect(0, 0, w, h)
  if (horizon > 0) {
    const sky = ctx.createLinearGradient(0, 0, 0, horizon)
    sky.addColorStop(0, SKY_TOP)
    sky.addColorStop(1, SKY_LOW)
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, w, horizon + 1)
  }
  return horizon
}

function drawHills(ctx: CanvasRenderingContext2D, cam: Camera) {
  for (const [dist, tone, amp] of [[900, '#8fa89c', 70], [520, '#6f8f76', 38]] as const) {
    const pts: V3[] = []
    for (let x = -1400; x <= 1400; x += 70) pts.push([x, dist, amp * (0.55 + 0.45 * Math.sin(x / 190 + dist) * Math.cos(x / 83))])
    const top = pts.map(p => project(cam, p)).filter((p): p is [number, number, number] => !!p)
    const base = [...pts].reverse().map(p => project(cam, [p[0], p[1], 0])).filter((p): p is [number, number, number] => !!p)
    fillPoly(ctx, [...top, ...base].map(p => [p[0], p[1]]), tone)
  }
}

function drawEllipse(ctx: CanvasRenderingContext2D, cam: Camera, e: Ellipse, fill: string | CanvasGradient, stroke?: string) {
  fillPoly(ctx, projectPoly(cam, ellipsePoints(e, 56)), fill, stroke)
}

function drawGreen(ctx: CanvasRenderingContext2D, cam: Camera) {
  drawEllipse(ctx, cam, APPROACH, '#5c9a45')
  drawEllipse(ctx, cam, FRINGE, '#4f9140')
  const pts = projectPoly(cam, ellipsePoints(GREEN, 72))
  if (pts.length < 3) return
  fillPoly(ctx, pts, '#72b852')
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(pts[0][0], pts[0][1])
  for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1])
  ctx.closePath()
  ctx.clip()
  // Mowing stripes across the line of play.
  for (let y = GREEN.cy - GREEN.ry; y < GREEN.cy + GREEN.ry; y += 3.2) {
    const band = projectPoly(cam, [[-20, y], [20, y], [20, y + 1.6], [-20, y + 1.6]])
    fillPoly(ctx, band, 'rgba(255,255,255,0.07)')
  }
  ctx.restore()
}

function drawBunkers(ctx: CanvasRenderingContext2D, cam: Camera) {
  for (const b of BUNKERS) {
    drawEllipse(ctx, cam, { ...b, rx: b.rx + 0.35, ry: b.ry + 0.35 }, '#9c8c5f')
    drawEllipse(ctx, cam, b, '#e6d6a8')
  }
}

function drawWater(ctx: CanvasRenderingContext2D, cam: Camera, time: number) {
  const pts = projectPoly(cam, WATER)
  if (pts.length < 3) return
  const ys = pts.map(p => p[1])
  const g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys))
  g.addColorStop(0, '#5c9ec4')
  g.addColorStop(1, '#2f6f98')
  fillPoly(ctx, pts, g, 'rgba(20,50,40,0.45)', 2)
  ctx.save()
  ctx.clip()
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'
  ctx.lineWidth = 1
  for (let y = 96; y < 130; y += 3) {
    const off = Math.sin(time * 0.8 + y) * 2
    const line = [project(cam, [-30 + off, y, 0]), project(cam, [22 + off, y, 0])]
    if (line[0] && line[1]) { ctx.beginPath(); ctx.moveTo(line[0][0], line[0][1]); ctx.lineTo(line[1][0], line[1][1]); ctx.stroke() }
  }
  ctx.restore()
}

type Drawable = { z: number; draw: () => void }

function treeDrawable(ctx: CanvasRenderingContext2D, cam: Camera, t: (typeof TREES)[number]): Drawable | null {
  const base = project(cam, [t.x, t.y, 0])
  const crown = project(cam, [t.x, t.y, t.h * 0.62])
  if (!base || !crown) return null
  const r = (cam.f * t.r) / crown[2]
  if (r < 0.6) return null
  const shade = t.tone
  return {
    z: crown[2],
    draw: () => {
      ctx.strokeStyle = '#4a3b2b'
      ctx.lineWidth = Math.max(1, (cam.f * 0.45) / base[2])
      ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(crown[0], crown[1]); ctx.stroke()
      const dark = `hsl(${105 + shade * 20}, ${32 + shade * 10}%, ${19 + shade * 8}%)`
      const light = `hsl(${100 + shade * 20}, ${35 + shade * 10}%, ${27 + shade * 8}%)`
      ctx.fillStyle = dark
      for (const [dx, dy, s] of [[0, 0, 1], [-0.55, 0.35, 0.72], [0.55, 0.3, 0.7], [0, 0.75, 0.62]] as const) {
        ctx.beginPath(); ctx.arc(crown[0] + dx * r, crown[1] - dy * r, r * s, 0, Math.PI * 2); ctx.fill()
      }
      ctx.fillStyle = light
      ctx.beginPath(); ctx.arc(crown[0] - r * 0.25, crown[1] - r * 0.55, r * 0.45, 0, Math.PI * 2); ctx.fill()
    },
  }
}

function flagDrawable(ctx: CanvasRenderingContext2D, cam: Camera, time: number): Drawable | null {
  const foot = project(cam, [PIN[0], PIN[1], 0])
  const top = project(cam, [PIN[0], PIN[1], 2.3])
  if (!foot || !top) return null
  const wave = Math.sin(time * 3.2) * 0.12
  const tip = project(cam, [PIN[0] + 0.95, PIN[1] + wave, 2.05 + wave * 0.3])
  const low = project(cam, [PIN[0], PIN[1], 1.8])
  return {
    z: foot[2],
    draw: () => {
      const cup = projectPoly(cam, ellipsePoints({ cx: PIN[0], cy: PIN[1], rx: 0.13, ry: 0.13 }, 16))
      fillPoly(ctx, cup, '#1c2a1a')
      ctx.strokeStyle = '#f7f7f2'
      ctx.lineWidth = Math.max(1.2, (cam.f * 0.03) / foot[2])
      ctx.beginPath(); ctx.moveTo(foot[0], foot[1]); ctx.lineTo(top[0], top[1]); ctx.stroke()
      if (tip && low) fillPoly(ctx, [[top[0], top[1]], [tip[0], tip[1]], [low[0], low[1]]], '#e4412b')
    },
  }
}

function ballDrawables(ctx: CanvasRenderingContext2D, cam: Camera, s: SceneState): Drawable[] {
  const out: Drawable[] = []
  if (s.trail && s.trail.length > 1) {
    const pts = s.trail.map(p => project(cam, p)).filter((p): p is [number, number, number] => !!p)
    if (pts.length > 1) {
      out.push({
        z: -1, // tracer on top of everything
        draw: () => {
          ctx.lineCap = 'round'
          for (let i = 1; i < pts.length; i++) {
            const a = i / pts.length
            ctx.strokeStyle = `rgba(255, 244, 196, ${0.15 + a * 0.75})`
            ctx.lineWidth = 1.5 + a * 1.8
            ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke()
          }
        },
      })
    }
  }
  if (s.ball) {
    const b = s.ball
    const p = project(cam, b)
    const shadow = project(cam, [b[0], b[1], 0])
    const sink = s.sink ?? 0
    if (p && sink < 1) {
      const r = Math.max(2.6, (cam.f * 0.07) / p[2]) * (1 - sink)
      out.push({
        z: -2,
        draw: () => {
          if (shadow) {
            ctx.fillStyle = `rgba(0,0,0,${0.35 * (1 - Math.min(1, b[2] / 30))})`
            ctx.beginPath(); ctx.ellipse(shadow[0], shadow[1], r * 1.1, r * 0.45, 0, 0, Math.PI * 2); ctx.fill()
          }
          const glow = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 3)
          glow.addColorStop(0, 'rgba(255,255,255,0.55)')
          glow.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.fillStyle = glow
          ctx.beginPath(); ctx.arc(p[0], p[1], r * 3, 0, Math.PI * 2); ctx.fill()
          ctx.fillStyle = '#ffffff'
          ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill()
        },
      })
    }
  }
  return out
}

export function drawScene(ctx: CanvasRenderingContext2D, cam: Camera, w: number, h: number, s: SceneState) {
  ctx.clearRect(0, 0, w, h)
  drawSky(ctx, cam, w, h)
  drawHills(ctx, cam)
  // The mown carry from the tee to the water, and a collar round the green: depth cues for the eye.
  fillPoly(ctx, projectPoly(cam, [[-8, 12], [8, 12], [15, 92], [-17, 92]]), 'rgba(120,170,90,0.13)')
  fillPoly(ctx, projectPoly(cam, ellipsePoints({ cx: 0, cy: 151, rx: 19, ry: 21 }, 48)), 'rgba(120,170,90,0.16)')
  drawWater(ctx, cam, s.time)
  drawGreen(ctx, cam)
  drawBunkers(ctx, cam)

  if (s.landing) {
    const ring = projectPoly(cam, ellipsePoints({ cx: s.landing[0], cy: s.landing[1], rx: 0.22, ry: 0.22 }, 18))
    fillPoly(ctx, ring, 'rgba(40,60,30,0.45)')
  }

  if (s.splash !== undefined && s.ball) {
    const c = project(cam, [s.ball[0], s.ball[1], 0])
    if (c) {
      for (let i = 0; i < 3; i++) {
        const k = s.splash * 1.4 - i * 0.25
        if (k <= 0 || k > 1.2) continue
        ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - k / 1.2)})`
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.ellipse(c[0], c[1], (cam.f * (0.3 + k * 1.6)) / c[2], (cam.f * (0.1 + k * 0.5)) / c[2], 0, 0, Math.PI * 2); ctx.stroke()
      }
    }
  }

  const items: Drawable[] = []
  for (const t of TREES) { const d = treeDrawable(ctx, cam, t); if (d) items.push(d) }
  const flag = flagDrawable(ctx, cam, s.time)
  if (flag) items.push(flag)
  const ball = ballDrawables(ctx, cam, s)
  // Far to near; the ball and tracer (negative z) always last.
  items.sort((a, b) => b.z - a.z)
  for (const d of items) d.draw()

  if (s.distanceLabel && s.ball) {
    const a = project(cam, [s.ball[0], s.ball[1], 0])
    const b = project(cam, [PIN[0], PIN[1], 0])
    if (a && b) {
      ctx.setLineDash([6, 5])
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'
      ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke()
      ctx.setLineDash([])
    }
  }
  for (const d of ball) d.draw()

  if (s.distanceLabel && s.ball) {
    const a = project(cam, [s.ball[0], s.ball[1], 0])
    const b = project(cam, [PIN[0], PIN[1], 0])
    if (a && b) {
      // Above both the ball and the flag, so it never hides either.
      const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - Math.max(34, (cam.f * 2.8) / b[2])
      ctx.font = '700 15px Inter, system-ui, sans-serif'
      const tw = ctx.measureText(s.distanceLabel).width
      ctx.fillStyle = 'rgba(14,24,16,0.82)'
      roundRect(ctx, mx - tw / 2 - 10, my - 13, tw + 20, 26, 13)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(s.distanceLabel, mx, my)
    }
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

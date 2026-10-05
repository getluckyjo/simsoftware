'use client'
/**
 * The bay: a simulated simulator screen. While it waits it plays the course
 * render; once a golfer checks in it shows the challenge hole, and a shot
 * flies over the water onto the photograph (src/lib/render.ts). The
 * overlays carry the challenge (QR, locked settings, the armed banner, the
 * hole map, the shot data). When the ball comes to rest it calls onRest,
 * and that is when "Golfzon" reports the shot.
 */
import { useEffect, useRef } from 'react'
import { BAY, CHALLENGE, CHALLENGE_SETTINGS, TOP_PRIZE_USD, tierById } from '@/lib/challenge'
import { deg, LIE_LABEL, mph, rpm, toPin, usd, yards } from '@/lib/format'
import type { ChallengeSettings } from '@/lib/protocol'
import {
  ATTRACT_IMG, HOLE_IMG, WIDE_VIEW, ballOnGround, clamp01, drawAttract, drawHole, easeInOut, flightPoint, greenView,
  groundPx, lerpView, rollWorld, shotView, type View,
} from '@/lib/render'
import type { Pt } from '@/lib/course'
import type { SimulatedShot } from '@/lib/shot'
import MiniMap from './MiniMap'
import type { DemoActions, DemoState } from './useDemo'
import * as I from './icons'

const FLIGHT_S = 3.2
/** The view starts pushing in on the green this far into the flight. */
const PUSH_FROM = 0.45
const FADE_MS = 700
const ZOOM_OUT_MS = 900

interface Anim { key: number; shot?: SimulatedShot; start: number; notified: boolean; trail: Pt[]; clearedAt: number; lastClose?: View }
type Scene = 'attract' | 'hole'

export default function BayScreen({ state, actions, qrSvg }: { state: DemoState; actions: DemoActions; qrSvg: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const anim = useRef<Anim>({ key: 0, start: 0, notified: true, trail: [], clearedAt: -1e9 })
  const scene = useRef<{ now: Scene; prev: Scene; at: number }>({ now: 'attract', prev: 'attract', at: -1e9 })
  const onRest = useRef(actions.onRest)
  useEffect(() => { onRest.current = actions.onRest })

  const lobby = state.phase === 'home' || state.phase === 'scanning'

  // The course render while waiting, the challenge hole once someone has checked in.
  useEffect(() => {
    const next: Scene = lobby ? 'attract' : 'hole'
    if (next !== scene.current.now) scene.current = { now: next, prev: scene.current.now, at: performance.now() }
  }, [lobby])

  // Start a flight when a new shot arrives; zoom back out when the demo moves on.
  useEffect(() => {
    if (state.shot && state.phase === 'flight' && state.shotKey !== anim.current.key) {
      anim.current = { key: state.shotKey, shot: state.shot, start: performance.now(), notified: false, trail: [], clearedAt: -1e9 }
    }
    if (!state.shot && anim.current.shot) {
      anim.current = { key: state.shotKey, start: 0, notified: true, trail: [], clearedAt: performance.now(), lastClose: anim.current.lastClose }
    }
  }, [state.shot, state.shotKey, state.phase])

  useEffect(() => {
    const el = canvas.current, box = wrap.current
    if (!el || !box) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    const imgs: { attract?: HTMLImageElement; hole?: HTMLImageElement } = {}
    for (const [k, src] of [['attract', ATTRACT_IMG.src], ['hole', HOLE_IMG.src]] as const) {
      const im = new Image()
      im.decoding = 'async'
      im.src = src
      imgs[k] = im
    }
    let w = 0, h = 0, raf = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = box.clientWidth; h = box.clientHeight
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr)
      el.style.width = `${w}px`; el.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.imageSmoothingQuality = 'high'
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(box)

    /** The hole with whatever the current shot is doing on it. */
    const drawHoleScene = (t: number, time: number) => {
      const a = anim.current
      const shot = a.shot
      if (!shot) {
        const k = easeInOut(clamp01((t - a.clearedAt) / ZOOM_OUT_MS))
        drawHole(ctx, imgs.hole, w, h, lerpView(a.lastClose ?? greenView(w, h), WIDE_VIEW, k), { time })
        return
      }
      const close = shotView(w, h, shot)
      a.lastClose = close
      // rAF's timestamp is the frame's start, which can be a hair before the swing was set.
      const e = Math.max(0, (t - a.start) / 1000)
      if (e < FLIGHT_S) {
        const p = e / FLIGHT_S
        const { pt, r } = flightPoint(shot, p)
        a.trail.push(pt)
        if (a.trail.length > 110) a.trail.shift()
        const view: View = lerpView(WIDE_VIEW, close, easeInOut(clamp01((p - PUSH_FROM) / (1 - PUSH_FROM))))
        drawHole(ctx, imgs.hole, w, h, view, { time, ball: { pt, r }, trail: a.trail })
        return
      }
      const rollS = shot.lie === 'water' ? 1.3 : shot.holed ? 2.5 : 1.9
      const landPx = groundPx(shot.landing)
      if (e < FLIGHT_S + rollS) {
        const s = (e - FLIGHT_S) / rollS
        if (shot.lie === 'water') {
          drawHole(ctx, imgs.hole, w, h, close, { time, ball: { pt: landPx, r: 1.6 }, sink: s < 0.05 ? 0 : 1, splash: s * rollS })
          return
        }
        const { p, hop } = rollWorld(shot, s)
        const g = ballOnGround(p, hop)
        const sink = shot.holed && s > 0.9 ? (s - 0.9) / 0.1 : 0
        drawHole(ctx, imgs.hole, w, h, close, { time, ball: { pt: g.pt, r: 1.6, lift: g.lift, shadow: true }, landing: landPx, sink, trail: a.trail.slice(-10) })
        return
      }
      const gone = shot.holed || shot.lie === 'water'
      drawHole(ctx, imgs.hole, w, h, close, {
        time,
        ball: { pt: groundPx(shot.rest), r: 1.6, shadow: true },
        sink: gone ? 1 : 0,
        landing: landPx,
        distanceLabel: gone ? undefined : toPin(shot.distanceToPinCm),
      })
      if (!a.notified) {
        a.notified = true
        onRest.current()
      }
    }

    const draw = (which: Scene, t: number, time: number) =>
      which === 'attract' ? drawAttract(ctx, imgs.attract, w, h, time) : drawHoleScene(t, time)

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (w < 10 || h < 10) return
      const time = t / 1000
      const sc = scene.current
      const fade = clamp01((t - sc.at) / FADE_MS)
      if (fade < 1 && sc.prev !== sc.now) {
        draw(sc.prev, t, time)
        ctx.globalAlpha = easeInOut(fade)
        draw(sc.now, t, time)
        ctx.globalAlpha = 1
      } else {
        draw(sc.now, t, time)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  const p = state.phase
  const tier = tierById(state.tierId)
  const showResult = (p === 'settling' || p === 'miss' || p === 'ace' || p === 'claim') && state.shot
  const bayRunning: ChallengeSettings = p === 'refunded' && state.armed ? state.armed.event.settings : CHALLENGE_SETTINGS

  return (
    <div className="bay" ref={wrap}>
      <canvas ref={canvas} className="bay-canvas" />

      <div className="bay-hole">
        <span className="bay-chip">Get Lucky Challenge</span>
        <b>Hole {CHALLENGE.hole} · Par 3</b>
        <span>{yards(CHALLENGE.distance_m)} · Pin {CHALLENGE.pinLabel.toLowerCase()}</span>
      </div>

      <div className="bay-cond">
        <span><I.Wind size={15} /> 6 mph <span className="bay-arrow">→</span></span>
        <span>Green 3.0 · firm</span>
        <span className={bayRunning.difficulty === 'GTOUR' ? '' : 'bad'}>{bayRunning.difficulty === 'GTOUR' ? 'G-TOUR' : bayRunning.difficulty}</span>
      </div>

      {(p === 'stake' || p === 'paying' || p === 'arming' || p === 'armed' || p === 'refunded') && (
        <SettingsPanel running={bayRunning} refused={p === 'refunded'} />
      )}

      {lobby && (
        <div className="bay-lobby">
          <div className="bay-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div>
            <p className="bay-lobby-eyebrow">Get Lucky Challenge · Bay {BAY.number}</p>
            <p className="bay-lobby-h">Scan to play</p>
            <p className="bay-lobby-copy">$1 to $100 a swing. Win up to <b>{usd(TOP_PRIZE_USD)}</b>.<br />One swing, insured prize.</p>
            <p className="bay-lobby-lock"><I.Lock size={12} /> G-Tour · no assists · settings locked by GOLFZON</p>
          </div>
        </div>
      )}

      {(p === 'stake' || p === 'paying') && (
        <div className="bay-banner"><I.User size={16} /> {state.golferName} checked in · choosing a stake</div>
      )}
      {p === 'arming' && (
        <div className="bay-banner"><span className="spin" /> Locking the challenge settings…</div>
      )}
      {p === 'armed' && state.entry && (
        <>
          <div className="bay-banner armed">
            <span className="bay-armed-dot" />
            <b>Armed</b>
            <span className="mono">{state.entry.ref}</span>
            <span>{usd(state.entry.tier.stakeUsd)} → <b>{usd(state.entry.tier.prizeUsd)}</b></span>
            <span>One swing</span>
          </div>
          <button className="bay-swing" onClick={actions.swing}>
            Swing <kbd>space</kbd>
          </button>
        </>
      )}
      {p === 'refunded' && (
        <div className="bay-banner refused"><I.X size={16} strokeWidth={3} /> Entry refused · bay not on the challenge settings · {tier ? usd(tier.stakeUsd) : ''} refunded</div>
      )}

      {showResult && state.shot && <ShotStrip shot={state.shot} />}
      {(p === 'ace' || p === 'claim') && <div className="bay-ace"><span>Hole in one</span></div>}

      {!lobby && <MiniMap shot={state.shot} landed={p === 'settling' || p === 'miss' || p === 'ace' || p === 'claim'} />}

      <p className="bay-tag">Simulated bay screen for this demo · course images for illustration</p>
    </div>
  )
}

const LABELS: [keyof ChallengeSettings, string, (v: ChallengeSettings) => string][] = [
  ['difficulty', 'Difficulty', s => (s.difficulty === 'GTOUR' ? 'G-Tour' : s.difficulty[0] + s.difficulty.slice(1).toLowerCase())],
  ['near_cup_assist', 'Near-cup assist', s => (s.near_cup_assist ? 'On' : 'Off')],
  ['mulligans', 'Mulligans', s => String(s.mulligans)],
  ['concede_m', 'Concede', s => (s.concede_m ? `${s.concede_m} m` : 'Off')],
  ['green_firmness', 'Green', s => `${s.green_speed_m.toFixed(1)} m · ${s.green_firmness}`],
  ['wind_speed_mps', 'Wind', () => '6 mph from W'],
]

function SettingsPanel({ running, refused }: { running: ChallengeSettings; refused: boolean }) {
  return (
    <div className={`bay-settings ${refused ? 'refused' : ''}`}>
      <p><I.Lock size={13} /> {refused ? 'Bay is running' : 'Locked by GOLFZON for every entry'}</p>
      <ul>
        {LABELS.map(([k, label, fmt]) => {
          const bad = running[k] !== CHALLENGE_SETTINGS[k]
          return <li key={k} className={bad ? 'bad' : ''}><span>{label}</span><b>{fmt(running)}</b></li>
        })}
      </ul>
    </div>
  )
}

function ShotStrip({ shot }: { shot: SimulatedShot }) {
  const l = shot.launch
  const cells: [string, string][] = [
    ['Ball speed', mph(l.ballSpeedMps)],
    ['Launch', deg(l.launchDeg)],
    ['Back spin', rpm(l.backspinRpm)],
    ['Side spin', rpm(l.sidespinRpm)],
    ['Carry', yards(shot.carryM)],
    ['Total', yards(shot.totalM)],
  ]
  return (
    <div className="bay-strip">
      <div className="bay-strip-cells">
        {cells.map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
      </div>
      <div className={`bay-nearest ${shot.holed ? 'ace' : ''}`}>
        <span>{shot.holed ? 'Result' : LIE_LABEL[shot.lie]}</span>
        <b>{shot.holed ? 'Hole in one' : shot.lie === 'water' ? 'Water' : toPin(shot.distanceToPinCm)}</b>
      </div>
    </div>
  )
}

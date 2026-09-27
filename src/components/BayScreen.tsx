'use client'
/**
 * The bay: a simulated simulator screen. The canvas draws the hole and the
 * ball; the overlays carry the challenge (QR, locked settings, the armed
 * banner, the shot data). When the ball comes to rest it calls onRest, and
 * that is when "Golfzon" reports the shot.
 */
import { useEffect, useRef } from 'react'
import { BAY, CHALLENGE, CHALLENGE_SETTINGS, tierById } from '@/lib/challenge'
import { FRINGE, inEllipse, type Pt } from '@/lib/course'
import { deg, LIE_LABEL, mph, rpm, toPin, usd, yards } from '@/lib/format'
import type { ChallengeSettings } from '@/lib/protocol'
import { drawScene, flightPos, greenCamera, lookAtFor, rollPos, teeCamera, type V3 } from '@/lib/render'
import type { SimulatedShot } from '@/lib/shot'
import type { DemoActions, DemoState } from './useDemo'
import * as I from './icons'

const FLIGHT_S = 3.0
const CUT_AT = 0.86

interface Anim { key: number; shot?: SimulatedShot; start: number; notified: boolean; trail: V3[] }

export default function BayScreen({ state, actions, qrSvg }: { state: DemoState; actions: DemoActions; qrSvg: string }) {
  const wrap = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const anim = useRef<Anim>({ key: 0, start: 0, notified: true, trail: [] })
  const onRest = useRef(actions.onRest)
  useEffect(() => { onRest.current = actions.onRest })

  // Start a flight when a new shot arrives; drop the ball when the demo moves on.
  useEffect(() => {
    if (state.shot && state.phase === 'flight' && state.shotKey !== anim.current.key) {
      anim.current = { key: state.shotKey, shot: state.shot, start: performance.now(), notified: false, trail: [] }
    }
    if (!state.shot) anim.current = { key: state.shotKey, start: 0, notified: true, trail: [] }
  }, [state.shot, state.shotKey, state.phase])

  useEffect(() => {
    const el = canvas.current, box = wrap.current
    if (!el || !box) return
    const ctx = el.getContext('2d')
    if (!ctx) return
    let w = 0, h = 0, raf = 0
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = box.clientWidth; h = box.clientHeight
      el.width = Math.round(w * dpr); el.height = Math.round(h * dpr)
      el.style.width = `${w}px`; el.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(box)

    const frame = (t: number) => {
      raf = requestAnimationFrame(frame)
      if (w < 10 || h < 10) return
      const a = anim.current
      const time = t / 1000
      const shot = a.shot
      if (!shot) {
        drawScene(ctx, teeCamera(w, h), w, h, { time })
        return
      }
      const nearGreen = inEllipse(shot.rest as Pt, FRINGE, 6)
      const landCam = nearGreen ? greenCamera(w, h) : lookAtFor(shot.rest, w, h)
      const rollS = shot.lie === 'water' ? 1.3 : shot.holed ? 2.5 : 1.9
      // rAF's timestamp is the frame's start, which can be a hair before the swing was set.
      const e = Math.max(0, (t - a.start) / 1000)
      if (e < FLIGHT_S) {
        const p = e / FLIGHT_S
        const ball = flightPos(shot, p)
        a.trail.push(ball)
        if (a.trail.length > 90) a.trail.shift()
        const cam = p < CUT_AT ? teeCamera(w, h, { ball, weight: Math.sin(Math.PI * p) }) : landCam
        drawScene(ctx, cam, w, h, { time, ball, trail: p < CUT_AT ? a.trail : a.trail.slice(-12) })
        return
      }
      const land: V3 = [shot.landing[0], shot.landing[1], 0]
      if (e < FLIGHT_S + rollS) {
        const s = (e - FLIGHT_S) / rollS
        if (shot.lie === 'water') {
          drawScene(ctx, landCam, w, h, { time, ball: land, sink: s < 0.05 ? 0 : 1, splash: s * rollS })
          return
        }
        const ball = rollPos(shot, s)
        const sink = shot.holed && s > 0.9 ? (s - 0.9) / 0.1 : 0
        drawScene(ctx, landCam, w, h, { time, ball, landing: shot.landing, sink })
        return
      }
      const rest: V3 = [shot.rest[0], shot.rest[1], 0]
      drawScene(ctx, landCam, w, h, {
        time,
        ball: rest,
        sink: shot.holed || shot.lie === 'water' ? 1 : 0,
        landing: shot.landing,
        distanceLabel: shot.holed || shot.lie === 'water' ? undefined : toPin(shot.distanceToPinCm),
      })
      if (!a.notified) {
        a.notified = true
        onRest.current()
      }
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  const p = state.phase
  const tier = tierById(state.tierId)
  const showResult = (p === 'settling' || p === 'miss' || p === 'ace' || p === 'claim') && state.shot
  const lobby = p === 'home' || p === 'scanning'
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
            <p className="bay-lobby-copy">$1 to $50 a swing. Win up to <b>$50,000</b>.<br />One swing, insured prize.</p>
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

      <p className="bay-tag">Simulated bay screen for this demo · not GOLFZON software</p>
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

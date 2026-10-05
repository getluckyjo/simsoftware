'use client'
/**
 * The hole from above, in the corner of the bay screen the way a simulator
 * shows it: tee at the bottom, the water, the green with its bunkers and
 * the pin. After a shot it draws where the ball landed and finished.
 */
import { CHALLENGE } from '@/lib/challenge'
import { BUNKERS, FRINGE, GREEN, WALL, WATER, type Pt } from '@/lib/course'
import { yards } from '@/lib/format'
import type { SimulatedShot } from '@/lib/shot'

// World metres in view: x across, y down the hole (flipped so the green is at the top).
const X0 = -34, X1 = 40, Y0 = -26, Y1 = 176
const path = (pts: Pt[], close = true) => `M${pts.map(([x, y]) => `${x.toFixed(1)},${(-y).toFixed(1)}`).join('L')}${close ? 'Z' : ''}`

export default function MiniMap({ shot, landed }: { shot?: SimulatedShot; landed: boolean }) {
  const pin: Pt = [CHALLENGE.pin.x_m, CHALLENGE.pin.y_m]
  return (
    <div className="bay-map" aria-hidden="true">
      <svg viewBox={`${X0} ${-Y1} ${X1 - X0} ${Y1 - Y0}`} preserveAspectRatio="xMidYMid slice">
        <rect x={X0} y={-Y1} width={X1 - X0} height={Y1 - Y0} fill="#3f7a35" />
        <path d={path(WATER)} fill="#3d84b8" />
        <path d={path(WALL, false)} fill="none" stroke="#b8b2a4" strokeWidth={1.4} strokeLinejoin="round" />
        <path d={path(FRINGE)} fill="#5aa046" />
        <path d={path(GREEN)} fill="#8fd16a" />
        {BUNKERS.map((b, i) => <path key={i} d={path(b)} fill="#f1ead2" />)}
        <rect x={-4} y={-4} width={8} height={7} rx={1.5} fill="#6fb552" stroke="#d9efc7" strokeWidth={0.6} />
        <line x1={0} y1={0} x2={pin[0]} y2={-pin[1]} stroke="rgba(255,255,255,0.55)" strokeWidth={0.8} strokeDasharray="3 3" />
        {shot && landed && (
          <>
            <path d={`M0,0 L${shot.landing[0]},${-shot.landing[1]}`} stroke="#fff4c4" strokeWidth={1.1} fill="none" />
            <path d={`M${shot.landing[0]},${-shot.landing[1]} L${shot.rest[0]},${-shot.rest[1]}`} stroke="#fff4c4" strokeWidth={0.9} strokeDasharray="1.5 1.5" fill="none" />
            <circle cx={shot.rest[0]} cy={-shot.rest[1]} r={2.2} fill="#ffffff" stroke="#10190f" strokeWidth={0.6} />
          </>
        )}
        <line x1={pin[0]} y1={-pin[1]} x2={pin[0]} y2={-pin[1] - 7} stroke="#ffffff" strokeWidth={0.7} />
        <path d={`M${pin[0]},${-pin[1] - 7} l4.5,1.6 l-4.5,1.6 Z`} fill="#e4412b" />
        <circle cx={pin[0]} cy={-pin[1]} r={1.3} fill="#10190f" />
      </svg>
      <span>{yards(CHALLENGE.distance_m)}</span>
    </div>
  )
}

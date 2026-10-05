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
/** Distance lines across the hole, in yards from the tee. */
const MARKS = [100, 150].map(yd => ({ yd, m: yd * 0.9144 }))

export default function MiniMap({ shot, landed }: { shot?: SimulatedShot; landed: boolean }) {
  const pin: Pt = [CHALLENGE.pin.x_m, CHALLENGE.pin.y_m]
  return (
    <div className="bay-map" aria-hidden="true">
      <svg viewBox={`${X0} ${-Y1} ${X1 - X0} ${Y1 - Y0}`} preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="mm-grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4c8a3c" /><stop offset="1" stopColor="#356b2c" />
          </linearGradient>
          <linearGradient id="mm-water" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4f9bcb" /><stop offset="1" stopColor="#2c6e9e" />
          </linearGradient>
        </defs>
        <rect x={X0} y={-Y1} width={X1 - X0} height={Y1 - Y0} fill="url(#mm-grass)" />
        <path d={path(WATER)} fill="url(#mm-water)" />
        {[40, 70, 100].map(y => (
          <path key={y} d={`M${X0 + 6},${-y} q6,-2.5 12,0 t12,0 t12,0 t12,0 t12,0`} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={0.7} />
        ))}
        <path d={path(WALL, false)} fill="none" stroke="#c9c2b2" strokeWidth={1.6} strokeLinejoin="round" />
        <path d={path(FRINGE)} fill="#5aa046" />
        <path d={path(GREEN)} fill="#9ad874" stroke="#c4ee9f" strokeWidth={0.5} />
        {BUNKERS.map((b, i) => <path key={i} d={path(b)} fill="#f4eed9" />)}
        {MARKS.map(({ yd, m }) => (
          <g key={yd}>
            <line x1={X0} y1={-m} x2={X1} y2={-m} stroke="rgba(255,255,255,0.35)" strokeWidth={0.5} strokeDasharray="2 2" />
            <text x={X1 - 2} y={-m - 2} textAnchor="end" fontSize={7.5} fontWeight={700} fontFamily="Inter, system-ui, sans-serif" fill="rgba(255,255,255,0.8)">{yd}</text>
          </g>
        ))}
        <rect x={-5} y={-4} width={10} height={8} rx={1.5} fill="#7cc35c" stroke="#e1f3cf" strokeWidth={0.7} />
        <line x1={0} y1={0} x2={pin[0]} y2={-pin[1]} stroke="rgba(255,255,255,0.6)" strokeWidth={0.8} strokeDasharray="3 3" />
        {shot && landed && (
          <>
            <path d={`M0,0 L${shot.landing[0]},${-shot.landing[1]}`} stroke="#fff4c4" strokeWidth={1.1} fill="none" />
            <path d={`M${shot.landing[0]},${-shot.landing[1]} L${shot.rest[0]},${-shot.rest[1]}`} stroke="#fff4c4" strokeWidth={0.9} strokeDasharray="1.5 1.5" fill="none" />
            <circle cx={shot.rest[0]} cy={-shot.rest[1]} r={2.2} fill="#ffffff" stroke="#10190f" strokeWidth={0.6} />
          </>
        )}
        <line x1={pin[0]} y1={-pin[1]} x2={pin[0]} y2={-pin[1] - 9} stroke="#ffffff" strokeWidth={0.9} />
        <path d={`M${pin[0]},${-pin[1] - 9} l6,2 l-6,2 Z`} fill="#e4412b" />
        <circle cx={pin[0]} cy={-pin[1]} r={1.4} fill="#10190f" stroke="#ffffff" strokeWidth={0.4} />
      </svg>
      <span>{yards(CHALLENGE.distance_m)}</span>
    </div>
  )
}

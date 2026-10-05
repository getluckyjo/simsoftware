'use client'
/** The first thing someone sees when they open the link: what this is, and how to read the screen. */
import { useEffect } from 'react'
import { BAY, TOP_PRIZE_USD } from '@/lib/challenge'
import { usd } from '@/lib/format'
import * as I from './icons'

export default function Welcome({ onTour, onClose }: { onTour: () => void; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="welcome-wrap" onClick={onClose}>
      <div className="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-h" onClick={e => e.stopPropagation()}>
        <p className="welcome-eyebrow">Get Lucky × GOLFZON · a working demo</p>
        <h2 id="welcome-h">One swing at a GOLFZON bay. {usd(TOP_PRIZE_USD)} if it drops.</h2>
        <p className="welcome-lead">
          A golfer pays on the Get Lucky app and takes one swing on a GOLFZON simulator. GOLFZON sends a signed record of
          the shot, and that record is the evidence: a miss settles itself, and a hole in one opens its own claim for an
          insured prize. Nobody films, uploads or declares anything.
        </p>
        <div className="welcome-panes">
          <div>
            <span className="welcome-ic"><I.Flag size={16} /></span>
            <b>Bay {BAY.number}</b>
            <p>The GOLFZON screen the golfer swings at. Simulated for this demo.</p>
          </div>
          <div>
            <span className="welcome-ic"><I.Key size={16} /></span>
            <b>The wire</b>
            <p>Every message between GOLFZON and Get Lucky, and every check on it. The signatures are real.</p>
          </div>
          <div>
            <span className="welcome-ic"><I.User size={16} /></span>
            <b>Phone</b>
            <p>The Get Lucky app in the golfer&apos;s hand.</p>
          </div>
        </div>
        <div className="welcome-actions">
          <button className="btn-lime" onClick={onTour} autoFocus><I.Play size={16} /> Watch the 60-second tour</button>
          <button className="btn-ghost" onClick={onClose}>Try it yourself</button>
        </div>
        <p className="welcome-foot">Nothing is charged. Best full screen on a laptop. On a phone, switch between the three with the tabs at the top.</p>
      </div>
    </div>
  )
}

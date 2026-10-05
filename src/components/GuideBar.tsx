'use client'
/**
 * One line under the top bar that says what is happening and what to press
 * next, for someone who was sent the link and has nobody presenting. While
 * the tour runs it carries the tour's captions instead.
 */
import { BAY, CHALLENGE, tierById } from '@/lib/challenge'
import { usd } from '@/lib/format'
import type { DemoActions, DemoState, Phase } from './useDemo'
import * as I from './icons'

const STEPS = ['Scan', 'Pay', 'Swing', 'Result'] as const

const STEP_OF: Record<Phase, number> = {
  home: 0, scanning: 0,
  stake: 1, paying: 1, arming: 1,
  armed: 2, flight: 2, settling: 2,
  miss: 3, ace: 3, claim: 3, refunded: 3,
}

function hint(s: DemoState): React.ReactNode {
  const tier = tierById(s.tierId)
  switch (s.phase) {
    case 'home': return 'Start on the phone: tap Scan a bay. Or sit back and watch it play itself.'
    case 'scanning': return `The phone has read Bay ${BAY.number}'s QR code. Tap Continue.`
    case 'stake': return `Pick a stake${tier ? ` (${usd(tier.stakeUsd)} wins ${usd(tier.prizeUsd)})` : ''}, then Pay.`
    case 'paying': return 'Confirm the payment. It is a sandbox: nothing is charged.'
    case 'arming': return `Get Lucky asks GOLFZON to arm Bay ${BAY.number}. GOLFZON's signed reply is checked on the wire.`
    case 'armed': return <>Bay {BAY.number} is armed for this entry. Press Swing on the bay screen<span className="kbd-only">, or the space bar</span>.</>
    case 'flight': return 'GOLFZON tracks the ball to where it stops.'
    case 'settling': return 'GOLFZON signs a record of the shot. Get Lucky checks the signature and settles the entry by itself.'
    case 'miss': return 'Settled from GOLFZON\'s signed record: nothing to film, upload or declare. Tap Go again on the phone.'
    case 'ace': return 'Hole in one. The claim opened by itself: tap See your claim on the phone.'
    case 'claim': return 'Tap Open the claim file: what the reviewer and the insurer see, re-checked against GOLFZON\'s public key.'
    case 'refunded':
      return s.refund?.kind === 'expired'
        ? `Nobody swung within ${CHALLENGE.entryWindowMin} minutes, so the entry closed and the stake went back.`
        : 'The venue had lowered the bay\'s difficulty, so Get Lucky refused the entry and refunded it.'
  }
}

/** The phases where the next swing can still be set to drop. */
const CAN_FIX_NEXT: Phase[] = ['stake', 'paying', 'arming', 'armed', 'miss']

export default function GuideBar({ state, actions, onHide }: { state: DemoState; actions: DemoActions; onHide: () => void }) {
  if (state.tour) {
    return (
      <div className="guide tour" role="status" aria-live="polite">
        <span className="guide-live"><span /> Tour</span>
        <p className="guide-text" key={state.tour.caption}>{state.tour.caption}</p>
        <button className="guide-btn" onClick={actions.reset}>Play it yourself</button>
      </div>
    )
  }
  const step = STEP_OF[state.phase]
  const ace = state.nextShot === 'ace'
  return (
    <div className="guide">
      <ol className="guide-steps" aria-label="Steps">
        {STEPS.map((label, i) => (
          <li key={label} className={i < step ? 'done' : i === step ? 'now' : ''}>
            <span>{i < step ? <I.Check size={10} strokeWidth={3.5} /> : i + 1}</span>{label}
          </li>
        ))}
      </ol>
      <p className="guide-text" key={state.phase}>{hint(state)}</p>
      {state.phase === 'home' && (
        <button className="guide-btn" onClick={actions.startTour}><I.Play size={13} /> Watch the 60-second tour</button>
      )}
      {CAN_FIX_NEXT.includes(state.phase) && (
        <button className={`guide-btn ghost ${ace ? 'on' : ''}`} onClick={() => actions.setNextShot(ace ? 'natural' : 'ace')} title="Shortcut: A">
          {ace ? <><I.Check size={13} strokeWidth={3} /> Next swing drops</> : <><I.Flag size={13} /> Make the next swing a hole in one</>}
        </button>
      )}
      <button className="guide-x" onClick={onHide} aria-label="Hide the guide" title="Hide the guide"><I.X size={14} /></button>
    </div>
  )
}

'use client'
/** Controls for whoever is presenting. Hidden until opened (P). */
import type { DemoActions, DemoState } from './useDemo'
import * as I from './icons'

export default function Presenter({ state, actions }: { state: DemoState; actions: DemoActions }) {
  if (!state.presenterOpen) return null
  const canForge = !!state.lastShot && !state.lastShot.event.holed
  return (
    <aside className="presenter" aria-label="Presenter controls">
      <header>
        <b>Presenter</b>
        <button onClick={() => actions.togglePresenter(false)} aria-label="Close"><I.X size={16} /></button>
      </header>

      <label>Next shot</label>
      <div className="seg">
        {(['natural', 'close', 'ace'] as const).map(m => (
          <button key={m} className={state.nextShot === m ? 'on' : ''} onClick={() => actions.setNextShot(m)}>
            {m === 'natural' ? 'Natural' : m === 'close' ? 'Close miss' : 'Hole in one'}
          </button>
        ))}
      </div>
      <p className="hint">Resets to Natural after each swing. Keys: N, C, A.</p>

      <label>Golfer handicap (natural shots)</label>
      <div className="seg">
        {[0, 10, 20].map(h => (
          <button key={h} className={state.handicap === h ? 'on' : ''} onClick={() => actions.setHandicap(h)}>{h === 0 ? 'Scratch' : h}</button>
        ))}
      </div>

      <label htmlFor="golfer-name">Golfer name</label>
      <input id="golfer-name" value={state.golferName} maxLength={24} onChange={e => actions.setGolferName(e.target.value)} />

      <label>Try to break it</label>
      <button className="stress" disabled={!canForge} onClick={actions.forgeAce}>
        <b>Forge an ace</b>
        <span>{canForge ? 'Edit the last miss into a hole-in-one and replay it' : 'Play a miss first'}</span>
      </button>
      <button className={`stress ${state.lowerDifficultyNext ? 'armed' : ''}`} onClick={actions.toggleLowerDifficulty}>
        <b>Venue lowers the difficulty {state.lowerDifficultyNext ? '· on' : ''}</b>
        <span>Next entry: the bay runs Pro with near-cup assist</span>
      </button>
      <button className="stress" disabled={!state.lastEvent} onClick={actions.replayLast}>
        <b>GOLFZON retries the last webhook</b>
        <span>Same event, re-signed. Must change nothing</span>
      </button>

      <div className="presenter-foot">
        <button className="reset" onClick={actions.reset}><I.Refresh size={14} /> Reset demo (Shift+R)</button>
        <span className="hint">Space swings when the bay is armed</span>
      </div>
    </aside>
  )
}

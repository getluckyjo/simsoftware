'use client'
/**
 * The Get Lucky app, simulator mode, in the app's V2 palette: dark green
 * play screens, gold for prizes, lime for the one thing to press.
 */
import { useEffect, useState } from 'react'
import { BAY, CHALLENGE, SIM_TIERS, tierById } from '@/lib/challenge'
import { feetInches, LIE_LABEL, toPin, usd, usdShort, yards } from '@/lib/format'
import { WEEK_BOARD } from '@/lib/leaderboard'
import type { DemoActions, DemoState } from './useDemo'
import * as I from './icons'

const SETTINGS_LINE = 'G-Tour · no assists · wind 6 mph · firm greens'

export default function Phone({ state, actions, qrSvg }: { state: DemoState; actions: DemoActions; qrSvg: string }) {
  const light = state.phase === 'home'
  return (
    <div className="phone">
      <div className="phone-notch" />
      <div className={`phone-screen ${light ? 'is-light' : 'is-dark'}`}>
        <StatusBar light={light} />
        <div className="ph-body" key={screenKey(state.phase)}>
          <Screen state={state} actions={actions} qrSvg={qrSvg} />
        </div>
        {(state.phase === 'paying') && <PaySheet state={state} actions={actions} />}
      </div>
    </div>
  )
}

function screenKey(p: DemoState['phase']): string {
  if (p === 'paying') return 'stake'
  if (p === 'flight' || p === 'settling') return 'armed'
  return p
}

function Screen({ state, actions, qrSvg }: { state: DemoState; actions: DemoActions; qrSvg: string }) {
  switch (state.phase) {
    case 'home': return <HomeScreen state={state} actions={actions} />
    case 'scanning': return <ScanScreen actions={actions} qrSvg={qrSvg} />
    case 'stake': case 'paying': return <StakeScreen state={state} actions={actions} />
    case 'arming': return <ArmingScreen state={state} />
    case 'armed': case 'flight': case 'settling': return <LiveScreen state={state} />
    case 'miss': return <MissScreen state={state} actions={actions} />
    case 'ace': return <AceScreen state={state} actions={actions} />
    case 'claim': return <ClaimScreen state={state} actions={actions} />
    case 'refunded': return <RefundScreen state={state} actions={actions} />
  }
}

function StatusBar({ light }: { light: boolean }) {
  return (
    <div className={`ph-status ${light ? 'on-light' : ''}`}>
      <span>9:41</span>
      <span className="ph-status-icons" aria-hidden="true">
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1" fill="currentColor" /><rect x="4.5" y="5" width="3" height="6" rx="1" fill="currentColor" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="currentColor" /><rect x="13.5" y="0" width="3" height="11" rx="1" fill="currentColor" /></svg>
        <svg width="25" height="12" viewBox="0 0 25 12"><rect x="0.5" y="0.5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity=".45" /><rect x="2" y="2" width="16" height="8" rx="1.8" fill="currentColor" /><rect x="22.5" y="4" width="1.8" height="4" rx="1" fill="currentColor" opacity=".45" /></svg>
      </span>
    </div>
  )
}

// ── Home ────────────────────────────────────────────────────────────────

function HomeScreen({ state, actions }: { state: DemoState; actions: DemoActions }) {
  const best = WEEK_BOARD[0]
  return (
    <div className="ph-home">
      <div className="ph-home-head">
        <h1 className="ph-h1 green">Ready to get lucky, {state.golferName.split(' ')[0] || 'golfer'}?</h1>
        <img src="/brand/logo-color.png" alt="Get Lucky Golf" className="ph-home-logo" />
      </div>

      <div className="ph-hero">
        <p className="ph-eyebrow">New · in a sim bay</p>
        <h2 className="ph-h2">One swing.<br />Up to $100,000.</h2>
        <p className="ph-hero-copy">Play the Get Lucky Challenge on a GOLFZON bay. The simulator measures the shot, so there is nothing to film and nothing to sign.</p>
        <button className="btn-lime" onClick={actions.scan}><I.Scan size={18} /> Scan a bay</button>
      </div>

      <div className="ph-card-light">
        <div className="ph-card-light-row">
          <div>
            <p className="ph-label">Hole of the week</p>
            <p className="ph-card-title">Hole {CHALLENGE.hole} · Par 3 · {yards(CHALLENGE.distance_m)}</p>
            <p className="ph-small">{SETTINGS_LINE}</p>
          </div>
          <I.Flag size={22} className="gold" />
        </div>
        <div className="ph-divider" />
        <p className="ph-small"><I.Trophy size={13} /> Closest this week: <b>{feetInches(best.cm)}</b> · {best.name}, {best.city}</p>
      </div>

      <div className="ph-how">
        {[['Scan', 'the QR on the bay'], ['Back yourself', '$1 to $100'], ['Swing', 'the bay does the rest']].map(([a, b], i) => (
          <div key={a} className="ph-how-step"><span className="ph-how-n">{i + 1}</span><b>{a}</b><span>{b}</span></div>
        ))}
      </div>

      <nav className="ph-tabs" aria-hidden="true">
        <span className="on"><I.Home size={20} />Home</span>
        <span><I.Trophy size={20} />Winners</span>
        <span className="ph-tab-play"><I.Flag size={20} /></span>
        <span><I.Star size={20} />Club</span>
        <span><I.User size={20} />Account</span>
      </nav>
    </div>
  )
}

// ── Scan ────────────────────────────────────────────────────────────────

function ScanScreen({ actions, qrSvg }: { actions: DemoActions; qrSvg: string }) {
  const [found, setFound] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setFound(true), 1300)
    return () => clearTimeout(t)
  }, [])
  return (
    <div className="ph-scan">
      <button className="ph-back on-dark" onClick={actions.home} aria-label="Back"><I.ArrowLeft size={20} /></button>
      <p className="ph-scan-hint">Point at the QR on the bay screen</p>
      <div className={`ph-viewfinder ${found ? 'found' : ''}`}>
        <div className="ph-vf-qr" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        {!found && <div className="ph-scanline" />}
        <span className="c tl" /><span className="c tr" /><span className="c bl" /><span className="c br" />
      </div>
      {found && (
        <div className="ph-found">
          <div className="ph-found-row">
            <span className="ph-found-dot"><I.Check size={14} strokeWidth={3} /></span>
            <div>
              <p className="ph-card-title light">Bay {BAY.number} · {BAY.venue_name}</p>
              <p className="ph-small light">GOLFZON {BAY.sensor_model} · challenge ready</p>
            </div>
          </div>
          <p className="ph-small light ph-linked"><I.Key size={13} /> GOLFZON ID linked to your Get Lucky account</p>
          <button className="btn-lime" onClick={actions.checkIn}>Continue <I.ArrowRight size={18} /></button>
        </div>
      )}
    </div>
  )
}

// ── Stake ───────────────────────────────────────────────────────────────

function StakeScreen({ state, actions }: { state: DemoState; actions: DemoActions }) {
  const tier = tierById(state.tierId)!
  return (
    <div className="ph-play">
      <button className="ph-back on-dark" onClick={actions.home} aria-label="Back"><I.ArrowLeft size={20} /></button>
      <h1 className="ph-h1 center">Back yourself</h1>
      <p className="ph-sub center">Hole {CHALLENGE.hole} · Par 3 · {yards(CHALLENGE.distance_m)} · Bay {BAY.number}</p>

      <div className="ph-locked">
        <I.Lock size={14} />
        <div><b>{SETTINGS_LINE}</b><span>Set by GOLFZON for every entry. The venue cannot change them.</span></div>
      </div>

      <div className="ph-tiers">
        {SIM_TIERS.map(t => (
          <button key={t.id} className={`ph-tier ${t.id === state.tierId ? 'sel' : ''}`} onClick={() => actions.selectTier(t.id)}>
            <span className="ph-tier-stake"><b>{usd(t.stakeUsd)}</b><small>Stake</small></span>
            <span className="ph-tier-mult">1,000×</span>
            <span className="ph-tier-win"><small>Win</small><b>{usdShort(t.prizeUsd)}</b></span>
          </button>
        ))}
      </div>

      <div className="ph-trust">
        <span><I.Card size={15} /> Card · secure</span>
        <span><I.Shield size={15} /> Prize insured</span>
      </div>
      <button className="btn-lime wide" onClick={actions.openPay}>Pay {usd(tier.stakeUsd)}</button>
      <p className="ph-fine">Illustrative tiers. Simulator prizes are priced from GOLFZON ace data.</p>
    </div>
  )
}

function PaySheet({ state, actions }: { state: DemoState; actions: DemoActions }) {
  const tier = tierById(state.tierId)!
  return (
    <div className="ph-sheet-wrap" onClick={actions.closePay}>
      <div className="ph-sheet" onClick={e => e.stopPropagation()}>
        <div className="ph-grabber" />
        <p className="ph-label dark">Get Lucky Challenge · Bay {BAY.number}</p>
        <div className="ph-sheet-row"><span>Stake</span><b>{usd(tier.stakeUsd)}.00</b></div>
        <div className="ph-sheet-row"><span>Prize if it drops</span><b className="gold-dark">{usd(tier.prizeUsd)}</b></div>
        <div className="ph-sheet-row"><span><I.Card size={15} /> Visa •••• 4242</span><span className="muted">Sandbox</span></div>
        <button className="btn-green wide" onClick={actions.confirmPay} disabled={state.processing}>
          {state.processing ? <><span className="spin" /> Processing…</> : <>Confirm {usd(tier.stakeUsd)}.00</>}
        </button>
        <p className="ph-fine dark">Demo payment. No money moves.</p>
      </div>
    </div>
  )
}

// ── Arming and live ─────────────────────────────────────────────────────

function ArmingScreen({ state }: { state: DemoState }) {
  const steps = [
    { label: 'Payment received', done: true },
    { label: `Asking GOLFZON to arm Bay ${BAY.number}`, done: state.wire.some(w => w.path === '/v0/entries' && !w.pending) },
    { label: 'Checking the bay\'s settings', done: false },
  ]
  return (
    <div className="ph-play center-col">
      <div className="ph-pulse small"><span /></div>
      <h1 className="ph-h1 center">Setting up Bay {BAY.number}</h1>
      <ul className="ph-steps">
        {steps.map((s, i) => (
          <li key={i} className={s.done ? 'done' : i === steps.findIndex(x => !x.done) ? 'now' : ''}>
            <span className="ph-step-dot">{s.done ? <I.Check size={12} strokeWidth={3} /> : <span className="spin tiny" />}</span>{s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

function LiveScreen({ state }: { state: DemoState }) {
  const e = state.entry
  const [left, setLeft] = useState(() => (e ? e.expiresAt - Date.now() : 0))
  useEffect(() => {
    if (!e) return
    const t = setInterval(() => setLeft(e.expiresAt - Date.now()), 1000)
    return () => clearInterval(t)
  }, [e])
  const tracking = state.phase !== 'armed'
  const mm = Math.max(0, Math.floor(left / 60000)), ss = Math.max(0, Math.floor((left % 60000) / 1000))
  return (
    <div className="ph-play center-col">
      <div className={`ph-pulse ${tracking ? 'tracking' : ''}`}><span /><span /><span /></div>
      <p className="ph-eyebrow">{tracking ? 'Ball in the air' : 'You\'re live'}</p>
      <h1 className="ph-h1 center big">{tracking ? 'Tracking your shot' : `Bay ${BAY.number} is yours`}</h1>
      {e && <p className="ph-sub center">One swing. <b className="gold">{usd(e.tier.prizeUsd)}</b> if it drops.</p>}
      <div className="ph-live-card">
        <div><span>Entry</span><b className="mono">{e?.ref}</b></div>
        <div><span>Stake</span><b>{e ? usd(e.tier.stakeUsd) : ''}</b></div>
        <div><span>Expires in</span><b className="mono">{mm}:{String(ss).padStart(2, '0')}</b></div>
      </div>
      <p className="ph-small light center"><I.Lock size={12} /> {SETTINGS_LINE}</p>
      {!tracking && <p className="ph-cta-hint">Step up and swing</p>}
    </div>
  )
}

// ── Results ─────────────────────────────────────────────────────────────

function MissScreen({ state, actions }: { state: DemoState; actions: DemoActions }) {
  const shot = state.shot
  if (!shot) return null
  const ranked = state.ranked
  const youIdx = ranked ? ranked.rank - 1 : -1
  const rows = ranked ? ranked.rows.filter((_, i) => i < 3 || Math.abs(i - youIdx) <= 1) : []
  return (
    <div className="ph-play">
      <p className="ph-eyebrow center">{ranked ? 'Nearest' : LIE_LABEL[shot.lie]}</p>
      <p className="ph-distance">{shot.lie === 'water' ? 'Wet' : toPin(shot.distanceToPinCm)}</p>
      <p className="ph-sub center">{shot.lie === 'water' ? `${toPin(shot.distanceToPinCm)} from the pin · no score` : `from the pin · ${yards(shot.totalM)} total`}</p>
      {ranked ? (
        <div className="ph-board">
          <p className="ph-label">This week · closest to the pin</p>
          {rows.map((r, i) => {
            const pos = ranked.rows.indexOf(r) + 1
            const gap = i > 0 && pos - (ranked.rows.indexOf(rows[i - 1]) + 1) > 1
            return (
              <div key={r.name + r.cm} className={`ph-board-row ${r.you ? 'you' : ''} ${gap ? 'gap' : ''}`}>
                <span className="pos">{pos}</span>
                <span className="who">{r.you ? `${r.name} (you)` : r.name}<small>{r.city}</small></span>
                <span className="cm">{feetInches(r.cm)}</span>
              </div>
            )
          })}
          <p className="ph-small light">#{ranked.rank} of {ranked.total} this week</p>
        </div>
      ) : (
        <div className="ph-board"><p className="ph-small light">Only balls on the green go on the leaderboard. Next swing.</p></div>
      )}
      <p className="ph-settled"><I.Check size={13} strokeWidth={3} /> Settled from GOLFZON&apos;s signed shot record. Nothing to upload.</p>
      <div className="ph-actions">
        <button className="btn-lime" onClick={actions.playAgain}>Go again</button>
        <button className="btn-ghost" onClick={actions.home}>Done</button>
      </div>
    </div>
  )
}

function AceScreen({ state, actions }: { state: DemoState; actions: DemoActions }) {
  const prize = state.claim?.entry.tier.prizeUsd ?? 0
  return (
    <div className="ph-ace">
      <div className="ph-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ '--i': i } as React.CSSProperties} />)}</div>
      <p className="ph-eyebrow center">Bay {BAY.number} · Hole {CHALLENGE.hole}</p>
      <h1 className="ph-ace-h">Hole<br />in one</h1>
      <p className="ph-ace-prize">{usd(prize)}</p>
      <p className="ph-sub center">Your claim is already open.</p>
      <p className="ph-small light center narrow">GOLFZON&apos;s signed shot record is the evidence. No video to upload, no affidavit, no form.</p>
      <button className="btn-lime wide" onClick={actions.showClaim}>See your claim</button>
    </div>
  )
}

function ClaimScreen({ state, actions }: { state: DemoState; actions: DemoActions }) {
  const c = state.claim
  if (!c) return null
  const steps: [string, string, 'done' | 'now' | 'next'][] = [
    ['Shot record verified', 'Signed by GOLFZON, checked with its public key', 'done'],
    ['Settings match the challenge', 'G-Tour, no assists, locked from arm to shot', 'done'],
    ['Swing video attached', 'Nasmo clip fetched by shot id', 'done'],
    [`Bay ${BAY.number} staff confirm`, 'Request sent to the venue', 'now'],
    ['Get Lucky review', 'A person checks the file against the checklist', 'next'],
    [`Insurer pays ${usd(c.entry.tier.prizeUsd)}`, 'After review, to your account', 'next'],
  ]
  return (
    <div className="ph-play">
      <button className="ph-back on-dark" onClick={actions.home} aria-label="Back"><I.ArrowLeft size={20} /></button>
      <p className="ph-eyebrow center">Claim {c.id}</p>
      <h1 className="ph-h1 center">{usd(c.entry.tier.prizeUsd)} on its way</h1>
      <ul className="ph-claim-steps">
        {steps.map(([a, b, s]) => (
          <li key={a} className={s}>
            <span className="ph-step-dot">{s === 'done' ? <I.Check size={12} strokeWidth={3} /> : s === 'now' ? <span className="spin tiny" /> : null}</span>
            <div><b>{a}</b><span>{b}</span></div>
          </li>
        ))}
      </ul>
      <button className="btn-ghost wide" onClick={() => actions.setClaimOpen(true)}><I.FileCheck size={16} /> Open the claim file</button>
    </div>
  )
}

function RefundScreen({ state, actions }: { state: DemoState; actions: DemoActions }) {
  const tier = state.entry?.tier
  if (state.refund?.kind === 'expired') {
    return (
      <div className="ph-play center-col">
        <div className="ph-refund-icon amber"><I.Clock size={26} strokeWidth={2.5} /></div>
        <h1 className="ph-h1 center">Your entry has expired</h1>
        <p className="ph-sub center narrow">Bay {BAY.number} was armed for {CHALLENGE.entryWindowMin} minutes and nobody swung. We closed the entry and sent the stake back.</p>
        <p className="ph-settled"><I.Check size={13} strokeWidth={3} /> {tier ? usd(tier.stakeUsd) : ''}.00 refunded to Visa •••• 4242</p>
        <button className="btn-lime wide" onClick={actions.playAgain}>Enter again</button>
      </div>
    )
  }
  return (
    <div className="ph-play center-col">
      <div className="ph-refund-icon"><I.X size={26} strokeWidth={2.5} /></div>
      <h1 className="ph-h1 center">Bay {BAY.number} isn&apos;t set for the challenge</h1>
      <p className="ph-sub center narrow">GOLFZON reported the bay&apos;s settings when it armed, and they aren&apos;t the challenge&apos;s. So we didn&apos;t take the entry.</p>
      <ul className="ph-diff">
        {(state.refund?.reason ?? []).flatMap(r => r.split('; ')).map(r => <li key={r}>{r}</li>)}
      </ul>
      <p className="ph-settled"><I.Check size={13} strokeWidth={3} /> {tier ? usd(tier.stakeUsd) : ''}.00 refunded to Visa •••• 4242</p>
      <button className="btn-lime wide" onClick={actions.home}>OK</button>
    </div>
  )
}

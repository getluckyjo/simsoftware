'use client'
import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { BAY } from '@/lib/challenge'
import BayScreen from './BayScreen'
import ClaimFile from './ClaimFile'
import Phone from './Phone'
import Presenter from './Presenter'
import Wire from './Wire'
import { useDemo } from './useDemo'
import * as I from './icons'

type Tab = 'bay' | 'wire' | 'phone'

export default function Demo() {
  const { state, actions } = useDemo()
  const [qrSvg, setQrSvg] = useState('')
  const [tab, setTab] = useState<Tab>('phone')
  const actionsRef = useRef(actions)
  useEffect(() => { actionsRef.current = actions })

  // The bay's check-in QR: this site's /scan page with the bay id and a one-time nonce.
  useEffect(() => {
    const url = `${window.location.origin}/scan?bay=${BAY.id}&n=${state.nonce}`
    QRCode.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#10190f', light: '#ffffff' } })
      .then(setQrSvg)
      .catch(() => setQrSvg(''))
  }, [state.nonce])

  // On a narrow screen, follow the action to the pane it happens in.
  useEffect(() => {
    if (state.phase === 'flight') setTab('bay')
    if (state.phase === 'miss' || state.phase === 'ace' || state.phase === 'refunded') setTab('phone')
  }, [state.phase])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const a = actionsRef.current
      if (e.key === 'R' && e.shiftKey) { a.reset(); return }
      switch (e.key.toLowerCase()) {
        case ' ':
          // Drop focus first, so the space bar does not also press whatever button was last clicked.
          e.preventDefault()
          ;(document.activeElement as HTMLElement | null)?.blur?.()
          a.swing()
          break
        case 'a': a.setNextShot('ace'); break
        case 'c': a.setNextShot('close'); break
        case 'n': a.setNextShot('natural'); break
        case 'p': a.togglePresenter(); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="stage">
      <header className="topbar">
        <div className="brand">
          <img src="/brand/logo-dark.png" alt="Get Lucky Golf" />
          <span className="x">×</span>
          <span className="gz">GOLFZON</span>
        </div>
        <p className="topbar-title">The insured hole-in-one challenge on a GOLFZON bay <span>· live demo</span></p>
        <nav className="topbar-links">
          <button className={`presenter-btn ${state.presenterOpen ? 'on' : ''}`} onClick={() => actions.togglePresenter()} title="Presenter controls (P)">
            <I.Sliders size={14} /> <span>Presenter</span>
          </button>
          <a href="/spec" target="_blank" rel="noreferrer">API v0.1</a>
        </nav>
      </header>

      <nav className="tabs" aria-label="Panes">
        {([['bay', `Bay ${BAY.number}`], ['wire', 'The wire'], ['phone', 'Phone']] as const).map(([k, label]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>
            {label}{k === 'wire' && state.wire.length > 0 ? <span className="count">{state.wire.length}</span> : null}
          </button>
        ))}
      </nav>

      <main className="panes" data-tab={tab}>
        <section className="pane pane-bay" aria-label="Simulator bay">
          <p className="pane-eyebrow on-bay">GOLFZON bay · simulated</p>
          <BayScreen state={state} actions={actions} qrSvg={qrSvg} />
        </section>
        <section className="pane pane-wire">
          <Wire messages={state.wire} />
        </section>
        <section className="pane pane-phone" aria-label="Get Lucky app">
          <p className="pane-eyebrow">Get Lucky app</p>
          <PhoneFit>
            <Phone state={state} actions={actions} qrSvg={qrSvg} />
          </PhoneFit>
        </section>
      </main>

      {state.toast && <Toast key={state.toast.key} text={state.toast.text} tone={state.toast.tone} />}
      <Presenter state={state} actions={actions} />
      {state.claimOpen && state.claim && <ClaimFile claim={state.claim} onClose={() => actions.setClaimOpen(false)} />}
    </div>
  )
}

/** Scales the 375 × 780 phone down to whatever height the pane has. */
function PhoneFit({ children }: { children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const fit = () => setScale(Math.min(1, el.clientHeight / 800, el.clientWidth / 395))
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // The outer box takes the scaled size, so nothing overflows and nothing can scroll it.
  return (
    <div className="phone-fit" ref={box}>
      <div style={{ width: 395 * scale, height: 800 * scale }}>
        <div style={{ width: 395, height: 800, transform: `scale(${scale})` }}>{children}</div>
      </div>
    </div>
  )
}

function Toast({ text, tone }: { text: string; tone: string }) {
  const [gone, setGone] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setGone(true), 5200)
    return () => clearTimeout(t)
  }, [])
  if (gone) return null
  return <div className={`toast ${tone}`} role="status">{text}</div>
}

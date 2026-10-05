'use client'
/** The messages between Get Lucky and Golfzon, as they happen, with what the receiver checked. */
import { useEffect, useRef, useState } from 'react'
import { clock } from '@/lib/format'
import type { WireMsg } from './useDemo'
import * as I from './icons'

export default function Wire({ messages }: { messages: WireMsg[] }) {
  const list = useRef<HTMLDivElement>(null)
  const last = messages[messages.length - 1]
  useEffect(() => {
    const el = list.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, last?.pending, last?.id])

  return (
    <section className="wire" aria-label="Messages between Golfzon and Get Lucky">
      <header className="wire-head">
        <div>
          <p className="pane-eyebrow">The wire · API v0.1</p>
          <p className="wire-sub">Every message between GOLFZON and Get Lucky</p>
        </div>
        <a href="/spec" target="_blank" rel="noreferrer" className="wire-spec">Spec ↗</a>
      </header>
      <div className="wire-list" ref={list}>
        {messages.length === 0 && (
          <div className="wire-empty">
            <p>Nothing yet.</p>
            <p>Scan the bay on the phone. Each request and signed event will show here, with the checks Get Lucky runs on it.</p>
          </div>
        )}
        {messages.map(m => <Message key={m.id} m={m} />)}
      </div>
    </section>
  )
}

function summary(m: WireMsg): string | null {
  if (!m.body) return null
  try {
    const j = JSON.parse(m.body)
    if (j.type === 'challenge.armed') return `${j.bay?.id} · ${j.settings?.difficulty} · settings ${String(j.settings_hash).slice(0, 10)}…`
    if (j.type === 'challenge.shot') return `holed ${j.holed} · ${j.distance_to_pin_cm} cm from the pin · carry ${j.flight?.carry_m} m · ${j.rest?.lie}`
    if (j.entry_ref && j.bay_id) return `${j.entry_ref} · ${j.bay_id} · $${j.stake?.amount} → $${j.prize?.amount}`
  } catch { /* not JSON */ }
  return null
}

function Message({ m }: { m: WireMsg }) {
  const [open, setOpen] = useState(false)
  const inbound = m.to === 'Get Lucky'
  const sig = m.headers?.find(([k]) => k === 'Golfzon-Signature')?.[1]
  const s = summary(m)
  const statusTone = m.status === undefined ? '' : m.status < 300 ? 'ok' : m.status === 409 ? 'warn' : 'bad'
  return (
    <article className={`msg ${inbound ? 'in' : 'out'} ${m.from === 'Unknown sender' ? 'forger' : ''} ${m.outcome?.tone ?? ''}`}>
      <div className="msg-route">
        <span className={`party ${slug(m.from)}`}>{m.from}</span>
        <I.ArrowRight size={12} />
        <span className={`party ${slug(m.to)}`}>{m.to}</span>
        <time>{clock(m.at)}</time>
      </div>
      <div className="msg-line">
        <span className="msg-method">{m.method}</span>
        <span className="msg-path">{m.path}</span>
        {m.pending ? <span className="msg-status pending"><span className="spin tiny" /></span> : m.status !== undefined && <span className={`msg-status ${statusTone}`}>{m.status}</span>}
      </div>
      <p className="msg-title">{m.title}</p>
      {s && <p className="msg-summary mono">{s}</p>}
      {m.note && <p className="msg-note">{m.note}</p>}
      {sig && <p className="msg-sig mono" title={sig}><I.Key size={11} /> {sig.replace(/ed25519=(.{10}).*$/, 'ed25519=$1…')}</p>}
      {m.checks && m.checks.length > 0 && (
        <ul className="msg-checks">
          {m.checks.map((c, i) => (
            <li key={i} className={c.ok ? 'ok' : 'bad'}>
              {c.ok ? <I.Check size={12} strokeWidth={3} /> : <I.X size={12} strokeWidth={3} />}
              <span>{c.label}{c.detail ? <em> · {c.detail}</em> : null}</span>
            </li>
          ))}
        </ul>
      )}
      {m.outcome && <p className={`msg-outcome ${m.outcome.tone}`}>{m.outcome.text}</p>}
      {m.via && <p className="msg-via">{m.via === 'server' ? 'Verified by the Get Lucky endpoint (Node crypto)' : 'Server unreachable: verified in the browser (same checks)'}</p>}
      {m.body && (
        <>
          <button className="msg-toggle" onClick={() => setOpen(o => !o)}>{open ? 'Hide' : 'Show'} {m.headers ? 'headers and body' : 'body'}</button>
          {open && (
            <pre className="msg-body">
              {m.headers?.map(([k, v]) => `${k}: ${v}\n`).join('')}
              {m.headers ? '\n' : ''}
              {m.body}
            </pre>
          )}
        </>
      )}
    </article>
  )
}

const slug = (p: string) => p.toLowerCase().replace(/\s+/g, '-')

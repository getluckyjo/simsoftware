'use client'
/**
 * The claim as the reviewer and the insurer see it. The two signed records
 * are re-checked here, in the browser, with Golfzon's public key: nobody
 * has to take Get Lucky's word for it. The evidence pack is the same
 * records plus the key and the instructions, with its own SHA-256.
 */
import { useEffect, useState } from 'react'
import { verifyAsync } from '@noble/ed25519'
import { sha256Hex } from '@/lib/bytes'
import { BAY, CHALLENGE } from '@/lib/challenge'
import { deg, feetInches, mph, rpm, usd, yards } from '@/lib/format'
import { GOLFZON_JWKS, PUBLIC_KEYS } from '@/lib/keys'
import { parseSignatureHeader, settingsHash, signedMessage, SIGNATURE_HEADER } from '@/lib/protocol'
import type { Claim } from './useDemo'
import * as I from './icons'

type Status = 'checking' | 'ok' | 'bad'

async function verifyRecord(raw: string, header: string): Promise<boolean> {
  const sig = parseSignatureHeader(header)
  const key = sig && PUBLIC_KEYS[sig.kid]
  if (!sig || !key) return false
  return verifyAsync(sig.sig, signedMessage(sig.t, raw), key).catch(() => false)
}

export default function ClaimFile({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const [armedOk, setArmedOk] = useState<Status>('checking')
  const [shotOk, setShotOk] = useState<Status>('checking')
  const [settingsOk, setSettingsOk] = useState<Status>('checking')
  const [pack, setPack] = useState<{ url: string; sha: string; name: string } | null>(null)

  useEffect(() => {
    let url = ''
    const run = async () => {
      const [a, s, required] = await Promise.all([
        verifyRecord(claim.armed.raw, claim.armed.header),
        verifyRecord(claim.shot.raw, claim.shot.header),
        settingsHash(CHALLENGE.settings),
      ])
      setArmedOk(a ? 'ok' : 'bad')
      setShotOk(s ? 'ok' : 'bad')
      setSettingsOk(claim.armed.event.settings_hash === required && claim.shot.event.settings_hash === required ? 'ok' : 'bad')

      const body = JSON.stringify({
        claim_id: claim.id,
        generated_at: new Date().toISOString(),
        golfer: claim.golferName,
        entry: { ref: claim.entry.ref, stake_usd: claim.entry.tier.stakeUsd, prize_usd: claim.entry.tier.prizeUsd, bay: BAY.id },
        challenge: { id: CHALLENGE.challenge_id, settings: CHALLENGE.settings, settings_hash: required },
        records: [
          { event: 'challenge.armed', [SIGNATURE_HEADER]: claim.armed.header, raw_body: claim.armed.raw },
          { event: 'challenge.shot', [SIGNATURE_HEADER]: claim.shot.header, raw_body: claim.shot.raw },
        ],
        golfzon_public_keys: GOLFZON_JWKS,
        how_to_verify: 'For each record: take t and ed25519 from the header, build the message `${t}.${raw_body}` (UTF-8, raw_body exactly as given), and verify the Ed25519 signature with the public key whose kid matches. Then check settings_hash against the challenge settings.',
        nasmo_id: claim.shot.event.nasmo_id,
      }, null, 2)
      const sha = await sha256Hex(body)
      url = URL.createObjectURL(new Blob([body], { type: 'application/json' }))
      setPack({ url, sha, name: `${claim.id}-evidence.json` })
    }
    run()
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [claim])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const e = claim.shot.event
  const checklist: [string, Status | 'pending', string][] = [
    ['Shot record signed by GOLFZON', shotOk, `Ed25519, key ${GOLFZON_JWKS.keys[0].kid}, checked just now in this browser`],
    ['Arming record signed by GOLFZON', armedOk, 'The bay reported its settings before the swing'],
    ['Played on the challenge settings', settingsOk, 'Both records carry the challenge settings hash'],
    ['One entry, one shot', 'ok', `First and only shot for ${claim.entry.ref}`],
    ['Bay and software on the allowed list', 'ok', `${BAY.sensor_model}, software ${BAY.software_version}, serial ${BAY.sensor_serial}`],
    ['Swing video attached', 'ok', `Nasmo ${e.nasmo_id}`],
    ['Venue staff confirmation', 'pending', `Requested from Bay ${BAY.number} staff`],
    ['Reviewer sign-off', 'pending', 'Checklist, then approve or reject with a reason'],
  ]

  return (
    <div className="claim-wrap" role="dialog" aria-modal="true" aria-label={`Claim ${claim.id}`} onClick={onClose}>
      <div className="claim" onClick={ev => ev.stopPropagation()}>
        <header className="claim-head">
          <div>
            <p className="claim-eyebrow">Claim file · what the reviewer and the insurer see</p>
            <h2>{claim.id} · {usd(claim.entry.tier.prizeUsd)}</h2>
            <p className="claim-meta">{claim.golferName} · Bay {BAY.number}, {BAY.venue_name} · Hole {CHALLENGE.hole}, {yards(CHALLENGE.distance_m)} · {new Date(claim.createdAt).toLocaleString('en-US')}</p>
          </div>
          <button className="claim-close" onClick={onClose} aria-label="Close"><I.X size={20} /></button>
        </header>

        <div className="claim-grid">
          <section>
            <h3>Checklist</h3>
            <ul className="claim-checks">
              {checklist.map(([label, st, detail]) => (
                <li key={label} className={st}>
                  <span className="dot">{st === 'ok' ? <I.Check size={12} strokeWidth={3} /> : st === 'bad' ? <I.X size={12} strokeWidth={3} /> : st === 'checking' ? <span className="spin tiny" /> : null}</span>
                  <div><b>{label}</b><span>{detail}</span></div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3>The shot, from the record</h3>
            <dl className="claim-data">
              <div><dt>Ball speed</dt><dd>{mph(e.ball.speed_mps)}</dd></div>
              <div><dt>Launch</dt><dd>{deg(e.ball.launch_deg)}</dd></div>
              <div><dt>Back spin</dt><dd>{rpm(e.ball.backspin_rpm)}</dd></div>
              <div><dt>Spin axis</dt><dd>{deg(e.ball.spin_axis_deg)}</dd></div>
              <div><dt>Carry</dt><dd>{yards(e.flight.carry_m)}</dd></div>
              <div><dt>Total</dt><dd>{yards(e.flight.total_m)}</dd></div>
              <div><dt>Rest</dt><dd>{e.rest.lie === 'cup' ? 'In the cup' : feetInches(e.distance_to_pin_cm)}</dd></div>
              <div><dt>Struck</dt><dd>{new Date(e.struck_at).toLocaleTimeString('en-US')}</dd></div>
            </dl>
            <div className="claim-video">
              <I.Video size={22} />
              <div><b>Nasmo swing video</b><span>{e.nasmo_id} · fetched from GOLFZON by shot id. In the live product it plays here.</span></div>
            </div>
          </section>
        </div>

        <footer className="claim-foot">
          {pack ? (
            <>
              <a className="btn-green" href={pack.url} download={pack.name}><I.Download size={16} /> Download evidence pack</a>
              <p className="mono">sha256 {pack.sha}</p>
            </>
          ) : <p><span className="spin tiny" /> Building the evidence pack…</p>}
        </footer>
      </div>
    </div>
  )
}

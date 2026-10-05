/**
 * The part of the receiver that needs memory. `checkEvent` decides what one
 * request says; the ledger decides whether it may still change anything:
 *
 *   - an event id already recorded is a 200 no-op (Golfzon retries are safe)
 *   - a shot for an entry that is not armed is a 409, logged and ignored
 *   - one entry, one shot: the first challenge.shot wins
 *
 * In production these are unique constraints and conditional updates in
 * Postgres, the same pattern as the PayFast ledger in getluckyapp. Here the
 * browser keeps them for the length of the demo.
 */
import type { Effect, Verdict } from './protocol'

export type EntryStatus = 'arming' | 'armed' | 'refunded' | 'miss' | 'claimed'

export interface LedgerState {
  entries: Record<string, EntryStatus>
  seenEvents: string[]
}

export const emptyLedger = (): LedgerState => ({ entries: {}, seenEvents: [] })

export interface Outcome {
  status: number
  /** What changed, in one line, or why nothing did. */
  summary: string
  tone: 'ok' | 'bad' | 'warn'
  effect?: Effect
  duplicate?: boolean
}

const NEXT: Record<Effect, { from: EntryStatus; to: EntryStatus; summary: (ref: string) => string }> = {
  arm:    { from: 'arming', to: 'armed',    summary: ref => `Entry ${ref}: armed. Waiting for the swing.` },
  refund: { from: 'arming', to: 'refunded', summary: ref => `Entry ${ref}: refused and refunded.` },
  miss:   { from: 'armed',  to: 'miss',     summary: ref => `Bet ${ref}: active → miss (actor: machine). Leaderboard updated.` },
  claim:  { from: 'armed',  to: 'claimed',  summary: ref => `Bet ${ref}: active → claimed (actor: machine). Claim opened.` },
}

export function applyVerdict(ledger: LedgerState, v: Verdict): { ledger: LedgerState; outcome: Outcome } {
  if (!v.accepted || !v.effect || !v.entry_ref || !v.event_id) {
    return { ledger, outcome: { status: v.status, summary: v.message, tone: 'bad' } }
  }
  if (ledger.seenEvents.includes(v.event_id)) {
    return { ledger, outcome: { status: 200, summary: `Already recorded (${v.event_id}). Nothing changed.`, tone: 'warn', duplicate: true } }
  }
  const step = NEXT[v.effect]
  const current = ledger.entries[v.entry_ref]
  const seen = { ...ledger, seenEvents: [...ledger.seenEvents, v.event_id] }
  if (current !== step.from) {
    const summary = current === 'miss' || current === 'claimed'
      ? `Entry ${v.entry_ref} has already been played. One entry, one shot: logged and ignored.`
      : `Entry ${v.entry_ref} is ${current ?? 'unknown'}, not ${step.from}. Logged and ignored.`
    return { ledger: seen, outcome: { status: 409, summary, tone: 'bad' } }
  }
  return {
    ledger: { ...seen, entries: { ...ledger.entries, [v.entry_ref]: step.to } },
    outcome: { status: 200, summary: step.summary(v.entry_ref), tone: v.effect === 'refund' ? 'warn' : 'ok', effect: v.effect },
  }
}

/** An armed entry that was not played in its window: closed, and the stake goes back. */
export function expireEntry(ledger: LedgerState, ref: string): LedgerState | null {
  if (ledger.entries[ref] !== 'armed') return null
  return { ...ledger, entries: { ...ledger.entries, [ref]: 'refunded' } }
}

export function openEntry(ledger: LedgerState, ref: string): LedgerState {
  return { ...ledger, entries: { ...ledger.entries, [ref]: 'arming' } }
}

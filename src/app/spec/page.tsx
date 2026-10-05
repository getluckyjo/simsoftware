/**
 * /spec — the contract as a page to hand to GOLFZON's engineers (and to
 * print). The examples are generated and signed on every load by the same
 * code the demo runs, so they always verify, and the curl example works
 * against this deployment for five minutes.
 */
import { headers } from 'next/headers'
import { armBay, reportShot } from '@/lib/golfzon-mock'
import { BAY, CHALLENGE, CHALLENGE_SETTINGS } from '@/lib/challenge'
import { GOLFZON_JWKS } from '@/lib/keys'
import { settingsHash, SIGNATURE_HEADER, TIMESTAMP_TOLERANCE_S, type EntryRequest } from '@/lib/protocol'
import { mulberry32, simulateShot } from '@/lib/shot'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Get Lucky × GOLFZON · Challenge API v0.1' }

export default async function Spec() {
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const origin = `${h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')}://${host}`
  const now = Date.now()
  const entry: EntryRequest = {
    entry_ref: 'GL-7K3QXF',
    challenge_id: CHALLENGE.challenge_id,
    bay_id: BAY.id,
    nonce: 'Q8M2ZT4H',
    stake: { amount: 5, currency: 'USD' },
    prize: { amount: 5000, currency: 'USD' },
    expires_at: new Date(now + 15 * 60_000).toISOString(),
  }
  const armed = await armBay(entry, { venueLoweredDifficulty: false, nowMs: now })
  const shot = await reportShot(entry.entry_ref, simulateShot({ handicap: 10, mode: 'close', rng: mulberry32(40) }), now)
  const hash = await settingsHash(CHALLENGE_SETTINGS)
  const curlBody = shot.raw.replace(/'/g, "'\\''")

  return (
    <main className="doc-page">
      <header className="doc-head">
        <img src="/brand/logo-dark.png" alt="Get Lucky Golf" className="doc-logo" />
        <div>
          <p className="doc-eyebrow">Proposal · for GOLFZON · v{'0.1'}</p>
          <h1>The Get Lucky Challenge API</h1>
          <p className="doc-lede">The insured hole-in-one challenge on a GOLFZON bay, with the simulator as the verifier. The golfer pays in the Get Lucky app. GOLFZON arms the bay with locked settings and sends a signed record of the one shot. A miss settles itself; an ace opens a claim whose evidence is GOLFZON&apos;s record. Field names are ours and open to yours.</p>
        </div>
      </header>

      <section>
        <h2>What we ask GOLFZON to build</h2>
        <ol className="doc-list">
          <li><b>A locked challenge mode.</b> Set from your servers per challenge: G-Tour with no near-cup correction, a fixed tee, pin, wind, green speed and firmness, weather and altitude; no mulligans or concede. The venue cannot change it.</li>
          <li><b>Arm a bay for a paid entry.</b> <code>POST /v0/entries</code> from us, with the bay id and the one-time code from the bay&apos;s QR.</li>
          <li><b>Two signed webhooks.</b> <code>challenge.armed</code> with the settings the bay is really running, and <code>challenge.shot</code> with the launch data and the result. Plus <code>challenge.void</code> when the sensor did not read a ball.</li>
          <li><b>The swing video by shot id.</b> <code>GET /v0/shots/&#123;shot_id&#125;/video</code>, for claims only.</li>
          <li><b>Ace data for the insurer.</b> Ace rates by hole, tee, pin, difficulty and handicap, anonymised, so simulator prizes can be priced.</li>
        </ol>
      </section>

      <section>
        <h2>Signing</h2>
        <p>Every webhook carries a <code>{SIGNATURE_HEADER}</code> header: <code>t=&lt;unix seconds&gt;,kid=&lt;key id&gt;,ed25519=&lt;base64url signature&gt;</code>. The signature is Ed25519 over the UTF-8 bytes of <code>{'`${t}.${raw_body}`'}</code>, the body exactly as sent.</p>
        <p><b>Why asymmetric, not a shared HMAC secret:</b> GOLFZON keeps the private key and publishes the public one. Then a record can only have come from GOLFZON, and the insurer can check it without trusting Get Lucky. With a shared secret, we could have made the record ourselves, so it would not be evidence.</p>
        <p>Keys are published as a JWKS (here: <a href="/api/v0/golfzon/keys"><code>/api/v0/golfzon/keys</code></a>). Rotating a key means publishing a new <code>kid</code> alongside the old one.</p>
        <pre className="doc-code">{`// Node 18+: verify a Golfzon webhook
import { createPublicKey, verify } from 'node:crypto'

const { t, kid, ed25519 } = Object.fromEntries(
  req.headers['golfzon-signature'].split(',').map(p => p.split('=', 2)))
const jwk = jwks.keys.find(k => k.kid === kid)            // from the JWKS URL
const ok = verify(null, Buffer.from(\`\${t}.\${rawBody}\`),
  createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(ed25519, 'base64url'))
// then: |now - t| <= ${TIMESTAMP_TOLERANCE_S} s, event_id not seen before, one shot per entry`}</pre>
      </section>

      <section>
        <h2>Get Lucky → GOLFZON</h2>
        <h3><code>POST /v0/entries</code> · arm a bay</h3>
        <p>Sent after the stake is taken. Idempotent on <code>entry_ref</code>. GOLFZON answers <code>202</code> and then sends <code>challenge.armed</code>.</p>
        <pre className="doc-code">{JSON.stringify(entry, null, 2)}</pre>
        <h3><code>GET /v0/shots/&#123;shot_id&#125;/video</code> · the Nasmo clip</h3>
        <p>Called only when a claim is opened. The clip is stored with the claim.</p>
      </section>

      <section>
        <h2>GOLFZON → Get Lucky</h2>
        <p>POST to <code>{origin}/api/v0/golfzon/events</code>. Delivery can be at-least-once: a repeated <code>event_id</code> is answered <code>200</code> and changes nothing. A <code>5xx</code> means retry.</p>

        <h3><code>challenge.armed</code></h3>
        <p>The settings the bay is actually running, and their SHA-256 over canonical JSON (keys sorted). If they are not the challenge&apos;s (<code>{hash.slice(0, 16)}…</code> this week), the entry is refused and refunded.</p>
        <pre className="doc-code">{`${SIGNATURE_HEADER}: ${armed.header}\n\n${JSON.stringify(armed.event, null, 2)}`}</pre>

        <h3><code>challenge.shot</code></h3>
        <p>Sent once the ball is at rest. Metric throughout. <code>holed</code>, <code>distance_to_pin_cm = 0</code> and <code>rest.lie = &quot;cup&quot;</code> must agree. The first shot for an entry is the one that counts.</p>
        <pre className="doc-code">{`${SIGNATURE_HEADER}: ${shot.header}\n\n${JSON.stringify(shot.event, null, 2)}`}</pre>

        <h3><code>challenge.void</code></h3>
        <p>The sensor did not read a ball, or the bay faulted before a read. Carries <code>entry_ref</code>, <code>reason</code> and <code>sensor_flags</code>. The entry stays armed until it expires. Only the machine voids a shot; a shot that was read is final.</p>
      </section>

      <section>
        <h2>What the receiver checks</h2>
        <table className="doc-table">
          <thead><tr><th>Check</th><th>If it fails</th></tr></thead>
          <tbody>
            <tr><td>Signature header present and well formed</td><td>400</td></tr>
            <tr><td><code>kid</code> is a published GOLFZON key; the signature verifies over <code>t.raw_body</code></td><td>401, nothing changes</td></tr>
            <tr><td>Signed within {TIMESTAMP_TOLERANCE_S / 60} minutes</td><td>401; re-sign and resend</td></tr>
            <tr><td>Body matches the v0.1 contract</td><td>422</td></tr>
            <tr><td>Armed: settings are the challenge&apos;s</td><td>200, entry refused and refunded</td></tr>
            <tr><td>Shot: settings hash is the challenge&apos;s; result self-consistent</td><td>422</td></tr>
            <tr><td><code>event_id</code> already recorded</td><td>200, no change</td></tr>
            <tr><td>Entry armed and not yet played</td><td>409, logged</td></tr>
          </tbody>
        </table>
      </section>

      <section>
        <h2>Try it</h2>
        <p>This example is signed for the next five minutes. Change one character of the body and it is refused.</p>
        <pre className="doc-code">{`curl -s -X POST ${origin}/api/v0/golfzon/events \\
  -H 'Content-Type: application/json' \\
  -H '${SIGNATURE_HEADER}: ${shot.header}' \\
  --data-binary '${curlBody}'`}</pre>
        <p>Public keys: <a href="/api/v0/golfzon/keys"><code>{origin}/api/v0/golfzon/keys</code></a> · This week&apos;s challenge: <a href="/api/v0/challenge"><code>{origin}/api/v0/challenge</code></a></p>
        <p className="doc-fine">The demo key (<code>{GOLFZON_JWKS.keys[0].kid}</code>) is ours and public; in production GOLFZON generates and holds its own.</p>
      </section>
    </main>
  )
}

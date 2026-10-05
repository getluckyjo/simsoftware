/**
 * Where the bay's QR code points. In the live product this link opens the
 * Get Lucky app at that bay; in the demo it explains itself, so anyone who
 * scans the screen with a real phone lands somewhere sensible.
 */
import Link from 'next/link'

export const metadata = { title: 'Get Lucky · bay check-in' }

export default async function Scan({ searchParams }: { searchParams: Promise<{ bay?: string; n?: string }> }) {
  const { bay, n } = await searchParams
  return (
    <main className="doc-page narrow-doc">
      <img src="/brand/logo-dark.png" alt="Get Lucky Golf" className="doc-logo" />
      <p className="doc-eyebrow">Bay check-in</p>
      <h1>You scanned {bay ?? 'a bay'}.</h1>
      <p>This is the link a GOLFZON bay shows for the Get Lucky Challenge. In the live product it opens the Get Lucky app at this bay, already checked in, and the one-time code{n ? <> (<code>{n}</code>)</> : null} makes sure an entry can only arm the bay you are standing at.</p>
      <p>This one belongs to the demo.</p>
      <Link className="btn-lime" href="/">Open the demo</Link>
    </main>
  )
}

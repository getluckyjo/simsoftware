import type { Metadata, Viewport } from 'next'
import './globals.css'

const TITLE = 'Get Lucky × GOLFZON · live demo'
const DESCRIPTION = 'One swing at a GOLFZON bay, up to $100,000 if it drops. GOLFZON\'s signed shot record settles every entry. A working demo of the proposed integration.'

export const metadata: Metadata = {
  metadataBase: new URL('https://demogolfzon.vercel.app'),
  title: TITLE,
  description: DESCRIPTION,
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.png' },
  // The preview card when the link is shared in WhatsApp, Slack, email or iMessage.
  openGraph: {
    type: 'website',
    siteName: 'Get Lucky Golf',
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'The demo: a GOLFZON bay, the messages between GOLFZON and Get Lucky, and the Get Lucky app' }],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: ['/og.jpg'] },
}

export const viewport: Viewport = { themeColor: '#0f1a11' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet" />
        <link rel="preload" href="/fonts/PosterGothicRoundATF-Heavy.woff2" as="font" type="font/woff2" crossOrigin="" />
      </head>
      <body>{children}</body>
    </html>
  )
}

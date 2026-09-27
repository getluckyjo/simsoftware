import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Get Lucky × GOLFZON · live demo',
  description: 'The insured hole-in-one challenge on a GOLFZON bay, with the simulator as the verifier. A working demo of the proposed integration.',
  robots: { index: false, follow: false },
  icons: { icon: '/favicon.png' },
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

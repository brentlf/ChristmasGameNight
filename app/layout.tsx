import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import TopLeftNav from './components/TopLeftNav'
import ChristmasBackdrop from './components/ChristmasBackdrop'
import { AudioProvider } from '@/lib/contexts/AudioContext'
import AudioPolicyClient from './components/AudioPolicyClient'
import ViewportHeightClient from './components/ViewportHeightClient'

export const metadata: Metadata = {
  title: 'Christmas Game Night',
  description: 'Family Game Show',
  icons: [{ rel: 'icon', url: '/icon.svg', type: 'image/svg+xml' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh overflow-x-hidden">
        <ViewportHeightClient />
        <AudioProvider>
          <ChristmasBackdrop />
          <TopLeftNav />
          <AudioPolicyClient />
          <div className="relative min-h-dvh pt-[calc(env(safe-area-inset-top)+3rem)] sm:pt-[calc(env(safe-area-inset-top)+3.5rem)] md:pt-4 pb-[env(safe-area-inset-bottom)]">
            {children}
          </div>
          <Toaster position="top-center" />
        </AudioProvider>
      </body>
    </html>
  )
}


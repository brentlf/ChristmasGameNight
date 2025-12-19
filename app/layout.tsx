import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import TopLeftNav from './components/TopLeftNav'
import ChristmasBackdrop from './components/ChristmasBackdrop'
import AudioControls from './components/AudioControls'
import { AudioProvider } from '@/lib/contexts/AudioContext'
import AudioPolicyClient from './components/AudioPolicyClient'

export const metadata: Metadata = {
  title: 'Christmas Game Night',
  description: 'Family Game Show',
  icons: [{ rel: 'icon', url: '/icon.svg', type: 'image/svg+xml' }],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh overflow-x-hidden">
        <AudioProvider>
          <ChristmasBackdrop />
          <TopLeftNav />
          <AudioPolicyClient />
          <AudioControls />
          <div className="relative min-h-dvh pt-12 sm:pt-14 md:pt-4">
            {children}
          </div>
          <Toaster position="top-center" />
        </AudioProvider>
      </body>
    </html>
  )
}


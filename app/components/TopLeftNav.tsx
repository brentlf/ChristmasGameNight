'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getLanguage, setLanguage, t, type Language } from '@/lib/i18n'
import { useAudio } from '@/lib/contexts/AudioContext'

const STORAGE_KEY_ACTIVE_ROOM_ID = 'cgn_active_room_id'

function getRoomIdFromPathname(pathname: string): string | null {
  const m = pathname.match(/^\/room\/([^/]+)(?:\/|$)/)
  return m?.[1] ?? null
}

function IconArrowLeft(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M15 18l-6-6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconHome(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M3 10.5l9-7 9 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 9.5V20h11V9.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function IconDoorReturn(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 17l-5-5 5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 12h9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function TopLeftNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [lang, setLang] = useState<Language>('en')
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const { playSound } = useAudio()

  useEffect(() => {
    setLang(getLanguage())
  }, [])

  useEffect(() => {
    // Track "current active room" for quick navigation on mobile.
    // Note: `localStorage` is not available during server rendering, even in client components.
    if (typeof window === 'undefined') return

    const roomIdInPath = getRoomIdFromPathname(pathname)
    if (roomIdInPath) {
      localStorage.setItem(STORAGE_KEY_ACTIVE_ROOM_ID, roomIdInPath)
      setActiveRoomId(roomIdInPath)
      return
    }

    setActiveRoomId(localStorage.getItem(STORAGE_KEY_ACTIVE_ROOM_ID))
  }, [pathname])

  // Don't show on home route.
  const showHome = pathname !== '/'
  const showBack = pathname !== '/'
  const showReturnToActiveRoom =
    Boolean(activeRoomId) && !pathname.startsWith(`/room/${activeRoomId}`)

  if (!showBack && !showHome) return null

  return (
    <div className="fixed left-2 top-2 sm:left-4 sm:top-4 z-50 max-w-[calc(100vw-1rem)]">
      <div className="flex flex-wrap items-center gap-1 sm:gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg px-2 py-2 max-w-full">
        {showReturnToActiveRoom && activeRoomId && (
          <Link
            href={`/room/${activeRoomId}/play`}
            onClick={() => playSound('click')}
            className="inline-flex md:hidden items-center justify-center rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
            aria-label={t('nav.returnToActiveRoom', lang)}
            title={t('nav.returnToActiveRoom', lang)}
          >
            <IconDoorReturn className="h-5 w-5" />
          </Link>
        )}

        {showBack && (
          <button
            type="button"
            onClick={() => {
              playSound('click');
              // If there's browser history, go back; otherwise go home.
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back()
              } else {
                router.push('/')
              }
            }}
            className="hidden md:inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
            aria-label={t('nav.back', lang)}
          >
            <IconArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">{t('nav.back', lang)}</span>
          </button>
        )}

        {showHome && (
          <Link
            href="/"
            onClick={() => playSound('click')}
            className="hidden md:inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
            aria-label={t('nav.home', lang)}
          >
            <IconHome className="h-5 w-5" />
            <span className="hidden sm:inline">{t('nav.home', lang)}</span>
          </Link>
        )}

        {(showBack || showHome) && (
          <div className="hidden md:block h-6 w-px bg-white/20 mx-1" />
        )}

        <button
          type="button"
          onClick={() => {
            playSound('click');
            setLanguage('en')
            setLang('en')
            if (typeof window !== 'undefined') window.location.reload()
          }}
          className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold transition ${
            lang === 'en' ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white' : 'text-white/80 hover:bg-white/20'
          }`}
          aria-label="Switch language to English"
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => {
            playSound('click');
            setLanguage('cs')
            setLang('cs')
            if (typeof window !== 'undefined') window.location.reload()
          }}
          className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold transition ${
            lang === 'cs' ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white' : 'text-white/80 hover:bg-white/20'
          }`}
          aria-label="Switch language to Czech"
        >
          CS
        </button>

        <div className="h-6 w-px bg-white/20 mx-1" />

        <Link
          href="/traditions"
          onClick={() => playSound('click')}
          className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
          aria-label={t('nav.traditions', lang)}
        >
          🎡
          <span className="hidden sm:inline">{t('nav.traditions', lang)}</span>
        </Link>
      </div>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getLanguage, setLanguage, t, type Language } from '@/lib/i18n'
import { useAudio } from '@/lib/contexts/AudioContext'
import AudioControls from '@/app/components/AudioControls'

const STORAGE_KEY_ACTIVE_ROOM_ID = 'cgn_active_room_id'

function getRoomIdFromPathname(pathname: string): string | null {
  const m = pathname.match(/^\/room\/([^/]+)(?:\/|$)/)
  return m?.[1] ?? null
}

function NavIconLink({
  href,
  active,
  tooltip,
  children,
  onClick,
}: {
  href: string
  active?: boolean
  tooltip: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={tooltip}
      title={tooltip}
      className={`relative group inline-flex items-center justify-center rounded-full h-10 w-10 sm:h-11 sm:w-11 border text-white transition ${
        active
          ? 'bg-christmas-gold/25 border-christmas-gold/40'
          : 'bg-white/10 border-white/20 hover:bg-white/20'
      }`}
    >
      <span aria-hidden="true" className="text-lg sm:text-xl leading-none">
        {children}
      </span>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {tooltip}
      </span>
    </Link>
  )
}

function NavIconButton({
  active,
  tooltip,
  children,
  onClick,
}: {
  active?: boolean
  tooltip: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tooltip}
      title={tooltip}
      className={`relative group inline-flex items-center justify-center rounded-full h-10 w-10 sm:h-11 sm:w-11 border text-white transition ${
        active
          ? 'bg-christmas-gold/25 border-christmas-gold/40'
          : 'bg-white/10 border-white/20 hover:bg-white/20'
      }`}
    >
      <span aria-hidden="true" className="leading-none">
        {children}
      </span>
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
        {tooltip}
      </span>
    </button>
  )
}

export default function TopLeftNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [lang, setLang] = useState<Language>('en')
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const { playSound, device } = useAudio()

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

  const tvHref = activeRoomId ? `/room/${activeRoomId}/tv` : '/active-rooms'
  const tvActive = pathname === '/active-rooms' || pathname.includes('/tv')

  // Keep landing screen clean.
  if (pathname === '/') return null

  return (
    <div className="fixed left-2 top-2 sm:left-4 sm:top-4 z-50 max-w-[calc(100vw-1rem)] sm:max-w-none">
      <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg px-2 py-2 max-w-full">
        {/* Left: icon nav */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <NavIconButton
            tooltip={t('nav.back', lang)}
            onClick={() => {
              playSound('ui.click', { device })
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back()
              } else {
                router.push('/')
              }
            }}
          >
            <svg
              className="h-5 w-5 sm:h-6 sm:w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </NavIconButton>

          <NavIconLink
            href="/"
            active={pathname === '/'}
            tooltip={t('nav.home', lang)}
            onClick={() => playSound('ui.click', { device })}
          >
            🏠
          </NavIconLink>

          <div aria-hidden="true" className="h-7 w-px bg-white/20 mx-1" />

          <NavIconLink
            href={tvHref}
            active={tvActive}
            tooltip={lang === 'cs' ? 'TV Lobby' : 'TV Lobby'}
            onClick={() => playSound('ui.click', { device })}
          >
            📺
          </NavIconLink>

          <NavIconLink
            href="/profile"
            active={pathname.startsWith('/profile')}
            tooltip={lang === 'cs' ? 'Profil' : 'Profile'}
            onClick={() => playSound('ui.click', { device })}
          >
            👤
          </NavIconLink>

          <NavIconLink
            href="/leaderboard"
            active={pathname.startsWith('/leaderboard')}
            tooltip={lang === 'cs' ? 'Žebříček' : 'Leaderboard'}
            onClick={() => playSound('ui.click', { device })}
          >
            🏆
          </NavIconLink>

          <NavIconLink
            href="/traditions"
            active={pathname.startsWith('/traditions')}
            tooltip={t('nav.traditions', lang)}
            onClick={() => playSound('ui.click', { device })}
          >
            🎡
          </NavIconLink>
        </div>

        <div className="h-7 w-px bg-white/20 mx-1" />

        {/* Right: language + audio */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playSound('ui.click', { device })
              setLanguage('en')
              setLang('en')
              if (typeof window !== 'undefined') window.location.reload()
            }}
            className={`inline-flex items-center rounded-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${
              lang === 'en'
                ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white'
                : 'text-white/80 hover:bg-white/20 border border-transparent'
            }`}
            aria-label="Switch language to English"
            title="English"
          >
            EN
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('ui.click', { device })
              setLanguage('cs')
              setLang('cs')
              if (typeof window !== 'undefined') window.location.reload()
            }}
            className={`inline-flex items-center rounded-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition ${
              lang === 'cs'
                ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white'
                : 'text-white/80 hover:bg-white/20 border border-transparent'
            }`}
            aria-label="Switch language to Czech"
            title="Czech"
          >
            CS
          </button>

          <div className="h-7 w-px bg-white/20 mx-1" />
          <AudioControls className="shrink-0" />
        </div>
      </div>
    </div>
  )
}

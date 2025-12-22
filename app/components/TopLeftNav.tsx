'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getLanguage, setLanguage, t, type Language } from '@/lib/i18n'
import { useAudio } from '@/lib/contexts/AudioContext'
import AudioControls from '@/app/components/AudioControls'
import ViewportPanel from '@/app/components/ViewportPanel'

const STORAGE_KEY_ACTIVE_ROOM_ID = 'cgn_active_room_id'

function Icon({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center justify-center text-white/85 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)] transition-transform duration-150 ease-out motion-safe:group-hover:-translate-y-[1px] motion-safe:group-active:translate-y-[0px] motion-safe:group-active:scale-[0.98] [&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-6 sm:[&>svg]:w-6 [&>svg]:stroke-[2.25] ${className}`}
    >
      {children}
    </span>
  )
}

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M6.5 10.5V20h11V10.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  )
}

function IconTv() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="6" width="17" height="11" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 17v3" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="3.5" />
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 4h8v3a4 4 0 0 1-8 0V4Z" />
      <path d="M6 7H4a2 2 0 0 0 2 2" />
      <path d="M18 7h2a2 2 0 0 1-2 2" />
      <path d="M9 14h6" />
      <path d="M10 14v2.5a2 2 0 0 0 2 2 2 2 0 0 0 2-2V14" />
      <path d="M9 21h6" />
    </svg>
  )
}

function IconWheel() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="1.25" />
      <path d="M12 4.5v5.2" />
      <path d="M12 14.3v5.2" />
      <path d="M4.5 12h5.2" />
      <path d="M14.3 12h5.2" />
      <path d="M6.8 6.8l3.7 3.7" />
      <path d="M13.5 13.5l3.7 3.7" />
      <path d="M17.2 6.8l-3.7 3.7" />
      <path d="M10.5 13.5l-3.7 3.7" />
    </svg>
  )
}

function IconChevronLeft() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function IconGlobe() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
    </svg>
  )
}

function IconRuler() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 7H3a2 2 0 0 1 0-4h18a2 2 0 0 1 0 4Z" />
      <path d="M7 3v4" />
      <path d="M11 3v2" />
      <path d="M15 3v4" />
      <path d="M19 3v2" />
      <path d="M3 21V7" />
      <path d="M21 21V7" />
    </svg>
  )
}

function NavDivider() {
  return <div aria-hidden="true" className="hidden sm:block h-7 w-px bg-white/20 mx-1" />
}

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
      className={`relative group inline-flex items-center justify-center rounded-full h-9 w-9 sm:h-11 sm:w-11 border text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-christmas-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 before:absolute before:inset-0 before:rounded-full before:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_55%)] before:opacity-100 ${
        active
          ? 'bg-white/12 border-christmas-gold/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.42)]'
          : 'bg-white/8 border-white/15 hover:bg-white/11 hover:border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_8px_20px_rgba(0,0,0,0.38)]'
      }`}
    >
      {children}
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
      className={`relative group inline-flex items-center justify-center rounded-full h-9 w-9 sm:h-11 sm:w-11 border text-white transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-christmas-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 before:absolute before:inset-0 before:rounded-full before:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.16),transparent_55%)] before:opacity-100 ${
        active
          ? 'bg-white/12 border-christmas-gold/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_10px_26px_rgba(0,0,0,0.42)]'
          : 'bg-white/8 border-white/15 hover:bg-white/11 hover:border-white/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_8px_20px_rgba(0,0,0,0.38)]'
      }`}
    >
      {children}
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
  const [viewportOpen, setViewportOpen] = useState(false)
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
    <>
      <div className="fixed left-2 right-2 top-[calc(env(safe-area-inset-top)+0.5rem)] sm:left-4 sm:right-auto sm:top-[calc(env(safe-area-inset-top)+1rem)] z-50">
      <div className="flex w-full flex-nowrap items-center gap-1.5 sm:gap-2 rounded-2xl sm:rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg px-2 py-1.5 sm:py-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {/* Left: icon nav */}
        <div className="flex min-w-0 flex-nowrap items-center gap-1.5 sm:gap-2">
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
            <Icon className="text-white/85 group-hover:text-white">
              <IconChevronLeft />
            </Icon>
          </NavIconButton>

          <NavIconLink
            href="/"
            active={pathname === '/'}
            tooltip={t('nav.home', lang)}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="text-white/85 group-hover:text-white">
              <IconHome />
            </Icon>
          </NavIconLink>

          <NavDivider />

          <NavIconLink
            href={tvHref}
            active={tvActive}
            tooltip={lang === 'cs' ? 'TV Lobby' : 'TV Lobby'}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="text-white/85 group-hover:text-white">
              <IconTv />
            </Icon>
          </NavIconLink>

          <NavDivider />

          <NavIconLink
            href="/profile"
            active={pathname.startsWith('/profile')}
            tooltip={lang === 'cs' ? 'Profil' : 'Profile'}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="text-white/85 group-hover:text-white">
              <IconUser />
            </Icon>
          </NavIconLink>

          <NavDivider />

          <NavIconLink
            href="/leaderboard"
            active={pathname.startsWith('/leaderboard')}
            tooltip={lang === 'cs' ? 'Žebříček' : 'Leaderboard'}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="text-white/85 group-hover:text-white">
              <IconTrophy />
            </Icon>
          </NavIconLink>

          <NavDivider />

          <NavIconLink
            href="/traditions"
            active={pathname.startsWith('/traditions')}
            tooltip={t('nav.traditions', lang)}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="text-white/85 group-hover:text-white">
              <IconWheel />
            </Icon>
          </NavIconLink>
        </div>

        <NavDivider />

        {/* Right: language + audio */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {/* Mobile: compact language toggle */}
          <button
            type="button"
            onClick={() => {
              playSound('ui.click', { device })
              const next: Language = lang === 'en' ? 'cs' : 'en'
              setLanguage(next)
              setLang(next)
              if (typeof window !== 'undefined') window.location.reload()
            }}
            className={`sm:hidden inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold transition ${
              'bg-white/8 border border-white/15 hover:bg-white/11 hover:border-white/25'
            }`}
            aria-label="Switch language"
            title="Switch language"
          >
            <span className="text-white/85">
              <IconGlobe />
            </span>
            <span className="text-white">{lang.toUpperCase()}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              playSound('ui.click', { device })
              setLanguage('en')
              setLang('en')
              if (typeof window !== 'undefined') window.location.reload()
            }}
            className={`hidden sm:inline-flex items-center rounded-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-semibold transition ${
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
            className={`hidden sm:inline-flex items-center rounded-full px-2 sm:px-3 py-1 sm:py-2 text-xs sm:text-sm font-semibold transition ${
              lang === 'cs'
                ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white'
                : 'text-white/80 hover:bg-white/20 border border-transparent'
            }`}
            aria-label="Switch language to Czech"
            title="Czech"
          >
            CS
          </button>

          <div className="hidden sm:block h-7 w-px bg-white/20 mx-1" />

          <NavIconButton
            tooltip={lang === 'cs' ? 'Viewport' : 'Viewport'}
            onClick={() => {
              playSound('ui.click', { device })
              setViewportOpen(true)
            }}
          >
            <Icon className="text-white/85 group-hover:text-white">
              <IconRuler />
            </Icon>
          </NavIconButton>

          <AudioControls className="shrink-0" />
        </div>
      </div>
      </div>

      <ViewportPanel open={viewportOpen} onClose={() => setViewportOpen(false)} />
    </>
  )
}

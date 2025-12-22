'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getLanguage, setLanguage, t, type Language } from '@/lib/i18n'
import { useAudio } from '@/lib/contexts/AudioContext'
import AudioControls from '@/app/components/AudioControls'

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
      className={`inline-flex items-center justify-center transition-colors duration-200 [&>svg]:h-4 [&>svg]:w-4 sm:[&>svg]:h-5 sm:[&>svg]:w-5 [&>svg]:stroke-[2] ${className}`}
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


function NavDivider() {
  return <div aria-hidden="true" className="hidden sm:block h-6 w-px bg-wood-light/20 mx-0.5" />
}

function getRoomIdFromPathname(pathname: string): string | null {
  const m = pathname.match(/^\/room\/([^/]+)(?:\/|$)/)
  return m?.[1] ?? null
}

function NavIconLink({
  href,
  active,
  tooltip,
  label,
  children,
  onClick,
}: {
  href: string
  active?: boolean
  tooltip: string
  label: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={tooltip}
      title={tooltip}
      className={`relative group inline-flex flex-col items-center justify-center rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 border text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 ${
        active
          ? 'bg-wood-dark/50 border-fire-gold/40 text-fire-gold'
          : 'bg-transparent border-transparent hover:bg-wood-dark/30 hover:border-wood-light/20 text-white/85 hover:text-white'
      }`}
    >
      {children}
      <span className={`text-[9px] sm:text-[10px] font-medium mt-0.5 sm:mt-0.5 leading-tight text-center ${
        active ? 'text-fire-gold' : 'text-white/70 group-hover:text-white/90'
      }`}>
        {label}
      </span>
    </Link>
  )
}

function NavIconButton({
  active,
  tooltip,
  label,
  children,
  onClick,
}: {
  active?: boolean
  tooltip: string
  label: string
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={tooltip}
      title={tooltip}
      className={`relative group inline-flex flex-col items-center justify-center rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 border text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fire-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black/30 ${
        active
          ? 'bg-wood-dark/50 border-fire-gold/40 text-fire-gold'
          : 'bg-transparent border-transparent hover:bg-wood-dark/30 hover:border-wood-light/20 text-white/85 hover:text-white'
      }`}
    >
      {children}
      <span className={`text-[9px] sm:text-[10px] font-medium mt-0.5 sm:mt-0.5 leading-tight text-center ${
        active ? 'text-fire-gold' : 'text-white/70 group-hover:text-white/90'
      }`}>
        {label}
      </span>
    </button>
  )
}

export default function TopLeftNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [lang, setLang] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return getLanguage()
    }
    return 'en'
  })
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const { playSound, device } = useAudio()

  useEffect(() => {
    // Sync with localStorage on mount
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

  return (
    <>
      <div className="fixed left-1/2 -translate-x-1/2 top-[calc(env(safe-area-inset-top)+0.5rem)] sm:top-[calc(env(safe-area-inset-top)+1rem)] z-[100] max-w-[calc(100vw-1rem)] sm:max-w-none">
      <div className="flex flex-nowrap items-center gap-1 sm:gap-1.5 rounded-xl bg-wood-dark/30 backdrop-blur-xl border border-wood-light/20 px-1.5 py-1 sm:px-2 sm:py-1.5 overflow-x-auto overflow-y-visible [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 140, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}>
        {/* Left: icon nav */}
        <div className="flex min-w-0 flex-nowrap items-center gap-0.5 sm:gap-1">
          <NavIconButton
            tooltip={t('nav.back', lang)}
            label={lang === 'cs' ? 'Zpět' : 'Back'}
            onClick={() => {
              playSound('ui.click', { device })
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back()
              } else {
                router.push('/')
              }
            }}
          >
            <Icon className="group-hover:scale-105 transition-transform duration-200">
              <IconChevronLeft />
            </Icon>
          </NavIconButton>

          <NavIconLink
            href="/"
            active={pathname === '/'}
            tooltip={t('nav.home', lang)}
            label={lang === 'cs' ? 'Domů' : 'Home'}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="group-hover:scale-105 transition-transform duration-200">
              <IconHome />
            </Icon>
          </NavIconLink>

          <NavDivider />

          <NavIconLink
            href={tvHref}
            active={tvActive}
            tooltip={lang === 'cs' ? 'TV Lobby' : 'TV Lobby'}
            label={lang === 'cs' ? 'TV' : 'TV'}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="group-hover:scale-105 transition-transform duration-200">
              <IconTv />
            </Icon>
          </NavIconLink>

          <NavDivider />

          <NavIconLink
            href="/profile"
            active={pathname.startsWith('/profile')}
            tooltip={lang === 'cs' ? 'Profil' : 'Profile'}
            label={lang === 'cs' ? 'Profil' : 'Profile'}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="group-hover:scale-105 transition-transform duration-200">
              <IconUser />
            </Icon>
          </NavIconLink>

          <NavDivider />

          <NavIconLink
            href="/leaderboard"
            active={pathname.startsWith('/leaderboard')}
            tooltip={lang === 'cs' ? 'Žebříček' : 'Leaderboard'}
            label={lang === 'cs' ? 'Žebříček' : 'Board'}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="group-hover:scale-105 transition-transform duration-200">
              <IconTrophy />
            </Icon>
          </NavIconLink>

          <NavDivider />

          <NavIconLink
            href="/traditions"
            active={pathname.startsWith('/traditions')}
            tooltip={t('nav.traditions', lang)}
            label={lang === 'cs' ? 'Tradice' : 'Traditions'}
            onClick={() => playSound('ui.click', { device })}
          >
            <Icon className="group-hover:scale-105 transition-transform duration-200">
              <IconWheel />
            </Icon>
          </NavIconLink>
        </div>

        <NavDivider />

        {/* Right: language + audio */}
        <div className="flex items-center gap-1 sm:gap-1.5 ml-auto shrink-0">
          {/* Mobile: compact language toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              try {
                playSound('ui.click', { device })
              } catch (err) {
                console.warn('Failed to play sound:', err)
              }
              const next: Language = lang === 'en' ? 'cs' : 'en'
              setLanguage(next)
              setLang(next)
              // Use setTimeout to ensure localStorage is written before reload
              setTimeout(() => {
                if (typeof window !== 'undefined') window.location.reload()
              }, 50)
            }}
            className="sm:hidden inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition bg-transparent border border-transparent hover:bg-wood-dark/30 hover:border-wood-light/20 text-white/85 hover:text-white"
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
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              try {
                playSound('ui.click', { device })
              } catch (err) {
                console.warn('Failed to play sound:', err)
              }
              setLanguage('en')
              setLang('en')
              // Use setTimeout to ensure localStorage is written before reload
              setTimeout(() => {
                if (typeof window !== 'undefined') window.location.reload()
              }, 50)
            }}
            className={`hidden sm:inline-flex items-center rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition ${
              lang === 'en'
                ? 'bg-wood-dark/50 border border-fire-gold/40 text-fire-gold'
                : 'text-white/70 hover:bg-wood-dark/30 hover:border-wood-light/20 hover:text-white border border-transparent'
            }`}
            aria-label="Switch language to English"
            title="English"
          >
            EN
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              try {
                playSound('ui.click', { device })
              } catch (err) {
                console.warn('Failed to play sound:', err)
              }
              setLanguage('cs')
              setLang('cs')
              // Use setTimeout to ensure localStorage is written before reload
              setTimeout(() => {
                if (typeof window !== 'undefined') window.location.reload()
              }, 50)
            }}
            className={`hidden sm:inline-flex items-center rounded-lg px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs sm:text-sm font-medium transition ${
              lang === 'cs'
                ? 'bg-wood-dark/50 border border-fire-gold/40 text-fire-gold'
                : 'text-white/70 hover:bg-wood-dark/30 hover:border-wood-light/20 hover:text-white border border-transparent'
            }`}
            aria-label="Switch language to Czech"
            title="Czech"
          >
            CS
          </button>

          <div className="hidden sm:block h-6 w-px bg-wood-light/20 mx-1" />

          <AudioControls className="shrink-0" />
        </div>
      </div>
      </div>
    </>
  )
}

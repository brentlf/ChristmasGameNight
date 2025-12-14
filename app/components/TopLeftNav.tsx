'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getLanguage, setLanguage, type Language } from '@/lib/i18n'

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

export default function TopLeftNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [lang, setLang] = useState<Language>('en')

  useEffect(() => {
    setLang(getLanguage())
  }, [])

  // Don't show on home route.
  const showHome = pathname !== '/'
  const showBack = pathname !== '/'

  if (!showBack && !showHome) return null

  return (
    <div className="fixed left-4 top-4 z-50">
      <div className="flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg px-2 py-2">
        {showBack && (
          <button
            type="button"
            onClick={() => {
              // If there's browser history, go back; otherwise go home.
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back()
              } else {
                router.push('/')
              }
            }}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
            aria-label="Go back"
          >
            <IconArrowLeft className="h-5 w-5" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        {showHome && (
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
            aria-label="Go home"
          >
            <IconHome className="h-5 w-5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        )}

        <div className="h-6 w-px bg-white/20 mx-1" />

        <button
          type="button"
          onClick={() => {
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
      </div>
    </div>
  )
}

'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAudio } from '@/lib/contexts/AudioContext'
import { getLanguage, t, type Language } from '@/lib/i18n'

function IconSound(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M11 5L6 9H3v6h3l5 4V5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 8.5a4 4 0 0 1 0 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M18.5 6.5a7 7 0 0 1 0 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IconMute(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M11 5L6 9H3v6h3l5 4V5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M23 9l-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M17 9l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function AudioControls(props: { className?: string }) {
  const { className } = props
  const { device, settings, setSettings, toggleMute, playSound } = useAudio()

  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const lang = getLanguage()
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const musicPct = useMemo(() => Math.round((settings.music_volume ?? 0) * 100), [settings.music_volume])
  const sfxPct = useMemo(() => Math.round((settings.sfx_volume ?? 0) * 100), [settings.sfx_volume])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Update dropdown position on scroll/resize
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  useEffect(() => {
    if (!open || !buttonRef.current) return
    
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownStyle({
          top: `${rect.bottom + 8}px`,
          right: `${window.innerWidth - rect.right}px`,
        })
      }
    }
    
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  const muted = !settings.audio_enabled
  const musicOn = settings.music_enabled && settings.music_volume > 0 && !muted
  const sfxOn = settings.sfx_volume > 0 && !muted

  return (
    <div className={className}>
      <div className="relative">
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            try {
              playSound('ui.click', { device })
            } catch (err) {
              console.warn('Failed to play click sound:', err)
            }
            setOpen((v) => !v)
          }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg px-2.5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition active:scale-[0.98]"
          aria-label={t('audio.settings', lang)}
        >
          {muted ? <IconMute className="h-5 w-5" /> : <IconSound className="h-5 w-5" />}
          <span className="hidden sm:inline" suppressHydrationWarning>
            {mounted ? (muted ? (lang === 'cs' ? 'Ztlumeno' : 'Muted') : `${sfxPct}%`) : ''}
          </span>
        </button>

        {open && typeof document !== 'undefined' && createPortal(
          <div 
            ref={dropdownRef} 
            className="fixed w-64 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-xl p-4 z-[60]"
            style={dropdownStyle}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-bold text-white">{lang === 'cs' ? 'Zvuk' : 'Audio'}</p>
              <button
                type="button"
                onClick={() => {
                  playSound('ui.click', { device })
                  toggleMute()
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  muted ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                {muted ? (lang === 'cs' ? 'Ztlumeno' : 'Muted') : (lang === 'cs' ? 'Ztlumit' : 'Mute')}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-bold text-white">{t('audio.music', lang)}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  try {
                    playSound('ui.click', { device })
                  } catch (err) {
                    console.warn('Failed to play click sound:', err)
                  }
                  setSettings({ music_enabled: !settings.music_enabled })
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  musicOn ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                {musicOn ? t('audio.on', lang) : t('audio.off', lang)}
              </button>
            </div>

            <label className="block text-xs text-white/70 mb-2">{t('audio.volume', lang)}: {musicPct}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={musicPct}
              onChange={(e) => {
                const v = Number(e.target.value) / 100
                setSettings({ music_enabled: v > 0, music_volume: v })
              }}
              className="w-full"
              disabled={muted}
            />

            <div className="my-4 h-px bg-white/10" />

            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-bold text-white">{t('audio.effects', lang)}</p>
              <button
                type="button"
                onClick={() => {
                  playSound('ui.click', { device })
                  setSettings({ sfx_volume: settings.sfx_volume > 0 ? 0 : device === 'tv' ? 0.35 : 0.25 })
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  sfxOn ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                {sfxOn ? t('audio.on', lang) : t('audio.off', lang)}
              </button>
            </div>

            <label className="block text-xs text-white/70 mb-2">{t('audio.volume', lang)}: {sfxPct}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={sfxPct}
              onChange={(e) => {
                const v = Number(e.target.value) / 100
                setSettings({ sfx_volume: v })
              }}
              className="w-full"
              disabled={muted}
            />

            {device === 'phone' && (
              <>
                <div className="my-4 h-px bg-white/10" />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white">{lang === 'cs' ? 'Haptika' : 'Haptics'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('ui.click', { device })
                      setSettings({ haptics_enabled: !settings.haptics_enabled })
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      settings.haptics_enabled ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                    }`}
                    disabled={muted}
                  >
                    {settings.haptics_enabled ? t('audio.on', lang) : t('audio.off', lang)}
                  </button>
                </div>
              </>
            )}

            {device === 'tv' && (
              <>
                <div className="my-4 h-px bg-white/10" />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-white">{lang === 'cs' ? 'Odpočet' : 'Countdown ticks'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      playSound('ui.click', { device })
                      setSettings({ countdown_tick_enabled: !settings.countdown_tick_enabled })
                    }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                      settings.countdown_tick_enabled ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                    }`}
                    disabled={muted}
                  >
                    {settings.countdown_tick_enabled ? t('audio.on', lang) : t('audio.off', lang)}
                  </button>
                </div>
                <p className="text-[11px] text-white/50 mt-2">
                  {lang === 'cs' ? 'Pípnutí jen posledních 5 sekund.' : 'Ticks only during the last 5 seconds.'}
                </p>
              </>
            )}

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  playSound('ui.click', { device })
                  setSettings({
                    audio_enabled: false,
                    music_enabled: false,
                    music_volume: 0,
                    sfx_volume: 0,
                  })
                }}
                className="btn-secondary w-full text-xs"
              >
                {t('audio.muteAll', lang)}
              </button>
            </div>

            <p className="text-[11px] text-white/50 mt-3">
              {t('audio.browserNote', lang)}
            </p>
          </div>
        , document.body)}
      </div>
    </div>
  )
}


'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAudio } from '@/lib/contexts/AudioContext'
import { getLanguage, t, type Language } from '@/lib/i18n'

function IconMusic(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M9 18V6l12-2v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9 18a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M21 16a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  )
}

export default function AudioControls() {
  const {
    backgroundMusicEnabled,
    setBackgroundMusicEnabled,
    backgroundMusicVolume,
    setBackgroundMusicVolume,
    soundEffectsEnabled,
    setSoundEffectsEnabled,
    soundEffectsVolume,
    setSoundEffectsVolume,
    playSound,
  } = useAudio()

  const [open, setOpen] = useState(false)
  const lang = getLanguage()

  // Persist audio settings so it feels consistent across the night.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cgn_audio_settings')
      if (!raw) return
      const parsed = JSON.parse(raw) as {
        musicEnabled?: boolean
        musicVolume?: number
        sfxEnabled?: boolean
        sfxVolume?: number
      }
      if (typeof parsed.musicEnabled === 'boolean') setBackgroundMusicEnabled(parsed.musicEnabled)
      if (typeof parsed.musicVolume === 'number' && Number.isFinite(parsed.musicVolume)) {
        setBackgroundMusicVolume(Math.min(1, Math.max(0, parsed.musicVolume)))
      }
      if (typeof parsed.sfxEnabled === 'boolean') setSoundEffectsEnabled(parsed.sfxEnabled)
      if (typeof parsed.sfxVolume === 'number' && Number.isFinite(parsed.sfxVolume)) {
        setSoundEffectsVolume(Math.min(1, Math.max(0, parsed.sfxVolume)))
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(
        'cgn_audio_settings',
        JSON.stringify({
          musicEnabled: backgroundMusicEnabled,
          musicVolume: backgroundMusicVolume,
          sfxEnabled: soundEffectsEnabled,
          sfxVolume: soundEffectsVolume,
        }),
      )
    } catch {
      // ignore
    }
  }, [backgroundMusicEnabled, backgroundMusicVolume, soundEffectsEnabled, soundEffectsVolume])

  const volumePct = useMemo(() => Math.round(backgroundMusicVolume * 100), [backgroundMusicVolume])
  const sfxPct = useMemo(() => Math.round(soundEffectsVolume * 100), [soundEffectsVolume])

  return (
    <div className="fixed right-4 top-4 z-50">
      <div className="relative">
        <button
          type="button"
          onClick={() => {
            playSound('click')
            setOpen((v) => !v)
          }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-lg px-3 py-2 text-sm font-semibold text-white hover:bg-white/20 transition"
          aria-label={t('audio.settings', lang)}
        >
          <IconMusic className="h-5 w-5" />
          <span className="hidden sm:inline">{backgroundMusicEnabled ? `${volumePct}%` : 'Off'}</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-bold text-white">{t('audio.music', lang)}</p>
              <button
                type="button"
                onClick={() => {
                  playSound('click')
                  setBackgroundMusicEnabled(!backgroundMusicEnabled)
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  backgroundMusicEnabled ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                {backgroundMusicEnabled ? t('audio.on', lang) : t('audio.off', lang)}
              </button>
            </div>

            <label className="block text-xs text-white/70 mb-2">{t('audio.volume', lang)}: {volumePct}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={volumePct}
              onChange={(e) => {
                const v = Number(e.target.value) / 100
                // Treat 0% as true "Off" (pause), not just silent playback.
                setBackgroundMusicEnabled(v > 0)
                setBackgroundMusicVolume(v)
              }}
              className="w-full"
            />

            <div className="my-4 h-px bg-white/10" />

            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-bold text-white">{t('audio.effects', lang)}</p>
              <button
                type="button"
                onClick={() => {
                  playSound('click')
                  setSoundEffectsEnabled(!soundEffectsEnabled)
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition ${
                  soundEffectsEnabled ? 'bg-christmas-gold/25 border border-christmas-gold/40 text-white' : 'bg-white/10 text-white/80 hover:bg-white/15'
                }`}
              >
                {soundEffectsEnabled ? t('audio.on', lang) : t('audio.off', lang)}
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
                setSoundEffectsEnabled(v > 0)
                setSoundEffectsVolume(v)
              }}
              className="w-full"
            />

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  playSound('click')
                  setBackgroundMusicEnabled(false)
                  setBackgroundMusicVolume(0)
                  setSoundEffectsEnabled(false)
                  setSoundEffectsVolume(0)
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
        )}
      </div>
    </div>
  )
}


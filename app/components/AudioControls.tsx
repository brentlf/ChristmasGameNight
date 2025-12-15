'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAudio } from '@/lib/contexts/AudioContext'

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
    playSound,
  } = useAudio()

  const [open, setOpen] = useState(false)

  // Persist only music settings (so it feels "always on").
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cgn_audio_music')
      if (!raw) return
      const parsed = JSON.parse(raw) as { enabled?: boolean; volume?: number }
      if (typeof parsed.enabled === 'boolean') setBackgroundMusicEnabled(parsed.enabled)
      if (typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)) {
        setBackgroundMusicVolume(Math.min(1, Math.max(0, parsed.volume)))
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('cgn_audio_music', JSON.stringify({ enabled: backgroundMusicEnabled, volume: backgroundMusicVolume }))
    } catch {
      // ignore
    }
  }, [backgroundMusicEnabled, backgroundMusicVolume])

  const volumePct = useMemo(() => Math.round(backgroundMusicVolume * 100), [backgroundMusicVolume])

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
          aria-label="Audio settings"
        >
          <IconMusic className="h-5 w-5" />
          <span className="hidden sm:inline">{backgroundMusicEnabled ? `${volumePct}%` : 'Off'}</span>
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-md shadow-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm font-bold text-white">Music</p>
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
                {backgroundMusicEnabled ? 'On' : 'Off'}
              </button>
            </div>

            <label className="block text-xs text-white/70 mb-2">Volume: {volumePct}%</label>
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

            <p className="text-[11px] text-white/50 mt-3">
              Note: browsers require a tap/click before audio can start.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}


'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface AudioContextType {
  playSound: (soundName: SoundName, volume?: number) => void;
  setBackgroundMusicEnabled: (enabled: boolean) => void;
  backgroundMusicEnabled: boolean;
  backgroundMusicVolume: number;
  setBackgroundMusicVolume: (volume: number) => void;
  soundEffectsEnabled: boolean;
  setSoundEffectsEnabled: (enabled: boolean) => void;
  soundEffectsVolume: number;
  setSoundEffectsVolume: (volume: number) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

// Sound effect definitions - add your audio files to public/audio/
const SOUND_EFFECTS = {
  // Christmas theme
  // Use the bell for all button clicks (per request).
  click: '/audio/bell.ogg',
  success: '/audio/success.ogg',
  ding: '/audio/ding.ogg',
  jingle: '/audio/jingle.ogg',
  pageTurn: '/audio/snowstep.ogg',
  whoosh: '/audio/whoosh.ogg',
  bell: '/audio/bell.ogg',
  cheer: '/audio/cheer.ogg',
  sleighbells: '/audio/sleighbells.mp3',
  hohoho: '/audio/hohoho.mp3',
} as const;

type SoundName = keyof typeof SOUND_EFFECTS;

const SFX_VOLUME_MULTIPLIER: Record<SoundName, number> = {
  click: 0.9,
  success: 1,
  ding: 0.85,
  jingle: 1,
  pageTurn: 0.7,
  whoosh: 0.8,
  bell: 0.9,
  cheer: 1,
  sleighbells: 1,
  hohoho: 1,
};

const SFX_COOLDOWN_MS: Record<SoundName, number> = {
  click: 80,
  success: 250,
  ding: 200,
  jingle: 700,
  pageTurn: 250,
  whoosh: 200,
  bell: 500,
  cheer: 1200,
  sleighbells: 1200,
  hohoho: 1200,
};

// Optional (not bundled by default). If you add a track, put it in public/audio/.
const BACKGROUND_MUSIC = '/audio/christmas-ambient.ogg';

export function AudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Default to off on phone views, on for TV/desktop
  const isPhoneView = pathname?.includes('/play') && !pathname?.includes('/tv');
  const [backgroundMusicEnabled, setBackgroundMusicEnabled] = useState(!isPhoneView);
  const [backgroundMusicVolume, setBackgroundMusicVolume] = useState(0.12); // Very subtle, 12%
  // Default to off unless audio files exist (prevents noisy 404s in dev).
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(false);
  const [soundEffectsVolume, setSoundEffectsVolume] = useState(0.25); // Subtle, 25%
  
  // Update music state when route changes
  useEffect(() => {
    const currentIsPhoneView = pathname?.includes('/play') && !pathname?.includes('/tv');
    setBackgroundMusicEnabled(!currentIsPhoneView);
  }, [pathname]);
  
  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const soundEffectsCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const hasInteracted = useRef(false);
  // Avoid spamming 404 requests when audio files aren't present in /public/audio.
  const soundAvailability = useRef<Map<string, 'unknown' | 'ok' | 'missing'>>(new Map());
  const bgAvailability = useRef<'unknown' | 'ok' | 'missing'>('unknown');
  const sfxChecked = useRef(false);
  const lastPlayedAt = useRef<Map<SoundName, number>>(new Map());
  // Fix a race: if user toggles music off before the audio element is created,
  // we still need to apply the current enabled/volume once it becomes available.
  const [bgReadyTick, setBgReadyTick] = useState(0);

  // Enable SFX only if at least one core file exists (click is our sentinel).
  // Also pre-check a handful of commonly-used SFX so the first click feels responsive.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (sfxChecked.current) return;
    sfxChecked.current = true;

    const core: SoundName[] = ['click', 'success', 'ding', 'whoosh', 'pageTurn'];
    const sentinel = SOUND_EFFECTS.click;

    fetch(sentinel, { method: 'HEAD', cache: 'no-store' })
      .then((res) => {
        if (res.ok) {
          soundAvailability.current.set('click', 'ok');
          setSoundEffectsEnabled(true);
        } else {
          setSoundEffectsEnabled(false);
        }
      })
      .catch(() => setSoundEffectsEnabled(false));

    core.forEach((name) => {
      const soundPath = SOUND_EFFECTS[name];
      fetch(soundPath, { method: 'HEAD', cache: 'no-store' })
        .then((res) => {
          soundAvailability.current.set(name, res.ok ? 'ok' : 'missing');
          if (!res.ok) soundEffectsCache.current.delete(name);
        })
        .catch(() => {
          soundAvailability.current.set(name, 'missing');
          soundEffectsCache.current.delete(name);
        });
    });
  }, []);

  // Initialize background music
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // If the file doesn't exist, don't keep trying to load it.
    // (This project ships without audio files by default; see AUDIO_SETUP.md)
    const check = async () => {
      if (bgAvailability.current !== 'unknown') return bgAvailability.current;
      try {
        const res = await fetch(BACKGROUND_MUSIC, { method: 'HEAD', cache: 'no-store' });
        bgAvailability.current = res.ok ? 'ok' : 'missing';
      } catch {
        bgAvailability.current = 'missing';
      }
      return bgAvailability.current;
    };

    let audio: HTMLAudioElement | null = null;

    check().then((avail) => {
      if (avail !== 'ok') {
        // Disable background music if missing to avoid console noise.
        setBackgroundMusicEnabled(false);
        return;
      }

      audio = new Audio(BACKGROUND_MUSIC);
      audio.loop = true;
      // Initial volume will be corrected in the sync effect below.
      audio.volume = 0;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      audio.addEventListener('error', () => {
        bgAvailability.current = 'missing';
        setBackgroundMusicEnabled(false);
      });

      backgroundMusicRef.current = audio;
      setBgReadyTick((n) => n + 1);

      // Only try to play if music is currently enabled.
      if (backgroundMusicEnabled) {
        audio.play().catch(() => {
          // Autoplay blocked - will start on user interaction
        });
      }
    });

    // Start playing when user interacts with page
    const handleInteraction = () => {
      hasInteracted.current = true;
      const a = backgroundMusicRef.current;
      if (backgroundMusicEnabled && a && a.paused) {
        a.play().catch(() => {
          // User may have blocked autoplay
        });
      }
    };

    const events = ['click', 'keydown', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, []);

  // Update background music volume and enabled state
  useEffect(() => {
    if (!backgroundMusicRef.current) return;
    
    backgroundMusicRef.current.volume = backgroundMusicEnabled ? backgroundMusicVolume : 0;
    
    if (backgroundMusicEnabled && hasInteracted.current && backgroundMusicRef.current.paused) {
      backgroundMusicRef.current.play().catch(() => {
        // May fail if user hasn't interacted yet or autoplay blocked
      });
    } else if (!backgroundMusicEnabled) {
      backgroundMusicRef.current.pause();
    }
  }, [backgroundMusicEnabled, backgroundMusicVolume, bgReadyTick]);

  // Update sound effects volume
  useEffect(() => {
    soundEffectsCache.current.forEach((audio) => {
      audio.volume = soundEffectsVolume;
    });
  }, [soundEffectsVolume]);

  const playSound = useCallback((soundName: SoundName, volume?: number) => {
    if (!soundEffectsEnabled) return;

    // Avoid SFX while tab is hidden (prevents weird "catch-up" sounds).
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

    const now = Date.now();
    const last = lastPlayedAt.current.get(soundName) ?? 0;
    const cooldownMs = SFX_COOLDOWN_MS[soundName] ?? 0;
    if (cooldownMs > 0 && now - last < cooldownMs) return;
    lastPlayedAt.current.set(soundName, now);
    
    const soundPath = SOUND_EFFECTS[soundName];
    if (!soundPath) {
      console.warn(`Sound effect "${soundName}" not found`);
      return;
    }

    const availability = soundAvailability.current.get(soundName) ?? 'unknown';
    if (availability === 'missing') return;

    // If we haven't confirmed the file exists yet, do a cheap one-time HEAD check.
    // IMPORTANT: Don't create `new Audio(...)` until we know it exists, otherwise
    // the browser will spam 404s to the console.
    if (availability === 'unknown') {
      fetch(soundPath, { method: 'HEAD', cache: 'no-store' })
        .then((res) => {
          soundAvailability.current.set(soundName, res.ok ? 'ok' : 'missing');
          if (!res.ok) {
            soundEffectsCache.current.delete(soundName);
          }
        })
        .catch(() => {
          soundAvailability.current.set(soundName, 'missing');
          soundEffectsCache.current.delete(soundName);
        });
      // Don’t attempt playback on the very first call; if the file exists it’ll work next click.
      return;
    }

    // Use cached audio or create new one (safe because availability === 'ok')
    let audio = soundEffectsCache.current.get(soundName);
    if (!audio) {
      audio = new Audio(soundPath);
      audio.preload = 'auto';
      const base = volume !== undefined ? Math.min(1, Math.max(0, volume)) : soundEffectsVolume * (SFX_VOLUME_MULTIPLIER[soundName] ?? 1);
      audio.volume = Math.min(1, Math.max(0, base));
      audio.addEventListener('error', () => {
        soundAvailability.current.set(soundName, 'missing');
        soundEffectsCache.current.delete(soundName);
      });
      audio.addEventListener('canplaythrough', () => {
        soundAvailability.current.set(soundName, 'ok');
      });
      soundEffectsCache.current.set(soundName, audio);
    }

    // Clone for overlapping sounds (reset to start)
    const audioClone = audio.cloneNode() as HTMLAudioElement;
    const base = volume !== undefined ? Math.min(1, Math.max(0, volume)) : soundEffectsVolume * (SFX_VOLUME_MULTIPLIER[soundName] ?? 1);
    audioClone.volume = Math.min(1, Math.max(0, base));
    
    audioClone.play().catch(() => {
      // Silently fail if audio can't play (e.g., user hasn't interacted)
    });
  }, [soundEffectsEnabled, soundEffectsVolume]);

  // Global UI policy: every <button> click gets the "click" sound (a bell).
  // Existing explicit playSound('click') calls will be naturally de-duped by the cooldown.
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const btn = target?.closest?.('button') as HTMLButtonElement | null;
      if (!btn) return;
      if (btn.disabled) return;

      playSound('click');
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
    // Intentionally depends on playSound so it stays current.
  }, [playSound]);

  const value = useMemo(
    () => ({
      playSound,
      setBackgroundMusicEnabled,
      backgroundMusicEnabled,
      backgroundMusicVolume,
      setBackgroundMusicVolume,
      soundEffectsEnabled,
      setSoundEffectsEnabled,
      soundEffectsVolume,
      setSoundEffectsVolume,
    }),
    [
      playSound,
      setBackgroundMusicEnabled,
      backgroundMusicEnabled,
      backgroundMusicVolume,
      setBackgroundMusicVolume,
      soundEffectsEnabled,
      setSoundEffectsEnabled,
      soundEffectsVolume,
      setSoundEffectsVolume,
    ],
  );

  return (
    <AudioContext.Provider
      value={value}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

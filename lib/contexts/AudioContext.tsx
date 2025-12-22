'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AUDIO_EVENT_MAP, BACKGROUND_MUSIC_SOURCES, legacyToEvent, type AudioDevice, type AudioEventName } from '@/lib/audio/audioEventMap';

type AudioSettings = {
  audio_enabled: boolean;
  music_enabled: boolean;
  sfx_volume: number; // 0..1
  music_volume: number; // 0..1
  haptics_enabled: boolean;
  countdown_tick_enabled: boolean; // TV-only optional
};

interface AudioContextType {
  device: AudioDevice;
  settings: AudioSettings;
  setSettings: (next: Partial<AudioSettings>) => void;
  toggleMute: () => void;
  preload: (events?: AudioEventName[]) => void;
  playSound: (
    eventName: AudioEventName | string,
    opts?: { device?: AudioDevice; gain?: number; force?: boolean } | number,
  ) => void;
  vibrate: (pattern: number | number[], opts?: { device?: AudioDevice }) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

const SETTINGS_KEYS = {
  audio_enabled: 'audio_enabled',
  music_enabled: 'music_enabled',
  sfx_volume: 'sfx_volume',
  music_volume: 'music_volume',
  haptics_enabled: 'haptics_enabled',
  countdown_tick_enabled: 'countdown_tick_enabled',
} as const;

function clamp01(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function guessDevice(pathname: string | null | undefined): AudioDevice {
  // In this app, controllers live under /play, TV hubs live under /tv.
  if (!pathname) return 'tv';
  if (pathname.includes('/tv')) return 'tv';
  // Phone controller routes
  if (pathname.includes('/play')) return 'phone';
  if (pathname.includes('/minigames')) return 'phone';
  // Most non-TV room routes are used on phones (controllers).
  if (pathname.startsWith('/room/')) return 'phone';
  // Default: treat non-controller screens as "TV hub" (more atmospheric).
  return 'tv';
}

function loadSettings(device: AudioDevice): AudioSettings {
  const defaults: AudioSettings =
    device === 'tv'
      ? {
          audio_enabled: true,
          music_enabled: true,
          sfx_volume: 0.35,
          music_volume: 0.08,
          haptics_enabled: false,
          countdown_tick_enabled: true,
        }
      : {
          audio_enabled: true,
          music_enabled: false,
          sfx_volume: 0.25,
          music_volume: 0,
          haptics_enabled: true,
          countdown_tick_enabled: false,
        };

  if (typeof window === 'undefined') return defaults;
  try {
    // Required keys (explicit), with fallback to prior JSON store.
    const ae = localStorage.getItem(SETTINGS_KEYS.audio_enabled);
    const me = localStorage.getItem(SETTINGS_KEYS.music_enabled);
    const sv = localStorage.getItem(SETTINGS_KEYS.sfx_volume);
    const mv = localStorage.getItem(SETTINGS_KEYS.music_volume);
    const he = localStorage.getItem(SETTINGS_KEYS.haptics_enabled);
    const te = localStorage.getItem(SETTINGS_KEYS.countdown_tick_enabled);

    const parsed: Partial<AudioSettings> = {};
    if (ae !== null) parsed.audio_enabled = ae === '1' || ae === 'true';
    if (me !== null) parsed.music_enabled = me === '1' || me === 'true';
    if (sv !== null) parsed.sfx_volume = clamp01(Number(sv));
    if (mv !== null) parsed.music_volume = clamp01(Number(mv));
    if (he !== null) parsed.haptics_enabled = he === '1' || he === 'true';
    if (te !== null) parsed.countdown_tick_enabled = te === '1' || te === 'true';

    // Migrate from old JSON key (kept for back-compat).
    const legacyRaw = localStorage.getItem('cgn_audio_settings');
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as {
        musicEnabled?: boolean;
        musicVolume?: number;
        sfxEnabled?: boolean;
        sfxVolume?: number;
      };
      if (typeof parsed.music_enabled !== 'boolean' && typeof legacy.musicEnabled === 'boolean') parsed.music_enabled = legacy.musicEnabled;
      if (typeof parsed.music_volume !== 'number' && typeof legacy.musicVolume === 'number') parsed.music_volume = clamp01(legacy.musicVolume);
      if (typeof parsed.audio_enabled !== 'boolean' && typeof legacy.sfxEnabled === 'boolean') parsed.audio_enabled = legacy.sfxEnabled || legacy.musicEnabled || true;
      if (typeof parsed.sfx_volume !== 'number' && typeof legacy.sfxVolume === 'number') parsed.sfx_volume = clamp01(legacy.sfxVolume);
    }

    return { ...defaults, ...parsed };
  } catch {
    return defaults;
  }
}

function persistSettings(s: AudioSettings) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEYS.audio_enabled, String(s.audio_enabled));
    localStorage.setItem(SETTINGS_KEYS.music_enabled, String(s.music_enabled));
    localStorage.setItem(SETTINGS_KEYS.sfx_volume, String(clamp01(s.sfx_volume)));
    localStorage.setItem(SETTINGS_KEYS.music_volume, String(clamp01(s.music_volume)));
    localStorage.setItem(SETTINGS_KEYS.haptics_enabled, String(Boolean(s.haptics_enabled)));
    localStorage.setItem(SETTINGS_KEYS.countdown_tick_enabled, String(Boolean(s.countdown_tick_enabled)));

    // Keep legacy JSON key updated for any existing code reading it.
    localStorage.setItem(
      'cgn_audio_settings',
      JSON.stringify({
        musicEnabled: s.music_enabled,
        musicVolume: clamp01(s.music_volume),
        sfxEnabled: s.audio_enabled, // legacy conflates enable with sfx
        sfxVolume: clamp01(s.sfx_volume),
      }),
    );
  } catch {
    // ignore
  }
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const device = useMemo(() => guessDevice(pathname), [pathname]);
  const [settings, setSettingsState] = useState<AudioSettings>(() => loadSettings(device));

  // Keep settings in sync if device flips (rare, but possible on route change).
  useEffect(() => {
    setSettingsState((prev) => {
      // If user already has explicit keys set, do not overwrite with defaults.
      const loaded = loadSettings(device);
      return { ...loaded, ...prev };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device]);

  useEffect(() => {
    persistSettings(settings);
  }, [settings]);

  const backgroundMusicRef = useRef<HTMLAudioElement | null>(null);
  const bgSrcRef = useRef<string | null>(null);
  const hasInteracted = useRef(false);
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());
  const availability = useRef<Map<string, 'unknown' | 'ok' | 'missing'>>(new Map());
  const lastPlayedAt = useRef<Map<string, number>>(new Map());

  const deviceSfxMultiplier = device === 'tv' ? 1.0 : 0.75;
  const deviceMusicMultiplier = device === 'tv' ? 1.0 : 0.0; // phones default silent unless enabled

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const safeFetch = async (url: string) => {
      try {
        return await fetch(url, { method: 'HEAD', cache: 'no-store' });
      } catch (error: any) {
        if (error?.message?.includes('CACHE_OPERATION_NOT_SUPPORTED')) return await fetch(url, { method: 'HEAD' });
        return await fetch(url, { method: 'HEAD' });
      }
    };

    let cancelled = false;
    (async () => {
      // pick first available music source
      for (const src of BACKGROUND_MUSIC_SOURCES) {
        if (availability.current.get(src) === 'missing') continue;
        const known = availability.current.get(src) ?? 'unknown';
        if (known === 'unknown') {
          try {
            const res = await safeFetch(src);
            availability.current.set(src, res.ok ? 'ok' : 'missing');
          } catch {
            availability.current.set(src, 'missing');
          }
        }
        if (availability.current.get(src) === 'ok') {
          if (cancelled) return;
          bgSrcRef.current = src;
          const a = new Audio(src);
          a.loop = true;
          a.preload = 'auto';
          a.crossOrigin = 'anonymous';
          a.volume = 0;
          backgroundMusicRef.current = a;
          break;
        }
      }
    })();

    // Start playing when user interacts with page
    const handleInteraction = () => {
      hasInteracted.current = true;
      const a = backgroundMusicRef.current;
      if (!a) return;
      const enabled = settings.audio_enabled && settings.music_enabled && clamp01(settings.music_volume) > 0;
      if (!enabled) return;
      if (a.paused) a.play().catch(() => {});
    };

    const events = ['click', 'keydown', 'touchstart'];
    events.forEach((event) => {
      document.addEventListener(event, handleInteraction, { once: true, passive: true });
    });

    return () => {
      cancelled = true;
      if (backgroundMusicRef.current) {
        backgroundMusicRef.current.pause();
        backgroundMusicRef.current.src = '';
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleInteraction);
      });
    };
  }, [settings.audio_enabled, settings.music_enabled, settings.music_volume]);

  useEffect(() => {
    const a = backgroundMusicRef.current;
    if (!a) return;
    const enabled = settings.audio_enabled && settings.music_enabled && clamp01(settings.music_volume) > 0;
    const volume = enabled ? clamp01(settings.music_volume) * deviceMusicMultiplier : 0;
    a.volume = volume;
    if (!enabled) a.pause();
    else if (enabled && hasInteracted.current && a.paused) a.play().catch(() => {});
  }, [settings.audio_enabled, settings.music_enabled, settings.music_volume, deviceMusicMultiplier]);

  const safeHead = useCallback(async (url: string) => {
    try {
      return await fetch(url, { method: 'HEAD', cache: 'no-store' });
    } catch (error: any) {
      if (error?.message?.includes('CACHE_OPERATION_NOT_SUPPORTED')) return await fetch(url, { method: 'HEAD' });
      return await fetch(url, { method: 'HEAD' });
    }
  }, []);

  const resolveFirstAvailableSrc = useCallback(
    async (srcs: string[]) => {
      for (const src of srcs) {
        const state = availability.current.get(src) ?? 'unknown';
        if (state === 'missing') continue;
        if (state === 'ok') return src;
        try {
          const res = await safeHead(src);
          availability.current.set(src, res.ok ? 'ok' : 'missing');
          if (res.ok) return src;
        } catch {
          availability.current.set(src, 'missing');
        }
      }
      return null;
    },
    [safeHead],
  );

  const preload = useCallback(
    (events?: AudioEventName[]) => {
      if (typeof window === 'undefined') return;
      const list = events && events.length > 0 ? events : (Object.keys(AUDIO_EVENT_MAP) as AudioEventName[]);
      // Fire and forget.
      list.forEach(async (ev) => {
        const def = AUDIO_EVENT_MAP[ev];
        const src = await resolveFirstAvailableSrc(def.src);
        if (!src) return;
        if (audioCache.current.has(src)) return;
        const a = new Audio(src);
        a.preload = 'auto';
        a.volume = 0;
        a.addEventListener('error', () => {
          availability.current.set(src, 'missing');
          audioCache.current.delete(src);
        });
        audioCache.current.set(src, a);
      });
    },
    [resolveFirstAvailableSrc],
  );

  const vibrate = useCallback(
    (pattern: number | number[], opts?: { device?: AudioDevice }) => {
      const d = opts?.device ?? device;
      if (d !== 'phone') return;
      if (!settings.audio_enabled) return; // Respect master mute
      if (!settings.haptics_enabled) return;
      if (typeof navigator === 'undefined') return;
      const vib = (navigator as any).vibrate as undefined | ((p: number | number[]) => boolean);
      if (!vib) return;
      try {
        vib(pattern);
      } catch {
        // ignore
      }
    },
    [device, settings.audio_enabled, settings.haptics_enabled],
  );

  const playSound = useCallback(
    (eventName: AudioEventName | string, opts?: { device?: AudioDevice; gain?: number; force?: boolean } | number) => {
      // Avoid sounds while tab is hidden (prevents weird "catch-up" sounds).
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;

      const normalizedOpts =
        typeof opts === 'number' ? ({ gain: opts } as { device?: AudioDevice; gain?: number; force?: boolean }) : opts;

      const d = normalizedOpts?.device ?? device;
      const mapped = (AUDIO_EVENT_MAP as any)[eventName] ? (eventName as AudioEventName) : legacyToEvent(eventName);
      if (!mapped) return;

      const def = AUDIO_EVENT_MAP[mapped];
      if (def.allow && !def.allow.includes(d)) return;
      if (!settings.audio_enabled && !normalizedOpts?.force) return;
      if (def.tvOptional && d === 'tv' && !settings.countdown_tick_enabled) return;

      const now = Date.now();
      const lastKey = `${mapped}:${d}`;
      const last = lastPlayedAt.current.get(lastKey) ?? 0;
      const cooldownMs = def.cooldownMs ?? 0;
      if (cooldownMs > 0 && now - last < cooldownMs) return;
      lastPlayedAt.current.set(lastKey, now);

      const groupVol = def.group === 'music' ? settings.music_volume : settings.sfx_volume;
      const groupEnabled = def.group === 'music' ? settings.music_enabled : true;
      if (!groupEnabled && !normalizedOpts?.force) return;
      if (def.group === 'music') return; // music handled separately

      const multiplier = def.group === 'sfx' ? deviceSfxMultiplier : 1;
      const baseGain = clamp01(groupVol) * multiplier * (def.gain ?? 1) * clamp01(normalizedOpts?.gain ?? 1);
      if (baseGain <= 0.0001) return;

      // Resolve best src without causing 404 spam.
      const tryPlay = async () => {
        const src = await resolveFirstAvailableSrc(def.src);
        if (!src) return;
        const cached = audioCache.current.get(src);
        const base = cached ?? new Audio(src);
        if (!cached) {
          base.preload = 'auto';
          base.addEventListener('error', () => {
            availability.current.set(src, 'missing');
            audioCache.current.delete(src);
          });
          audioCache.current.set(src, base);
        }

        // Clone to allow overlap. (Safari is happier with clones than restarting same element.)
        const node = base.cloneNode(true) as HTMLAudioElement;
        node.volume = clamp01(baseGain);
        node.play().catch(() => {});
      };

      tryPlay();
    },
    [
      device,
      deviceSfxMultiplier,
      resolveFirstAvailableSrc,
      settings.audio_enabled,
      settings.countdown_tick_enabled,
      settings.music_enabled,
      settings.music_volume,
      settings.sfx_volume,
    ],
  );

  // Phone-only: optional global click policy, but avoid spamming on TV and allow opt-out.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (device !== 'phone') return;

    const handler = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const el = target?.closest?.('button,a,[role="button"]') as HTMLElement | null;
      if (!el) return;
      if ((el as HTMLButtonElement).disabled) return;
      if (el.getAttribute('data-audio') === 'off') return;
      playSound('ui.click', { device: 'phone' });
    };

    document.addEventListener('click', handler, true);
    return () => document.removeEventListener('click', handler, true);
  }, [device, playSound]);

  const setSettings = useCallback((next: Partial<AudioSettings>) => {
    setSettingsState((prev) => ({
      ...prev,
      ...Object.fromEntries(
        Object.entries(next).map(([k, v]) => {
          if (k === 'sfx_volume' || k === 'music_volume') return [k, clamp01(Number(v))];
          if (k === 'audio_enabled' || k === 'music_enabled' || k === 'haptics_enabled' || k === 'countdown_tick_enabled') return [k, Boolean(v)];
          return [k, v];
        }),
      ),
    }));
  }, []);

  const toggleMute = useCallback(() => {
    setSettingsState((prev) => ({ ...prev, audio_enabled: !prev.audio_enabled }));
  }, []);

  // Preload a small, high-value set so the first interaction feels snappy.
  useEffect(() => {
    preload(['ui.click', 'ui.transition', 'ui.lock_in', 'ui.success', 'ui.error', 'game.correct', 'game.wrong', 'game.reveal']);
  }, [preload]);

  const value = useMemo(() => ({ device, settings, setSettings, toggleMute, preload, playSound, vibrate }), [
    device,
    settings,
    setSettings,
    toggleMute,
    preload,
    playSound,
    vibrate,
  ]);

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

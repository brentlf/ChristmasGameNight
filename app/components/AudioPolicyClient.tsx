'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAudio } from '@/lib/contexts/AudioContext';

// Applies a default audio policy on first load:
// - TV: background music on (ambient)
// - Phones: background music off by default
// Users can override via AudioControls (persisted in localStorage).
export default function AudioPolicyClient() {
  const pathname = usePathname();
  const { device, setSettings } = useAudio();

  useEffect(() => {
    try {
      const alreadySet = localStorage.getItem('cgn_audio_policy_set');
      if (alreadySet === '1') return;

      // If the required keys already exist, do not override.
      const hasExplicit =
        localStorage.getItem('audio_enabled') !== null ||
        localStorage.getItem('music_enabled') !== null ||
        localStorage.getItem('sfx_volume') !== null ||
        localStorage.getItem('music_volume') !== null;
      if (!hasExplicit) {
        const isTv = pathname.includes('/tv') || device === 'tv';
        if (isTv) {
          setSettings({
            audio_enabled: true,
            music_enabled: true,
            music_volume: 0.08,
            sfx_volume: 0.35,
            countdown_tick_enabled: true,
            haptics_enabled: false,
          });
        } else {
          setSettings({
            audio_enabled: true,
            music_enabled: false,
            music_volume: 0,
            sfx_volume: 0.25,
            countdown_tick_enabled: false,
            haptics_enabled: true,
          });
        }
      }

      localStorage.setItem('cgn_audio_policy_set', '1');
    } catch {
      // ignore
    }
  }, [device, pathname, setSettings]);

  return null;
}



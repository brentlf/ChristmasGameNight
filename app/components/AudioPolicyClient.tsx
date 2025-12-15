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
  const { setBackgroundMusicEnabled, setBackgroundMusicVolume } = useAudio();

  useEffect(() => {
    try {
      const alreadySet = localStorage.getItem('cgn_audio_policy_set');
      if (alreadySet === '1') return;

      const isTv = pathname.includes('/tv');
      if (isTv) {
        // TV gets subtle ambient by default.
        setBackgroundMusicEnabled(true);
        setBackgroundMusicVolume(0.12);
      } else {
        // Phones default to no background music.
        setBackgroundMusicEnabled(false);
        setBackgroundMusicVolume(0);
      }

      localStorage.setItem('cgn_audio_policy_set', '1');
    } catch {
      // ignore
    }
  }, [pathname, setBackgroundMusicEnabled, setBackgroundMusicVolume]);

  return null;
}



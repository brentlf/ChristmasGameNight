'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';

export default function TimerRing(props: {
  endsAt: number | null | undefined;
  startedAt?: number | null | undefined;
  size?: number;
  warnAtSeconds?: number;
  className?: string;
  showSeconds?: boolean;
}) {
  const { endsAt, startedAt, size = 44, warnAtSeconds = 6, className, showSeconds = true } = props;
  const { playSound } = useAudio();
  const [now, setNow] = useState(Date.now());
  const lastWarnRef = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, []);

  const remainingMs = useMemo(() => {
    if (!endsAt) return null;
    return Math.max(0, endsAt - now);
  }, [endsAt, now]);

  const remainingSeconds = useMemo(() => {
    if (remainingMs === null) return null;
    return Math.ceil(remainingMs / 1000);
  }, [remainingMs]);

  const totalMs = useMemo(() => {
    if (!endsAt) return null;
    if (startedAt) return Math.max(1, endsAt - startedAt);
    return null;
  }, [endsAt, startedAt]);

  const pct = useMemo(() => {
    if (!endsAt) return 0;
    if (!totalMs) return 0;
    if (remainingMs === null) return 0;
    return Math.max(0, Math.min(1, remainingMs / totalMs));
  }, [endsAt, remainingMs, totalMs]);

  useEffect(() => {
    if (remainingSeconds === null) return;
    if (remainingSeconds <= 0) return;
    if (remainingSeconds > warnAtSeconds) return;
    if (lastWarnRef.current === remainingSeconds) return;
    lastWarnRef.current = remainingSeconds;

    // Subtle ticks near the end (cooldown in AudioContext will de-dupe).
    if (remainingSeconds === 5 || remainingSeconds === 3 || remainingSeconds === 1) {
      playSound('ding', 0.18);
    }
  }, [playSound, remainingSeconds, warnAtSeconds]);

  const stroke = useMemo(() => {
    const angle = Math.round(pct * 360);
    const danger = remainingSeconds !== null && remainingSeconds <= warnAtSeconds;
    const color = danger ? 'rgba(239, 68, 68, 0.95)' : 'rgba(245, 200, 80, 0.95)';
    return {
      background: `conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.10) 0deg)`,
    } as const;
  }, [pct, remainingSeconds, warnAtSeconds]);

  return (
    <div
      className={className}
      style={{ width: size, height: size, ...stroke, borderRadius: 9999 }}
      aria-label="Timer"
      title={remainingSeconds !== null ? `${remainingSeconds}s` : 'Timer'}
    >
      <div
        className="h-full w-full rounded-full bg-black/40 border border-white/10 flex items-center justify-center"
        style={{ transform: 'scale(0.82)' }}
      >
        {showSeconds && (
          <span className="text-xs font-black text-white/90 tabular-nums">
            {remainingSeconds === null ? '—' : remainingSeconds}
          </span>
        )}
      </div>
    </div>
  );
}



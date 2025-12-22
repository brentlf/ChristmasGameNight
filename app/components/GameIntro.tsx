'use client';

import { useEffect, useMemo, useState } from 'react';
import type { MiniGameType } from '@/types';
import { INTRO_SCRIPT } from '@/lib/introScript';
import { getLanguage } from '@/lib/i18n';
import { useAudio } from '@/lib/contexts/AudioContext';

function gameTitle(gameId: MiniGameType, lang: 'en' | 'cs') {
  if (gameId === 'trivia') return lang === 'cs' ? 'Trivia Blitz' : 'Trivia Blitz';
  if (gameId === 'emoji') return lang === 'cs' ? 'Emoji hádanka' : 'Emoji Movie Guess';
  if (gameId === 'wyr') return lang === 'cs' ? 'Co radši?' : 'Would You Rather';
  if (gameId === 'pictionary') return lang === 'cs' ? 'Kreslení' : 'Pictionary';
  if (gameId === 'guess_the_song') return lang === 'cs' ? 'Uhádni vánoční písničku' : 'Guess the Christmas Song';
  if (gameId === 'family_feud') return lang === 'cs' ? 'Vánoční rodinný souboj' : 'Christmas Family Feud';
  if (gameId === 'bingo') return lang === 'cs' ? 'Vánoční bingo' : 'Christmas Bingo';
  return gameId;
}

export default function GameIntro(props: {
  gameId: MiniGameType;
  lang?: 'en' | 'cs';
  allowSkip?: boolean;
  onSkip?: () => void;
  className?: string;
}) {
  const { gameId, allowSkip = true, onSkip, className } = props;
  const lang = props.lang ?? getLanguage();
  const { playSound } = useAudio();

  const [canSkip, setCanSkip] = useState(false);
  const [videoOk, setVideoOk] = useState(false);

  const title = useMemo(() => gameTitle(gameId, lang), [gameId, lang]);
  const lines = INTRO_SCRIPT[gameId] ?? [];
  const videoSrc = `/intro/${gameId}.mp4`;

  useEffect(() => {
    setCanSkip(false);
    const id = setTimeout(() => setCanSkip(true), 2000);
    return () => clearTimeout(id);
  }, [gameId]);

  useEffect(() => {
    let cancelled = false;
    // If the mp4 exists, show it; otherwise fall back to a lightweight animated card.
    // Use a silent check that won't log errors for missing files
    const controller = new AbortController();
    fetch(videoSrc, { 
      method: 'HEAD', 
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((res) => {
        if (!cancelled) setVideoOk(res.ok);
      })
      .catch((err) => {
        // Silently handle errors (expected for missing files)
        if (!cancelled && err.name !== 'AbortError') {
          setVideoOk(false);
        }
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [videoSrc]);

  return (
    <div
      className={[
        'relative overflow-hidden rounded-3xl border border-white/10 bg-black/50 backdrop-blur-md p-6 md:p-10 flex flex-col h-full min-h-0',
        className ?? '',
      ].join(' ')}
    >
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
      <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

      <div className="relative flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md mb-4">
              <span>🎬</span>
              <span>{lang === 'cs' ? 'Instrukce' : 'How to play'}</span>
            </div>
            <h2 className="game-show-title text-4xl md:text-5xl mb-2">{title}</h2>
            <p className="text-white/70 text-sm md:text-base">
              {lang === 'cs' ? 'Sleduj TV. Odpovídej na telefonu.' : 'Watch the TV. Answer on your phone.'}
            </p>
          </div>

          {allowSkip && onSkip && (
            <button
              type="button"
              onClick={() => {
                if (!canSkip) return;
                playSound('whoosh', 0.2);
                onSkip();
              }}
              disabled={!canSkip}
              className="btn-secondary text-sm disabled:opacity-50"
            >
              {canSkip ? (lang === 'cs' ? 'Přeskočit' : 'Skip') : lang === 'cs' ? '...' : '...'}
            </button>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch flex-1 min-h-0">
          <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden min-h-0">
            {videoOk ? (
              <video
                className="w-full h-full object-cover"
                src={videoSrc}
                autoPlay
                muted
                playsInline
                loop
                preload="none"
                onError={(e) => {
                  // Silently handle video load errors
                  e.preventDefault();
                  setVideoOk(false);
                }}
                onLoadStart={(e) => {
                  // Double-check: if video fails to load, hide it
                  const video = e.currentTarget;
                  video.addEventListener('error', () => {
                    setVideoOk(false);
                  }, { once: true });
                }}
              />
            ) : (
              <div className="h-full min-h-[12rem] flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-3 animate-pulse-slow">
                    {gameId === 'trivia' ? '⚡' : gameId === 'emoji' ? '🎬' : gameId === 'wyr' ? '🎄' : gameId === 'pictionary' ? '🎨' : gameId === 'guess_the_song' ? '🎵' : gameId === 'family_feud' ? '🎯' : gameId === 'bingo' ? '🎄' : '🎄'}
                  </div>
                  <div className="text-white/70 text-sm">
                    {lang === 'cs' ? 'Připravujeme show…' : 'Getting the show ready…'}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex flex-col min-h-0">
            <div className="space-y-3 flex-1 min-h-0 overflow-auto pr-1">
              {lines.map((l, idx) => (
                <div key={idx} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-white/90 font-semibold">{lang === 'cs' ? l.cs : l.en}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-white/50 mt-4">
              {lang === 'cs'
                ? 'Video je záměrně bez zvuku. Efekty respektují ztlumení.'
                : 'Intro is silent on purpose. Effects respect mute.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}



'use client';

import { useEffect, useState } from 'react';
import type { Player } from '@/types';
import { useAudio } from '@/lib/contexts/AudioContext';

interface GameFinaleProps {
  ranked: Array<Player & { sessionScore?: number; score?: number; overallPoints?: number }>;
  gameTitle: string;
  lang: 'en' | 'cs';
  onBackToLobby?: () => void;
  showBackButton?: boolean;
  backButtonLabel?: string;
  scoreKey?: 'sessionScore' | 'score' | 'overallPoints';
  scoreLabel?: string;
}

export default function GameFinale({ 
  ranked, 
  gameTitle, 
  lang, 
  onBackToLobby, 
  showBackButton = false,
  backButtonLabel,
  scoreKey = 'sessionScore',
  scoreLabel
}: GameFinaleProps) {
  const [confettiActive, setConfettiActive] = useState(true);
  const { playSound } = useAudio();
  const winner = ranked[0];
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const getScore = (player: any) => {
    if (scoreKey === 'sessionScore') return player.sessionScore ?? 0;
    if (scoreKey === 'overallPoints') return player.overallPoints ?? 0;
    return player.score ?? 0;
  };

  const getScoreDisplayLabel = () => {
    if (scoreLabel) return scoreLabel;
    if (scoreKey === 'overallPoints') return lang === 'cs' ? 'celkem bodů' : 'total points';
    if (scoreKey === 'score') return lang === 'cs' ? 'bodů' : 'points';
    return lang === 'cs' ? 'bodů' : 'points';
  };

  useEffect(() => {
    // Play celebration sound when finale appears
    playSound('cheer', 0.3);
    
    // Play confetti for first 5 seconds
    const timer = setTimeout(() => {
      setConfettiActive(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [playSound]);

  return (
    <div
      className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-black/90 via-black/80 to-black/90 overflow-hidden flex flex-col"
      style={{ minHeight: '70vh' }}
    >
      {/* Confetti effect */}
      {confettiActive && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti-fall"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10px',
                animationDuration: `${2 + Math.random() * 2}s`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            >
              {['🎉', '🎊', '⭐', '✨', '🏆'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Background decorations */}
      <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-christmas-gold/20 blur-3xl animate-pulse-slow" />
      <div className="absolute -left-32 -bottom-32 h-96 w-96 rounded-full bg-christmas-green/20 blur-3xl animate-pulse-slow" />

      <div className="relative flex flex-col h-full p-6 md:p-10 overflow-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md mb-4">
            <span>🎊</span>
            <span>{lang === 'cs' ? 'Grand Finale' : 'Grand Finale'}</span>
            <span className="text-white/40">•</span>
            <span className="text-white/70">{gameTitle}</span>
          </div>
          <h1 className="game-show-title text-5xl md:text-6xl mb-2">
            {lang === 'cs' ? '🎉 VÝBORNĚ! 🎉' : '🎉 WELL DONE! 🎉'}
          </h1>
        </div>

        {/* Winner Spotlight */}
        {winner && (
          <div className="mb-8 flex flex-col items-center">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-christmas-gold/30 rounded-full blur-2xl animate-pulse" />
              <div className="relative text-8xl md:text-9xl animate-bounce-slow">{winner.avatar}</div>
              <div className="absolute -top-2 -right-2 text-5xl animate-spin-slow">👑</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-black text-christmas-gold mb-2">{winner.name}</div>
              <div className="text-2xl text-white/80 mb-1">{lang === 'cs' ? 'Vítěz!' : 'Winner!'}</div>
              <div className="text-3xl md:text-4xl font-black text-christmas-gold">
                {getScore(winner)} {getScoreDisplayLabel()}
              </div>
            </div>
          </div>
        )}

        {/* Podium for Top 3 */}
        {top3.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-center mb-6">
              {lang === 'cs' ? '🏆 Pódium 🏆' : '🏆 Podium 🏆'}
            </h2>
            <div className="flex justify-center items-end gap-3 md:gap-6">
              {/* 2nd place */}
              {top3[1] && (
                <div className="flex flex-col items-center animate-slide-up-finale opacity-0" style={{ animationDelay: '0.2s' }}>
                  <div className="text-5xl md:text-6xl mb-3">{top3[1].avatar}</div>
                  <div className="bg-gradient-to-t from-gray-400/80 to-gray-300/60 w-20 md:w-28 h-24 md:h-32 rounded-t-2xl border-2 border-white/30 flex items-center justify-center shadow-lg">
                    <span className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">2</span>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-3 text-center">{top3[1].name}</p>
                  <p className="text-lg md:text-xl text-white/90 font-semibold">
                    {getScore(top3[1])}
                  </p>
                </div>
              )}

              {/* 1st place (winner) - taller */}
              {top3[0] && (
                <div className="flex flex-col items-center animate-slide-up-finale opacity-0">
                  <div className="text-6xl md:text-7xl mb-3 relative">
                    {top3[0].avatar}
                    <span className="absolute -top-1 -right-1 text-3xl animate-bounce">👑</span>
                  </div>
                  <div className="bg-gradient-to-t from-christmas-gold/90 to-christmas-gold/70 w-24 md:w-32 h-32 md:h-40 rounded-t-2xl border-4 border-christmas-gold/50 flex items-center justify-center shadow-2xl">
                    <span className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">1</span>
                  </div>
                  <p className="text-xl md:text-2xl font-black mt-3 text-center text-christmas-gold">{top3[0].name}</p>
                  <p className="text-xl md:text-2xl text-christmas-gold font-black">
                    {getScore(top3[0])}
                  </p>
                </div>
              )}

              {/* 3rd place */}
              {top3[2] && (
                <div className="flex flex-col items-center animate-slide-up-finale opacity-0" style={{ animationDelay: '0.4s' }}>
                  <div className="text-5xl md:text-6xl mb-3">{top3[2].avatar}</div>
                  <div className="bg-gradient-to-t from-amber-700/80 to-amber-600/60 w-20 md:w-28 h-20 md:h-28 rounded-t-2xl border-2 border-white/30 flex items-center justify-center shadow-lg">
                    <span className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">3</span>
                  </div>
                  <p className="text-lg md:text-xl font-bold mt-3 text-center">{top3[2].name}</p>
                  <p className="text-lg md:text-xl text-white/90 font-semibold">
                    {getScore(top3[2])}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rest of players */}
        {rest.length > 0 && (
          <div className="mt-auto">
            <h3 className="text-xl font-bold mb-4 text-center text-white/70">
              {lang === 'cs' ? 'Ostatní hráči' : 'Other Players'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rest.map((p, idx) => (
                <div
                  key={p.uid}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center justify-between"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-white/60 text-sm font-bold">#{idx + 4}</span>
                    <span className="text-xl">{p.avatar}</span>
                    <span className="truncate font-semibold">{p.name}</span>
                  </div>
                  <span className="text-lg font-bold text-christmas-gold">{getScore(p)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Back button */}
        {showBackButton && onBackToLobby && (
          <div className="mt-6 flex justify-center">
            <button onClick={onBackToLobby} className="btn-primary">
              {backButtonLabel ?? (lang === 'cs' ? 'Zpět do lobby' : 'Back to lobby')}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}





'use client';

import Link from 'next/link';
import { getLanguage, t } from '@/lib/i18n';
import type { Player, Room } from '@/types';

export function MiniGameDashboard({
  roomId,
  room,
  player,
  lang,
}: {
  roomId: string;
  room: Room;
  player: Player;
  lang: 'en' | 'cs';
}) {
  const progress = player.miniGameProgress ?? {};
  const triviaProgress = progress.trivia;
  const emojiProgress = progress.emoji;
  const wyrProgress = progress.wyr;
  const pictionaryProgress = progress.pictionary;

  const getGameStatus = (gameProgress: any) => {
    if (!gameProgress) return 'notStarted';
    if (gameProgress.completedAt) return 'completed';
    return 'inProgress';
  };

  const getGameButtonText = (status: string) => {
    if (status === 'completed') return t('minigames.viewResults', lang);
    if (status === 'inProgress') return t('minigames.continue', lang);
    return t('minigames.play', lang);
  };

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="card mb-6">
          <div className="text-center">
            <div className="text-5xl mb-4">{player.avatar}</div>
            <h1 className="text-3xl font-black mb-2">{room.name}</h1>
            <p className="text-white/75 mb-6">{t('minigames.dashboard', lang)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Trivia Blitz */}
          {room.miniGamesEnabled?.includes('trivia') && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">⚡ {t('game.triviaBlitz', lang)}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${
                getGameStatus(triviaProgress) === 'completed' ? 'bg-christmas-gold/25 text-christmas-gold' :
                getGameStatus(triviaProgress) === 'inProgress' ? 'bg-blue-500/25 text-blue-300' :
                'bg-white/10 text-white/70'
              }`}>
                {getGameStatus(triviaProgress) === 'completed' ? t('minigames.completed', lang) :
                 getGameStatus(triviaProgress) === 'inProgress' ? t('minigames.inProgress', lang) :
                 t('minigames.notStarted', lang)}
              </span>
            </div>
            {triviaProgress && (
              <p className="text-white/70 mb-2">
                {t('minigames.score', lang)}: <span className="font-bold text-christmas-gold">{triviaProgress.score}</span>
              </p>
            )}
            <Link href={`/room/${roomId}/minigames/trivia`} className="btn-primary w-full text-center block">
              {getGameButtonText(getGameStatus(triviaProgress))}
            </Link>
          </div>
          )}

          {/* Emoji Movie/Song Guess */}
          {room.miniGamesEnabled?.includes('emoji') && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">🎬 {t('game.emojiMovie', lang)}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${
                getGameStatus(emojiProgress) === 'completed' ? 'bg-christmas-gold/25 text-christmas-gold' :
                getGameStatus(emojiProgress) === 'inProgress' ? 'bg-blue-500/25 text-blue-300' :
                'bg-white/10 text-white/70'
              }`}>
                {getGameStatus(emojiProgress) === 'completed' ? t('minigames.completed', lang) :
                 getGameStatus(emojiProgress) === 'inProgress' ? t('minigames.inProgress', lang) :
                 t('minigames.notStarted', lang)}
              </span>
            </div>
            {emojiProgress && (
              <p className="text-white/70 mb-2">
                {t('minigames.score', lang)}: <span className="font-bold text-christmas-gold">{emojiProgress.score}</span>
              </p>
            )}
            <Link href={`/room/${roomId}/minigames/emoji`} className="btn-primary w-full text-center block">
              {getGameButtonText(getGameStatus(emojiProgress))}
            </Link>
          </div>
          )}

          {/* Would You Rather */}
          {room.miniGamesEnabled?.includes('wyr') && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">🎄 {t('game.wouldYouRather', lang)}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${
                getGameStatus(wyrProgress) === 'completed' ? 'bg-christmas-gold/25 text-christmas-gold' :
                getGameStatus(wyrProgress) === 'inProgress' ? 'bg-blue-500/25 text-blue-300' :
                'bg-white/10 text-white/70'
              }`}>
                {getGameStatus(wyrProgress) === 'completed' ? t('minigames.completed', lang) :
                 getGameStatus(wyrProgress) === 'inProgress' ? t('minigames.inProgress', lang) :
                 t('minigames.notStarted', lang)}
              </span>
            </div>
            {wyrProgress && (
              <p className="text-white/70 mb-2 text-sm italic">
                {t('wyr.noPoints', lang) || 'Just for fun - no points!'}
              </p>
            )}
            <Link href={`/room/${roomId}/minigames/wyr`} className="btn-primary w-full text-center block">
              {getGameButtonText(getGameStatus(wyrProgress))}
            </Link>
          </div>
          )}

          {/* Pictionary */}
          {room.miniGamesEnabled?.includes('pictionary') && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">🎨 {t('game.pictionary', lang)}</h2>
              <span className={`text-xs px-2 py-1 rounded-full ${
                getGameStatus(pictionaryProgress) === 'completed' ? 'bg-christmas-gold/25 text-christmas-gold' :
                getGameStatus(pictionaryProgress) === 'inProgress' ? 'bg-blue-500/25 text-blue-300' :
                'bg-white/10 text-white/70'
              }`}>
                {getGameStatus(pictionaryProgress) === 'completed' ? t('minigames.completed', lang) :
                 getGameStatus(pictionaryProgress) === 'inProgress' ? t('minigames.inProgress', lang) :
                 t('minigames.notStarted', lang)}
              </span>
            </div>
            {pictionaryProgress && (
              <p className="text-white/70 mb-2">
                {t('minigames.score', lang)}: <span className="font-bold text-christmas-gold">{pictionaryProgress.score}</span>
              </p>
            )}
            <Link href={`/room/${roomId}/minigames/pictionary`} className="btn-primary w-full text-center block">
              {getGameButtonText(getGameStatus(pictionaryProgress))}
            </Link>
          </div>
          )}
        </div>

        <div className="card text-center">
          <Link href={`/room/${roomId}/tv`} className="btn-secondary inline-block">
            📺 {t('race.openTv', lang)}
          </Link>
        </div>
      </div>
    </main>
  );
}

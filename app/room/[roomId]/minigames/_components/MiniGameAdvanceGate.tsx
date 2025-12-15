'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Player, Room, MiniGameType } from '@/types';
import { t } from '@/lib/i18n';

const GAME_ORDER: MiniGameType[] = ['trivia', 'emoji', 'wyr', 'pictionary'];

export function MiniGameAdvanceGate(props: {
  roomId: string;
  room: Room;
  players: Player[];
  lang: 'en' | 'cs';
  currentGame: MiniGameType;
}) {
  const { roomId, room, players, lang, currentGame } = props;
  const router = useRouter();

  const enabled = (room.miniGamesEnabled ?? []) as MiniGameType[];
  const flow = useMemo(() => GAME_ORDER.filter((g) => enabled.includes(g)), [enabled.join(',')]);
  const nextGame = flow[flow.indexOf(currentGame) + 1] ?? null;

  const doneCount = useMemo(() => {
    return players.filter((p) => Boolean((p as any)?.miniGameProgress?.[currentGame]?.completedAt)).length;
  }, [players, currentGame]);
  const total = players.length;
  const allDone = total > 0 && doneCount >= total;

  useEffect(() => {
    // Once everyone is done with this mini-game, send each player back to /play.
    // /play will route them into the next enabled mini-game.
    if (!nextGame) return;
    if (!allDone) return;
    router.replace(`/room/${roomId}/play`);
  }, [allDone, nextGame, roomId, router]);

  // If this is the last enabled game, we don't auto-advance; players can go to results.
  if (!nextGame) {
    return (
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
        <p className="text-white/80 font-semibold">{t('minigames.allCompleted', lang) || 'All mini games completed!'}</p>
        <p className="text-sm text-white/60 mt-1">
          {t('minigames.allCompletedDesc', lang) || 'Head to the TV or Results to see the leaderboard.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
      {allDone ? (
        <>
          <p className="text-white/90 font-semibold">{t('minigames.continue', lang) || 'Continuing…'}</p>
          <p className="text-sm text-white/60 mt-1">
            {t('tv.completed', lang) || 'Completed'} {doneCount}/{total}. {t('common.loading', lang)}
          </p>
        </>
      ) : (
        <>
          <p className="text-white/90 font-semibold">
            {t('minigames.waitingForOthers', lang) || 'Waiting for others…'}
          </p>
          <p className="text-sm text-white/60 mt-1">
            {t('tv.completed', lang) || 'Completed'} {doneCount}/{total}
          </p>
          <div className="mt-3">
            <Link href={`/room/${roomId}/tv`} className="btn-secondary inline-block text-sm">
              📺 {t('race.tv', lang) || 'TV'}
            </Link>
          </div>
        </>
      )}
    </div>
  );
}



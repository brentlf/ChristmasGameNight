'use client';

import { useParams, useRouter } from 'next/navigation';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { getLanguage, t } from '@/lib/i18n';
import Link from 'next/link';
import { getRaceTrack } from '@/lib/raceEngine';
import { calculateOverallScoring } from '@/lib/utils/overallScoring';
import { useEffect, useMemo, useState } from 'react';
import GameFinale from '@/app/components/GameFinale';
import type { Player } from '@/types';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import toast from 'react-hot-toast';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { room, loading: roomLoading } = useRoom(roomId);
  const { players, loading: playersLoading } = usePlayers(roomId);
  const lang = getLanguage();
  const [viewerUid, setViewerUid] = useState<string | null>(null);

  useEffect(() => {
    if (auth?.currentUser?.uid) setViewerUid(auth.currentUser.uid);
    const unsub = onAuthStateChanged(auth, (user) => setViewerUid(user?.uid ?? null));
    return () => unsub();
  }, []);

  const isController = Boolean(viewerUid && room?.controllerUid === viewerUid);

  // If the host resets back to lobby while someone is viewing /results on a phone,
  // bounce them back to their /play screen.
  useEffect(() => {
    if (!roomId) return;
    if (!room) return;
    if (isController) return;
    if (room.status !== 'lobby') return;
    router.replace(`/room/${roomId}/play`);
  }, [isController, room, roomId, router]);

  const overallScoring = useMemo(() => {
    if (!room || !players.length) return null;
    return calculateOverallScoring(players, room);
  }, [room, players]);

  // Get track safely - must be called before early returns to maintain hook order
  const track = useMemo(() => {
    if (!room?.raceTrackId) return null;
    try {
      return getRaceTrack(room.raceTrackId);
    } catch {
      return null;
    }
  }, [room?.raceTrackId]);

  const totalStages = track?.stages.length ?? 0;

  // Use overall scoring if enabled, otherwise use race scoring
  // Must be called before early returns to maintain hook order
  const sortedPlayers = useMemo(() => {
    if (!room || !players.length) return [];
    
    if (overallScoring && overallScoring.length > 0) {
      return overallScoring
        .map((result) => {
          const player = players.find((p: any) => p.uid === result.playerUid);
          if (!player) return null;
          return { ...player, overallPoints: result.overallPoints };
        })
        .filter((p): p is Player & { overallPoints: number } => p !== null);
    }
    return [...players].sort((a: any, b: any) => {
      const aStage = a.stageIndex ?? 0;
      const bStage = b.stageIndex ?? 0;
      if (bStage !== aStage) return bStage - aStage;
      const aFinished = a.finishedAt ?? Number.POSITIVE_INFINITY;
      const bFinished = b.finishedAt ?? Number.POSITIVE_INFINITY;
      if (aFinished !== bFinished) return aFinished - bFinished;
      const aScore = a.score ?? 0;
      const bScore = b.score ?? 0;
      return bScore - aScore;
    });
  }, [players, overallScoring, room]);

  if (roomLoading || playersLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-4xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  if (!room || !track) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-4xl">{t('common.error', lang)}</div>
      </div>
    );
  }

  const scoreKey: 'overallPoints' | 'score' = overallScoring && overallScoring.length > 0 ? 'overallPoints' : 'score';
  const scoreLabel = overallScoring && overallScoring.length > 0 
    ? t('scoring.totalPoints', lang)
    : (lang === 'cs' ? 'bodů' : 'points');

  // RULE: only show players who scored > 0 points for the results scope.
  // (If you want race-only placements regardless of points, we can relax this for amazing_race.)
  const rankedFiltered = sortedPlayers.filter((p: any) => {
    const v = scoreKey === 'overallPoints' ? Number(p.overallPoints ?? 0) : Number(p.score ?? 0);
    return v > 0;
  });

  const nextGame = async () => {
    if (!isController) return;
    const ok = window.confirm(
      lang === 'cs' ? 'Vrátit se do lobby a připravit další hru?' : 'Return to the lobby and get ready for the next game?'
    );
    if (!ok) return;

    try {
      const batch = writeBatch(db);
      for (const p of players as any[]) {
        batch.update(doc(db, 'rooms', roomId, 'players', p.uid), {
          score: 0,
          stageIndex: 0,
          stageState: {},
          finishedAt: null,
          photoUploaded: false,
          ready: false,
          lastActiveAt: Date.now(),
        } as any);
      }
      await batch.commit();

      await updateDoc(doc(db, 'rooms', roomId), {
        status: 'lobby',
        raceStartedAt: null,
        currentSession: null,
      } as any);

      router.replace(`/room/${roomId}/tv`);
    } catch (e: any) {
      console.error('Failed to return to lobby', e);
      toast.error(e?.message || 'Failed to return to lobby');
    }
  };

  return (
    <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 min-h-0 flex flex-col gap-4 md:gap-6">
        {/* Overall Scoring Info */}
        {overallScoring && overallScoring.length > 0 && (
          <div className="card shrink-0">
            <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 text-center break-words">{t('results.overallScoring', lang)}</h2>
            <p className="text-center text-white/70 mb-3 md:mb-4 text-sm md:text-base break-words">
              {room?.overallScoringMode === 'placements' && t('scoring.placements', lang)}
              {room?.overallScoringMode === 'sumMiniGameScores' && t('scoring.sumMiniGameScores', lang)}
              {room?.overallScoringMode === 'hybrid' && t('scoring.hybrid', lang)}
            </p>
          </div>
        )}

        {/* Game Finale Component */}
        <div className="flex-1 min-h-0 overflow-auto rounded-3xl border border-white/10 bg-white/5">
          <div className="p-3 md:p-5">
          <GameFinale
            ranked={rankedFiltered}
            gameTitle={lang === 'cs' ? '🏁 Amazing Race' : '🏁 Amazing Race'}
            lang={lang}
            scoreKey={scoreKey}
            scoreLabel={scoreLabel}
            showBackButton={false}
          />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-3 md:gap-4 shrink-0 pb-2">
          {isController ? (
            <button type="button" className="btn-primary text-sm md:text-base break-words" onClick={nextGame}>
              {lang === 'cs' ? 'Další hra' : 'Next game'}
            </button>
          ) : (
            <div className="text-center text-xs md:text-sm text-white/60 break-words px-2">
              {lang === 'cs' ? 'Host spustí další hru na TV.' : 'The host will start the next game on the TV.'}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}


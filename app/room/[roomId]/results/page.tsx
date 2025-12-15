'use client';

import { useParams } from 'next/navigation';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { getLanguage, t } from '@/lib/i18n';
import Link from 'next/link';
import { getRaceTrack } from '@/lib/raceEngine';
import { calculateOverallScoring } from '@/lib/utils/overallScoring';
import { useMemo } from 'react';

export default function ResultsPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { room, loading: roomLoading } = useRoom(roomId);
  const { players, loading: playersLoading } = usePlayers(roomId);
  const lang = getLanguage();

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
      return overallScoring.map((result) => {
        const player = players.find((p: any) => p.uid === result.playerUid);
        return { ...player, overallPoints: result.overallPoints };
      });
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

  const top3 = sortedPlayers.slice(0, 3);
  const rest = sortedPlayers.slice(3);

  return (
    <main className="min-h-dvh px-4 py-10 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
            <span>🏁</span>
            <span>Finale</span>
            <span className="text-white/40">•</span>
            <span className="text-white/70">Results</span>
          </div>
          <h1 className="game-show-title text-6xl text-center mt-4">
            {t('results.finalResults', lang)}
          </h1>
        </div>

        {/* Overall Scoring Info */}
        {overallScoring && overallScoring.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-2xl font-bold mb-4 text-center">{t('results.overallScoring', lang)}</h2>
            <p className="text-center text-white/70 mb-4">
              {room?.overallScoringMode === 'placements' && t('scoring.placements', lang)}
              {room?.overallScoringMode === 'sumMiniGameScores' && t('scoring.sumMiniGameScores', lang)}
              {room?.overallScoringMode === 'hybrid' && t('scoring.hybrid', lang)}
            </p>
          </div>
        )}

        {/* Podium */}
        <div className="card mb-8 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-red/15 blur-3xl" />

          <div className="relative">
            <h2 className="text-3xl font-bold mb-6 text-center">
              {overallScoring && overallScoring.length > 0 ? `🏆 ${t('results.christmasChampion', lang)}` : '🏆 Podium'}
            </h2>
            <div className="flex justify-center items-end gap-4">
          {top3[1] && (
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-4">{top3[1].avatar}</div>
              <div className="bg-white/20 w-32 h-32 rounded-t-2xl border border-white/20 flex items-center justify-center">
                <span className="text-4xl font-bold">2</span>
              </div>
              <p className="text-2xl font-bold mt-2">{top3[1].name}</p>
              <p className="text-xl text-christmas-gold">
                {overallScoring && overallScoring.length > 0
                  ? `${top3[1].overallPoints || 0} ${t('scoring.totalPoints', lang)}`
                  : `${top3[1].score} ${t('common.score', lang)}`}
              </p>
            </div>
          )}
          {top3[0] && (
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-4">{top3[0].avatar}</div>
              <div className="bg-christmas-gold/80 w-32 h-40 rounded-t-2xl border border-white/20 flex items-center justify-center">
                <span className="text-4xl font-bold">1</span>
              </div>
              <p className="text-2xl font-bold mt-2">{top3[0].name}</p>
              <p className="text-xl text-christmas-gold">
                {overallScoring && overallScoring.length > 0
                  ? `${top3[0].overallPoints || 0} ${t('scoring.totalPoints', lang)}`
                  : `${top3[0].score} ${t('common.score', lang)}`}
              </p>
            </div>
          )}
          {top3[2] && (
            <div className="flex flex-col items-center">
              <div className="text-6xl mb-4">{top3[2].avatar}</div>
              <div className="bg-christmas-bronze/80 w-32 h-24 rounded-t-2xl border border-white/20 flex items-center justify-center">
                <span className="text-4xl font-bold">3</span>
              </div>
              <p className="text-2xl font-bold mt-2">{top3[2].name}</p>
              <p className="text-xl text-christmas-gold">
                {overallScoring && overallScoring.length > 0
                  ? `${top3[2].overallPoints || 0} ${t('scoring.totalPoints', lang)}`
                  : `${top3[2].score} ${t('common.score', lang)}`}
              </p>
            </div>
          )}
            </div>
          </div>
        </div>

        {/* Full Leaderboard */}
        <div className="card mb-8">
          <h2 className="text-4xl font-bold mb-6 text-center">{t('common.leaderboard', lang)}</h2>
          <div className="space-y-3">
            {sortedPlayers.map((player: any, index: number) => {
              const finished = (player.stageIndex ?? 0) >= totalStages;
              return (
              <div
                key={player.uid}
                className={`flex items-center gap-4 p-4 rounded-2xl border border-white/10 ${
                  index < 3 ? 'bg-christmas-gold/15' : 'bg-white/5'
                }`}
              >
                <div className={`text-3xl font-bold w-12 text-center ${
                  index === 0 ? 'text-christmas-gold' :
                  index === 1 ? 'text-gray-300' :
                  index === 2 ? 'text-christmas-bronze' : 'text-white/50'
                }`}>
                  {index + 1}
                </div>
                <span className="text-3xl">{player.avatar}</span>
                <div className="flex-1">
                  <p className="text-xl font-semibold">{player.name}</p>
                  <p className="text-xs text-white/60">
                    {finished
                      ? t('results.finished', lang)
                      : `${t('race.stage', lang)} ${(player.stageIndex ?? 0) + 1}/${totalStages}`}
                  </p>
                </div>
                <p className="text-2xl font-bold">
                  {overallScoring && overallScoring.length > 0
                    ? player.overallPoints || 0
                    : player.score}
                </p>
              </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link href={`/room/${roomId}/tv`} className="btn-secondary">
            Back to TV View
          </Link>
          <Link href="/game-night" className="btn-primary">
            Create New Room
          </Link>
        </div>
      </div>
    </main>
  );
}


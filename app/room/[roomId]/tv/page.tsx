'use client';

import { useParams } from 'next/navigation';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { getLanguage, t } from '@/lib/i18n';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getRaceTrack } from '@/lib/raceEngine';
import { useEvents } from '@/lib/hooks/useEvents';
import { db } from '@/lib/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { getWYRItemById } from '@/lib/miniGameContent';
import type { Player, Room } from '@/types';

function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function WYRVisualSnapshot({ room, players, lang }: { room: Room; players: Player[]; lang: 'en' | 'cs' }) {
  const selectedIds = room.miniGames?.wyr?.selectedIds ?? [];
  const playersWithAnswers = players.filter((p) => p.miniGameProgress?.wyr?.choices && p.miniGameProgress.wyr.choices.length > 0);
  
  // Group answers by question
  const questionAnswers = selectedIds.map((questionId, questionIndex) => {
    const item = getWYRItemById(questionId);
    const playersA: Player[] = [];
    const playersB: Player[] = [];
    
    playersWithAnswers.forEach((player) => {
      const choice = player.miniGameProgress?.wyr?.choices[questionIndex];
      if (choice === 'A') {
        playersA.push(player);
      } else if (choice === 'B') {
        playersB.push(player);
      }
    });
    
    const total = playersA.length + playersB.length;
    const aPct = total > 0 ? Math.round((playersA.length / total) * 100) : 0;
    const bPct = total > 0 ? Math.round((playersB.length / total) * 100) : 0;
    
    // Determine if it's a close split, dominant A, or dominant B
    const isClose = Math.abs(aPct - bPct) <= 10 && total > 0;
    const isDominantA = aPct > 60;
    const isDominantB = bPct > 60;
    
    return {
      questionId,
      item,
      questionIndex,
      playersA,
      playersB,
      total,
      aPct,
      bPct,
      isClose,
      isDominantA,
      isDominantB,
    };
  });

  const completedCount = players.filter((p) => p.miniGameProgress?.wyr?.completedAt).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">🎄 {t('game.wouldYouRather', lang)}</h3>
        <span className="text-xs text-white/70">
          {completedCount}/{players.length} {t('tv.completed', lang) || 'completed'}
        </span>
      </div>
      
      {completedCount === 0 ? (
        <p className="text-sm text-white/60">{t('tv.noCompletions', lang)}</p>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {questionAnswers.map((qa) => {
            if (!qa.item) return null;
            
            return (
              <div
                key={qa.questionId}
                className={`rounded-xl border p-3 ${
                  qa.isClose
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : qa.isDominantA || qa.isDominantB
                    ? 'border-blue-500/30 bg-blue-500/5'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <p className="text-sm font-semibold mb-2 text-white/90">
                  {qa.questionIndex + 1}. {qa.item.prompt[lang]}
                </p>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Option A */}
                  <div className={`rounded-lg p-2 ${
                    qa.isDominantA ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-white/5 border border-white/10'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white/80">A: {qa.item.optionA[lang]}</span>
                      <span className="text-xs text-white/70">{qa.aPct}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {qa.playersA.map((p) => (
                        <span key={p.uid} className="text-lg" title={p.name}>
                          {p.avatar}
                        </span>
                      ))}
                      {qa.playersA.length === 0 && (
                        <span className="text-xs text-white/50">—</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Option B */}
                  <div className={`rounded-lg p-2 ${
                    qa.isDominantB ? 'bg-blue-500/20 border border-blue-500/40' : 'bg-white/5 border border-white/10'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white/80">B: {qa.item.optionB[lang]}</span>
                      <span className="text-xs text-white/70">{qa.bPct}%</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {qa.playersB.map((p) => (
                        <span key={p.uid} className="text-lg" title={p.name}>
                          {p.avatar}
                        </span>
                      ))}
                      {qa.playersB.length === 0 && (
                        <span className="text-xs text-white/50">—</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Trend indicator */}
                {qa.total > 0 && (
                  <div className="mt-2 text-xs text-white/60">
                    {qa.isClose && '⚖️ Close split!'}
                    {qa.isDominantA && `📊 Most chose A (${qa.playersA.length} vs ${qa.playersB.length})`}
                    {qa.isDominantB && `📊 Most chose B (${qa.playersB.length} vs ${qa.playersA.length})`}
                    {!qa.isClose && !qa.isDominantA && !qa.isDominantB && `${qa.total} answered`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TVPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { room, loading: roomLoading, updateRoom } = useRoom(roomId);
  const { players, loading: playersLoading } = usePlayers(roomId);
  const lang = getLanguage();
  const [joinUrl, setJoinUrl] = useState('');
  const [viewerUid, setViewerUid] = useState<string | null>(null);
  const { events } = useEvents(roomId, 15);

  useEffect(() => {
    if (auth?.currentUser?.uid) {
      setViewerUid(auth.currentUser.uid);
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setViewerUid(user?.uid ?? null);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!room?.code) {
      setJoinUrl('');
      return;
    }

    let cancelled = false;

    (async () => {
      let origin = window.location.origin;

      // If the TV is using localhost, phones can't reach it. Swap in the machine's LAN IP.
      if (isLocalhost(window.location.hostname)) {
        try {
          const res = await fetch('/api/lan-ip', { cache: 'no-store' });
          const data = (await res.json()) as { ip?: string | null };
          if (data?.ip) {
            const port = window.location.port ? `:${window.location.port}` : '';
            origin = `http://${data.ip}${port}`;
          }
        } catch {
          // If we can't detect LAN IP, fall back to localhost origin.
        }
      }

      if (!cancelled) {
        setJoinUrl(`${origin}/join?code=${room.code}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [room?.code]);

  if (roomLoading || playersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl">{t('common.error', lang)}</div>
      </div>
    );
  }

  const isController = Boolean(viewerUid && room.controllerUid === viewerUid);
  const track = room.roomMode === 'amazing_race' ? getRaceTrack(room.raceTrackId) : null;
  const totalStages = track?.stages.length ?? 0;

  const sortedPlayers = [...players].sort((a: any, b: any) => {
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

  const completedCount = players.filter((p: any) => (p.stageIndex ?? 0) >= totalStages).length;
  const leadStage = players.length ? Math.max(...players.map((p: any) => p.stageIndex ?? 0)) : 0;

  const resetRoom = async () => {
    const batch = writeBatch(db);
    for (const p of players as any[]) {
      batch.update(doc(db, 'rooms', roomId, 'players', p.uid), {
        score: 0,
        stageIndex: 0,
        stageState: {},
        finishedAt: null,
        photoUploaded: false,
        lastActiveAt: Date.now(),
      } as any);
    }
    await batch.commit();
    await updateDoc(doc(db, 'rooms', roomId), { status: 'lobby', raceStartedAt: null } as any);
  };

  return (
    <main className="min-h-screen px-4 py-10 md:py-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="card mb-6 relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md mb-4">
                <span>📺</span>
                <span>TV View</span>
                <span className="text-white/40">•</span>
                <span className="text-white/70">Scan to join</span>
              </div>

              <h1 className="game-show-title text-5xl mb-3">{room.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 backdrop-blur-md">
                  <span className="text-white/70">Room Code</span>
                  <span className="font-black tracking-widest text-xl">{room.code}</span>
                </div>
                {isController && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-christmas-gold/25 border border-christmas-gold/40 px-4 py-2 backdrop-blur-md text-sm">
                    <span className="font-semibold">HOST</span>
                    <span className="text-white/70">controls enabled</span>
                  </span>
                )}
                <span className="text-white/60">
                  {players.length}/{room.maxPlayers} {t('tv.players', lang)}
                </span>
              </div>
            </div>

            <div className="text-center shrink-0">
              <div className="inline-flex items-center justify-center rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-md">
                {joinUrl && <QRCodeSVG value={joinUrl} size={160} />}
              </div>
              <p className="text-sm mt-3 text-white/70">{t('tv.scanToJoin', lang)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players tiles */}
          <div className="card">
            <h2 className="text-3xl font-bold mb-4">{t('tv.players', lang)} ({players.length}/{room.maxPlayers})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sortedPlayers.map((p: any) => {
                const idx = p.stageIndex ?? 0;
                const finished = room.roomMode === 'amazing_race' ? idx >= totalStages : false;
                const pct = totalStages > 0 ? Math.min(100, Math.round((Math.min(idx, totalStages) / totalStages) * 100)) : 0;
                const currentStage = track?.stages[Math.min(idx, totalStages - 1)];
                return (
                  <div key={p.uid} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xl font-bold">
                          <span className="mr-2 text-2xl">{p.avatar}</span>
                          {p.name}
                        </p>
                    {room.roomMode === 'amazing_race' && (
                      <p className="text-sm text-white/70">
                        {finished
                          ? t('tv.finished', lang)
                          : `${t('race.stage', lang)} ${idx + 1}/${totalStages} • ${currentStage?.title?.[lang] ?? ''}`}
                      </p>
                    )}
                    {room.roomMode === 'mini_games' && p.miniGameProgress && room.miniGamesEnabled && (
                      <div className="mt-2 flex gap-1 text-xs">
                        {room.miniGamesEnabled.includes('trivia') && p.miniGameProgress.trivia?.completedAt && <span className="px-2 py-1 bg-christmas-gold/25 rounded">⚡</span>}
                        {room.miniGamesEnabled.includes('emoji') && p.miniGameProgress.emoji?.completedAt && <span className="px-2 py-1 bg-christmas-gold/25 rounded">🎬</span>}
                        {room.miniGamesEnabled.includes('wyr') && p.miniGameProgress.wyr?.completedAt && <span className="px-2 py-1 bg-christmas-gold/25 rounded">🎄</span>}
                        {room.miniGamesEnabled.includes('pictionary') && p.miniGameProgress.pictionary?.completedAt && <span className="px-2 py-1 bg-christmas-gold/25 rounded">🎨</span>}
                      </div>
                    )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-christmas-gold">{p.score ?? 0}</p>
                        {p.photoUploaded && <p className="text-xs text-white/70">📸</p>}
                      </div>
                    </div>

                    {room.roomMode === 'amazing_race' && totalStages > 0 && (
                      <div className="mt-3 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-2 bg-christmas-gold" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-christmas-gold/10 blur-2xl" />
            <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-christmas-green/10 blur-2xl" />
            
            <div className="relative">
              <h2 className="text-3xl font-bold mb-6 text-center">{t('common.leaderboard', lang)}</h2>
              
              {/* Top 3 Podium */}
              {sortedPlayers.length > 0 && (
                <div className="mb-6">
                  <div className="flex justify-center items-end gap-3 mb-4">
                    {/* 2nd Place */}
                    {sortedPlayers[1] && (
                      <div className="flex flex-col items-center group">
                        <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">{sortedPlayers[1].avatar}</div>
                        <div className="bg-white/20 w-20 h-20 rounded-t-xl border-2 border-white/30 flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-bold">2</span>
                        </div>
                        <p className="text-sm font-bold mt-2 text-center max-w-[80px] truncate">{sortedPlayers[1].name}</p>
                        <p className="text-lg font-black text-gray-300 mt-1">{sortedPlayers[1].score ?? 0}</p>
                        {room.roomMode === 'amazing_race' && totalStages > 0 && (
                          <p className="text-xs text-white/60 mt-1">
                            {t('race.stage', lang)} {Math.min((sortedPlayers[1].stageIndex ?? 0) + 1, totalStages)}/{totalStages}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* 1st Place - Taller */}
                    {sortedPlayers[0] && (
                      <div className="flex flex-col items-center group">
                        <div className="text-5xl mb-2 transform group-hover:scale-110 transition-transform animate-pulse-slow">🏆</div>
                        <div className="text-5xl mb-2 transform group-hover:scale-110 transition-transform">{sortedPlayers[0].avatar}</div>
                        <div className="bg-christmas-gold/90 w-24 h-28 rounded-t-xl border-2 border-christmas-gold shadow-2xl flex items-center justify-center relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                          <span className="text-3xl font-bold relative z-10">1</span>
                        </div>
                        <p className="text-base font-bold mt-2 text-center max-w-[100px] truncate">{sortedPlayers[0].name}</p>
                        <p className="text-xl font-black text-christmas-gold mt-1">{sortedPlayers[0].score ?? 0}</p>
                        {room.roomMode === 'amazing_race' && totalStages > 0 && (
                          <p className="text-xs text-white/60 mt-1">
                            {t('race.stage', lang)} {Math.min((sortedPlayers[0].stageIndex ?? 0) + 1, totalStages)}/{totalStages}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* 3rd Place */}
                    {sortedPlayers[2] && (
                      <div className="flex flex-col items-center group">
                        <div className="text-4xl mb-2 transform group-hover:scale-110 transition-transform">{sortedPlayers[2].avatar}</div>
                        <div className="bg-christmas-bronze/80 w-20 h-16 rounded-t-xl border-2 border-christmas-bronze/50 flex items-center justify-center shadow-lg">
                          <span className="text-2xl font-bold">3</span>
                        </div>
                        <p className="text-sm font-bold mt-2 text-center max-w-[80px] truncate">{sortedPlayers[2].name}</p>
                        <p className="text-lg font-black text-christmas-bronze mt-1">{sortedPlayers[2].score ?? 0}</p>
                        {room.roomMode === 'amazing_race' && totalStages > 0 && (
                          <p className="text-xs text-white/60 mt-1">
                            {t('race.stage', lang)} {Math.min((sortedPlayers[2].stageIndex ?? 0) + 1, totalStages)}/{totalStages}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rest of Leaderboard with Visual Bars */}
              {sortedPlayers.length > 3 && (
                <div className="space-y-2 mt-6 pt-6 border-t border-white/10">
                  {sortedPlayers.slice(3, 10).map((player: any, index: number) => {
                    const rank = index + 4;
                    const maxScore = sortedPlayers[0]?.score ?? 1;
                    const scorePercent = maxScore > 0 ? Math.max(5, (player.score ?? 0) / maxScore * 100) : 0;
                    
                    return (
                      <div 
                        key={player.uid} 
                        className="group relative flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/20 transition-all"
                      >
                        {/* Rank Badge */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                          <span className="text-lg font-bold text-white/70">{rank}</span>
                        </div>
                        
                        {/* Avatar */}
                        <div className="flex-shrink-0 text-3xl transform group-hover:scale-110 transition-transform">
                          {player.avatar}
                        </div>
                        
                        {/* Name and Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{player.name}</p>
                          {room.roomMode === 'amazing_race' && totalStages > 0 && (
                            <p className="text-xs text-white/60">
                              {t('race.stage', lang)} {Math.min((player.stageIndex ?? 0) + 1, totalStages)}/{totalStages}
                            </p>
                          )}
                        </div>
                        
                        {/* Visual Score Bar */}
                        <div className="flex-1 max-w-[120px] hidden sm:block">
                          <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-christmas-gold/60 to-christmas-gold rounded-full transition-all duration-500 relative overflow-hidden"
                              style={{ width: `${scorePercent}%` }}
                            >
                              <div 
                                className="absolute inset-0"
                                style={{
                                  background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
                                  backgroundSize: '200% 100%',
                                  animation: 'shimmer 2s linear infinite'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Score */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-lg font-black text-christmas-gold">{player.score ?? 0}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Race Status */}
          <div className="card">
            <h2 className="text-3xl font-bold mb-4">
              {room.roomMode === 'amazing_race' ? t('tv.raceStatus', lang) : room.roomMode === 'mini_games' ? 'Mini Games Status' : 'Room Status'}
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-lg mb-2">
                  {t('tv.status', lang)}: <span className="font-bold">{room.status}</span>
                </p>
                {room.roomMode === 'amazing_race' && totalStages > 0 && (
                  <p className="text-white/70">
                    {t('tv.progressSummary', lang)}: {completedCount}/{players.length} • {t('tv.lead', lang)}{' '}
                    {Math.min(leadStage + 1, totalStages)}/{totalStages}
                  </p>
                )}
              </div>

              {isController && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold mb-3">{t('controller.title', lang)}</p>
                  <div className="flex flex-wrap gap-2">
                    {room.status === 'lobby' && (
                      <button
                        onClick={async () => {
                          await updateRoom({
                            status: 'running',
                            ...(room.roomMode === 'amazing_race' && { raceStartedAt: Date.now() }),
                          });
                        }}
                        className="btn-primary"
                      >
                        {room.roomMode === 'amazing_race' ? t('controller.startRace', lang) : 'Start Games'}
                      </button>
                    )}

                    {room.status === 'running' && (
                      <>
                        <button
                          onClick={async () => {
                            await updateRoom({ status: 'finished' });
                          }}
                          className="btn-secondary"
                        >
                          {t('controller.endRace', lang)}
                        </button>
                        <button onClick={resetRoom} className="btn-secondary">
                          {t('controller.resetRoom', lang)}
                        </button>
                      </>
                    )}

                    {room.status === 'finished' && (
                      <Link href={`/room/${roomId}/results`} className="btn-primary">
                        Results
                      </Link>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-white/60">
                    Host controls only show on the TV that created the room (same browser session).
                  </p>
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold mb-3">{t('tv.eventFeed', lang)}</p>
                <div className="space-y-2 max-h-64 overflow-auto pr-1">
                  {events.length === 0 && <p className="text-sm text-white/60">{t('tv.noEvents', lang)}</p>}
                  {events.map((e: any) => (
                    <div key={e.id} className="text-sm text-white/75">
                      <span className="text-white font-semibold">{e.playerName}</span>{' '}
                      {e.type === 'joined' ? t('tv.eventJoined', lang) : t('tv.eventCompleted', lang)}{' '}
                      {e.stageTitle ? <span className="text-white/90">“{e.stageTitle}”</span> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Race Map - Only show for Amazing Race */}
        {room.roomMode === 'amazing_race' && track && (
          <div className="card mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-3xl font-bold">{t('tv.raceMap', lang)}</h2>
              <p className="text-sm text-white/70">
                {t('tv.track', lang)}: {track.title[lang]}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {track.stages.map((s, idx) => {
                const countAtOrBeyond = players.filter((p: any) => (p.stageIndex ?? 0) > idx).length;
                return (
                  <div key={s.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold">
                        {t('race.stage', lang)} {idx + 1}: {s.title[lang]}
                      </p>
                      <p className="text-sm text-white/70">
                        {countAtOrBeyond}/{players.length}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-white/70">{s.description[lang]}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mini Games Status - Only show for Mini Games mode and only show selected games */}
        {room.roomMode === 'mini_games' && room.miniGamesEnabled && room.miniGamesEnabled.length > 0 && (
          <div className="card mt-6">
            <h2 className="text-3xl font-bold mb-4">{t('tv.miniGames', lang)}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trivia */}
              {room.miniGamesEnabled.includes('trivia') && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-xl font-bold mb-3">⚡ {t('game.triviaBlitz', lang)}</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-white/70">
                      {t('tv.completedBy', lang)}: {players.filter((p: any) => p.miniGameProgress?.trivia?.completedAt).length}/{players.length}
                    </p>
                    {(() => {
                      const completed = players.filter((p: any) => p.miniGameProgress?.trivia?.completedAt);
                      if (completed.length === 0) {
                        return <p className="text-sm text-white/60">{t('tv.noCompletions', lang)}</p>;
                      }
                      const topScorer = [...completed].sort((a: any, b: any) => (b.miniGameProgress?.trivia?.score ?? 0) - (a.miniGameProgress?.trivia?.score ?? 0))[0];
                      return (
                        <p className="text-sm text-white/80">
                          {t('tv.topScorer', lang)}: <span className="font-bold">{topScorer.name}</span> ({topScorer.miniGameProgress?.trivia?.score ?? 0})
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Emoji */}
              {room.miniGamesEnabled.includes('emoji') && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-xl font-bold mb-3">🎬 {t('game.emojiMovie', lang)}</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-white/70">
                      {t('tv.completedBy', lang)}: {players.filter((p: any) => p.miniGameProgress?.emoji?.completedAt).length}/{players.length}
                    </p>
                    {(() => {
                      const completed = players.filter((p: any) => p.miniGameProgress?.emoji?.completedAt);
                      if (completed.length === 0) {
                        return <p className="text-sm text-white/60">{t('tv.noCompletions', lang)}</p>;
                      }
                      const topScorer = [...completed].sort((a: any, b: any) => (b.miniGameProgress?.emoji?.score ?? 0) - (a.miniGameProgress?.emoji?.score ?? 0))[0];
                      return (
                        <p className="text-sm text-white/80">
                          {t('tv.topScorer', lang)}: <span className="font-bold">{topScorer.name}</span> ({topScorer.miniGameProgress?.emoji?.score ?? 0})
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* Would You Rather */}
              {room.miniGamesEnabled.includes('wyr') && (
                <WYRVisualSnapshot room={room} players={players} lang={lang} />
              )}

              {/* Pictionary */}
              {room.miniGamesEnabled.includes('pictionary') && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="text-xl font-bold mb-3">🎨 {t('game.pictionary', lang)}</h3>
                  <div className="space-y-2">
                    <p className="text-sm text-white/70">
                      {t('tv.completedBy', lang)}: {players.filter((p: any) => p.miniGameProgress?.pictionary?.completedAt).length}/{players.length}
                    </p>
                    {(() => {
                      const completed = players.filter((p: any) => p.miniGameProgress?.pictionary?.completedAt);
                      if (completed.length === 0) {
                        return <p className="text-sm text-white/60">{t('tv.noCompletions', lang)}</p>;
                      }
                      const topScorer = [...completed].sort((a: any, b: any) => (b.miniGameProgress?.pictionary?.score ?? 0) - (a.miniGameProgress?.pictionary?.score ?? 0))[0];
                      return (
                        <p className="text-sm text-white/80">
                          {t('tv.topScorer', lang)}: <span className="font-bold">{topScorer.name}</span> ({topScorer.miniGameProgress?.pictionary?.score ?? 0})
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

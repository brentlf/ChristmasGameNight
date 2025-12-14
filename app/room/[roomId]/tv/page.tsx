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

function isLocalhost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
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
  const track = getRaceTrack(room.raceTrackId);
  const totalStages = track.stages.length;

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
                const finished = idx >= totalStages;
                const pct = totalStages > 0 ? Math.min(100, Math.round((Math.min(idx, totalStages) / totalStages) * 100)) : 0;
                const currentStage = track.stages[Math.min(idx, totalStages - 1)];
                return (
                  <div key={p.uid} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xl font-bold">
                          <span className="mr-2 text-2xl">{p.avatar}</span>
                          {p.name}
                        </p>
                        <p className="text-sm text-white/70">
                          {finished
                            ? t('tv.finished', lang)
                            : `${t('race.stage', lang)} ${idx + 1}/${totalStages} • ${currentStage?.title?.[lang] ?? ''}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-christmas-gold">{p.score ?? 0}</p>
                        {p.photoUploaded && <p className="text-xs text-white/70">📸</p>}
                      </div>
                    </div>

                    <div className="mt-3 h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-2 bg-christmas-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="card">
            <h2 className="text-3xl font-bold mb-4">{t('common.leaderboard', lang)}</h2>
            <div className="space-y-3">
              {sortedPlayers.slice(0, 10).map((player: any, index: number) => (
                <div key={player.uid} className="flex items-center gap-4 p-3 bg-white/10 rounded-lg">
                  <div className={`text-3xl font-bold ${
                    index === 0 ? 'text-christmas-gold' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-christmas-bronze' : 'text-white/50'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="text-2xl">{player.avatar}</span>
                  <div className="flex-1">
                    <p className="font-semibold">{player.name}</p>
                    <p className="text-xs text-white/60">
                      {t('race.stage', lang)} {Math.min((player.stageIndex ?? 0) + 1, totalStages)}/{totalStages}
                    </p>
                  </div>
                  <p className="text-xl font-bold">{player.score}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Race Status */}
          <div className="card">
            <h2 className="text-3xl font-bold mb-4">{t('tv.raceStatus', lang)}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-lg mb-2">
                  {t('tv.status', lang)}: <span className="font-bold">{room.status}</span>
                </p>
                <p className="text-white/70">
                  {t('tv.progressSummary', lang)}: {completedCount}/{players.length} • {t('tv.lead', lang)}{' '}
                  {Math.min(leadStage + 1, totalStages)}/{totalStages}
                </p>
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
                            raceStartedAt: Date.now(),
                          });
                        }}
                        className="btn-primary"
                      >
                        {t('controller.startRace', lang)}
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
      </div>
    </main>
  );
}

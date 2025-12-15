'use client';

import { useParams } from 'next/navigation';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { getLanguage, t } from '@/lib/i18n';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getRaceTrack } from '@/lib/raceEngine';
import { useEvents } from '@/lib/hooks/useEvents';
import { db } from '@/lib/firebase';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { getWYRItemById } from '@/lib/miniGameContent';
import { endPictionaryRound, initializePictionaryGame, startPictionaryRound } from '@/lib/miniGameEngine';
import type { Player, Room } from '@/types';
import toast from 'react-hot-toast';
import MiniGamesTVHub from './_components/MiniGamesTVHub';
import { useSessionScores } from '@/lib/hooks/useSessionScores';
import { useAudio } from '@/lib/contexts/AudioContext';
import RaceTrackTV from './_components/RaceTrackTV';

function isLocalhost(hostname: string) {
  // 0.0.0.0 is a bind-all address (valid for the server) but not a routable client hostname.
  // Treat it as localhost so we swap to LAN IP for QR codes and avoid invalid asset URLs.
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0';
}

function ExpandableQRCode({ value, smallSize = 160 }: { value: string; smallSize?: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!value) return null;

  const modal =
    open && typeof document !== 'undefined'
      ? createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Expanded QR code"
          >
            <div
              className="relative w-full max-w-2xl rounded-3xl border border-white/15 bg-black/60 backdrop-blur-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="min-w-0">
                  <p className="text-sm text-white/70">Scan to join</p>
                  <p className="text-xs text-white/50 mt-1">Tip: press ESC to minimize</p>
                </div>
                <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
                  Minimise
                </button>
              </div>

              <div className="mx-auto w-fit rounded-2xl bg-white p-4">
                <QRCodeSVG value={value} size={420} />
              </div>

              <p className="mt-4 text-xs text-white/50 break-all text-center">{value}</p>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-christmas-gold/60 rounded-2xl"
        aria-label="Expand QR code"
        title="Click to expand"
      >
        <QRCodeSVG value={value} size={smallSize} />
      </button>

      {modal}
    </>
  );
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
  const { scores: sessionScores } = useSessionScores(roomId, room?.currentSession?.sessionId ?? null);
  const lang = getLanguage();
  const [joinUrl, setJoinUrl] = useState('');
  const [viewerUid, setViewerUid] = useState<string | null>(null);
  const { events } = useEvents(roomId, 15);
  const [pictionaryBusy, setPictionaryBusy] = useState(false);
  const { playSound } = useAudio();
  const lastStageByUid = useRef<Map<string, number>>(new Map());
  const stageSoundPrimed = useRef(false);

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

  // Amazing Race: play sleighbells whenever any player advances a stage (TV feedback).
  useEffect(() => {
    if (!room) return;
    if (room.roomMode !== 'amazing_race') return;
    if (!players || players.length === 0) return;

    // Prime on first load to avoid a bell spam on initial snapshot.
    if (!stageSoundPrimed.current) {
      const m = new Map<string, number>();
      for (const p of players as any[]) {
        m.set(String(p.uid), Number((p as any).stageIndex ?? 0));
      }
      lastStageByUid.current = m;
      stageSoundPrimed.current = true;
      return;
    }

    let anyAdvanced = false;
    const m = new Map(lastStageByUid.current);
    for (const p of players as any[]) {
      const uid = String(p.uid);
      const next = Number((p as any).stageIndex ?? 0);
      const prev = Number(m.get(uid) ?? next);
      if (next > prev) anyAdvanced = true;
      m.set(uid, next);
    }
    lastStageByUid.current = m;
    if (anyAdvanced) playSound('sleighbells', 0.22);
  }, [playSound, players, room]);

  if (roomLoading || playersLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-4xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
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

  // Unified lobby: regardless of current roomMode, the TV lobby should show QR + game selection tiles.
  // This is what the "Back to lobby" button expects (instead of staying on the race screen).
  if (room.status === 'lobby') {
    const lobbyLeaders = [...players].sort((a: any, b: any) => {
      const aScore = Number(a.totalMiniGameScore ?? a.score ?? 0);
      const bScore = Number(b.totalMiniGameScore ?? b.score ?? 0);
      return bScore - aScore;
    });

    return (
      <main className="min-h-dvh flex flex-col px-4 py-10 md:py-12">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {/* Header */}
          <div className="card mb-6 relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md mb-4">
                  <span>📺</span>
                  <span>TV Hub</span>
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

              <div className="shrink-0">
                <div className="inline-flex items-center justify-center rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-md">
                  <ExpandableQRCode value={joinUrl} smallSize={160} />
                </div>
                <p className="text-sm mt-3 text-white/70">{t('tv.scanToJoin', lang)}</p>
              </div>
            </div>
          </div>

          {/* 3-pillar layout: Players | Lobby/Game Select | Leaderboard */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Players (left) */}
            <div className="card xl:col-span-2 h-full">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">
                  {t('tv.players', lang)} ({players.length}/{room.maxPlayers})
                </h2>
                <div className="text-xs text-white/60 whitespace-normal break-words max-w-full">
                  {lang === 'cs' ? 'Připoj se mobilem a pak host spustí hru.' : 'Join on your phone, then the host starts the game.'}
                </div>
              </div>
              <div className="space-y-3">
                {sortedPlayers.map((p: any) => (
                  <div key={p.uid} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold">
                          <span className="mr-2 text-xl">{p.avatar}</span>
                          {p.name}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          {p.ready ? '✅ Ready' : '⏳ Not ready'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-christmas-gold">{Number(p.totalMiniGameScore ?? p.score ?? 0)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {sortedPlayers.length === 0 && (
                  <p className="text-sm text-white/60">{t('tv.noPlayers', lang) || 'No players yet.'}</p>
                )}
              </div>
            </div>

            {/* Lobby / Game Select (middle) */}
            <div className="xl:col-span-8 h-full flex flex-col min-h-0">
              <MiniGamesTVHub roomId={roomId} room={room} players={players} lang={lang} isController={isController} />
            </div>

            {/* Leaderboard (right) */}
            <div className="card xl:col-span-2 h-full">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">{t('common.leaderboard', lang)}</h2>
                <div className="text-xs text-white/60 whitespace-normal break-words max-w-full">
                  {lang === 'cs' ? 'Celkem' : 'Overall'}
                </div>
              </div>

              {lobbyLeaders.length === 0 ? (
                <p className="text-sm text-white/60">{t('tv.noPlayers', lang) || 'No players yet.'}</p>
              ) : (
                <div className="space-y-2">
                  {lobbyLeaders.slice(0, 10).map((p: any, idx: number) => (
                    <div
                      key={p.uid}
                      className={`rounded-2xl border p-3 flex items-center justify-between gap-3 ${
                        idx === 0 ? 'border-christmas-gold/40 bg-christmas-gold/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          <span className="mr-2">{idx === 0 ? '🏆' : `#${idx + 1}`}</span>
                          <span className="mr-2">{p.avatar}</span>
                          {p.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-christmas-gold">{Number(p.totalMiniGameScore ?? p.score ?? 0)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  // New TV-led synchronous mini-games hub.
  if (room.roomMode === 'mini_games') {
    const sessionScoreMap = new Map(sessionScores.map((s: any) => [s.uid, Number(s.score ?? 0)]));
    const sidebarLeaders = [...players]
      .map((p: any) => {
        const sessionScore = sessionScoreMap.get(p.uid) ?? 0;
        const fallbackScore = Number(p.totalMiniGameScore ?? p.score ?? 0);
        const displayScore =
          room.currentSession && room.currentSession.sessionId && room.currentSession.gameId ? sessionScore : fallbackScore;
        return { ...p, sessionScore, displayScore };
      })
      .sort((a: any, b: any) => (b.displayScore ?? 0) - (a.displayScore ?? 0));

    const hasActiveSession = Boolean(room.currentSession?.sessionId);

    const backToLobby = async () => {
      if (!isController) return;
      if (!hasActiveSession) return;
      const ok = window.confirm(lang === 'cs' ? 'Ukončit hru a vrátit se do lobby?' : 'End the game and return to the lobby?');
      if (!ok) return;
      try {
        await updateDoc(doc(db, 'rooms', roomId), { status: 'lobby', currentSession: null } as any);
      } catch (e: any) {
        console.error('Failed to return to lobby', e);
        toast.error(e?.message || 'Failed to return to lobby');
      }
    };

    return (
      <main className="min-h-dvh flex flex-col px-4 py-10 md:py-12">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {/* Header */}
          <div className="card mb-6 relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md mb-4">
                  <span>📺</span>
                  <span>TV Hub</span>
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

              <div className="shrink-0">
                <div className="flex items-center justify-end gap-3">
                  {isController && hasActiveSession && (
                    <button type="button" className="btn-secondary" onClick={backToLobby}>
                      {lang === 'cs' ? 'Zpět do lobby' : 'Back to lobby'}
                    </button>
                  )}
                  {hasActiveSession ? (
                    <div className="max-w-[320px] rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-md">
                      <div className="text-sm font-semibold text-white/90">
                        {lang === 'cs' ? 'Hra právě běží' : 'Game in progress'}
                      </div>
                      <div className="text-xs text-white/70 mt-1 whitespace-normal break-words">
                        {lang === 'cs'
                          ? 'Chceš přidat hráče? Vrať se do lobby.'
                          : 'Want to add more players? Go back to the lobby.'}
                      </div>
                    </div>
                  ) : (
                    <div className="inline-flex items-center justify-center rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-md">
                      <ExpandableQRCode value={joinUrl} smallSize={160} />
                    </div>
                  )}
                </div>
                <p className="text-sm mt-3 text-white/70">
                  {hasActiveSession
                    ? lang === 'cs'
                      ? 'Pro přidání hráčů se vrať do lobby.'
                      : 'To add players, return to the lobby.'
                    : t('tv.scanToJoin', lang)}
                </p>
              </div>
            </div>
          </div>

          {/* 3-pillar layout: Players | Game Stage | Leaderboard */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Players (left) */}
            <div className="card xl:col-span-2 h-full">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">
                  {t('tv.players', lang)} ({players.length}/{room.maxPlayers})
                </h2>
                <div className="text-xs text-white/60 whitespace-normal break-words max-w-full">
                  {lang === 'cs' ? 'Ready = aktivní' : 'Ready = active'}
                </div>
              </div>
              <div className="space-y-3">
                {sortedPlayers.map((p: any) => (
                  <div key={p.uid} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold">
                          <span className="mr-2 text-xl">{p.avatar}</span>
                          {p.name}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          {p.ready ? '✅ Ready' : '⏳ Not ready'}{' '}
                          {p.lastActiveAt ? <span className="text-white/40">• {lang === 'cs' ? 'aktivní' : 'active'}</span> : null}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-christmas-gold">{Number(p.totalMiniGameScore ?? p.score ?? 0)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Stage (middle) */}
            <div className="xl:col-span-8 h-full flex flex-col min-h-0">
              <MiniGamesTVHub roomId={roomId} room={room} players={players} lang={lang} isController={isController} />
            </div>

            {/* Leaderboard (right) */}
            <div className="card xl:col-span-2 h-full">
              <div className="mb-4">
                <h2 className="text-2xl font-bold">{t('common.leaderboard', lang)}</h2>
                <div className="text-xs text-white/60 whitespace-normal break-words max-w-full">
                  {room.currentSession?.sessionId && room.currentSession?.gameId
                    ? lang === 'cs'
                      ? 'Tato hra'
                      : 'This game'
                    : lang === 'cs'
                    ? 'Celkem'
                    : 'Overall'}
                </div>
              </div>

              {sidebarLeaders.length === 0 ? (
                <p className="text-sm text-white/60">{t('tv.noPlayers', lang) || 'No players yet.'}</p>
              ) : (
                <div className="space-y-2">
                  {sidebarLeaders.slice(0, 10).map((p: any, idx: number) => (
                    <div
                      key={p.uid}
                      className={`rounded-2xl border p-3 flex items-center justify-between gap-3 ${
                        idx === 0 ? 'border-christmas-gold/40 bg-christmas-gold/10' : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          <span className="mr-2">{idx === 0 ? '🏆' : `#${idx + 1}`}</span>
                          <span className="mr-2">{p.avatar}</span>
                          {p.name}
                        </p>
                        {room.currentSession?.sessionId && room.currentSession?.gameId && (
                          <p className="text-xs text-white/60">
                            {lang === 'cs' ? 'Skóre hry' : 'Session'}: {p.sessionScore}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-christmas-gold">{p.displayScore}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-white/50">
                  {lang === 'cs'
                    ? 'Tip: skóre “Tato hra” se zobrazuje během session. Mezi session ukazujeme celkové body hráčů.'
                    : 'Tip: “This game” shows live session scores; between sessions we show overall player points.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
    <main className="min-h-dvh flex flex-col px-4 py-10 md:py-12">
      <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0">
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
                <span className="text-white/70">
                  {room.status === 'lobby' ? 'Scan to join' : lang === 'cs' ? 'Hra běží' : 'Game in progress'}
                </span>
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

            <div className="shrink-0">
              <div className="flex items-center justify-end gap-3">
                {isController && room.status !== 'lobby' && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={async () => {
                      const ok = window.confirm(
                        lang === 'cs'
                          ? 'Vrátit se do lobby, aby se mohli přidat další hráči?'
                          : 'Return to the lobby so more players can join?'
                      );
                      if (!ok) return;
                      try {
                        await updateDoc(doc(db, 'rooms', roomId), { status: 'lobby' } as any);
                      } catch (e: any) {
                        console.error('Failed to return to lobby', e);
                        toast.error(e?.message || 'Failed to return to lobby');
                      }
                    }}
                  >
                    {lang === 'cs' ? 'Zpět do lobby' : 'Back to lobby'}
                  </button>
                )}

                {room.status === 'lobby' ? (
                  <div className="inline-flex items-center justify-center rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-md">
                    <ExpandableQRCode value={joinUrl} smallSize={160} />
                  </div>
                ) : (
                  <div className="max-w-[320px] rounded-3xl border border-white/20 bg-white/5 p-4 backdrop-blur-md">
                    <div className="text-sm font-semibold text-white/90">
                      {lang === 'cs' ? 'Hra právě běží' : 'Game in progress'}
                    </div>
                    <div className="text-xs text-white/70 mt-1 whitespace-normal break-words">
                      {lang === 'cs'
                        ? 'Chceš přidat hráče? Vrať se do lobby.'
                        : 'Want to add more players? Go back to the lobby.'}
                    </div>
                  </div>
                )}
              </div>

              <p className="text-sm mt-3 text-white/70">
                {room.status === 'lobby'
                  ? t('tv.scanToJoin', lang)
                  : lang === 'cs'
                  ? 'Pro přidání hráčů se vrať do lobby.'
                  : 'To add players, return to the lobby.'}
              </p>
            </div>
          </div>
        </div>

        {/* 3-pillar layout: Players | Track | Leaderboard */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 flex-1 min-h-0">
          {/* Players (left) */}
          <div className="card xl:col-span-2 h-full">
            <div className="mb-4">
              <h2 className="text-2xl font-bold">
                {t('tv.players', lang)} ({players.length}/{room.maxPlayers})
              </h2>
              {track && totalStages > 0 && (
                <div className="text-xs text-white/60 whitespace-normal break-words max-w-full">
                  {completedCount}/{players.length} {t('tv.finished', lang)} • {t('tv.lead', lang)} {Math.min(leadStage + 1, totalStages)}/{totalStages}
                </div>
              )}
            </div>
            <div className="space-y-3">
              {sortedPlayers.map((p: any) => {
                const idx = Number(p.stageIndex ?? 0);
                const finished = totalStages > 0 ? idx >= totalStages : false;
                const currentStage = track?.stages[Math.min(idx, Math.max(0, totalStages - 1))];
                const pct = totalStages > 0 ? Math.min(100, Math.round((Math.min(idx, totalStages) / totalStages) * 100)) : 0;
                return (
                  <div key={p.uid} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-bold">
                          <span className="mr-2 text-xl">{p.avatar}</span>
                          {p.name}
                        </p>
                        <p className="text-xs text-white/60 mt-1">
                          {finished
                            ? `🏁 ${t('tv.finished', lang)}`
                            : `${t('race.stage', lang)} ${idx + 1}/${totalStages}${currentStage ? ` • ${currentStage.title?.[lang] ?? ''}` : ''}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-christmas-gold">{p.score ?? 0}</p>
                        {p.photoUploaded && <p className="text-xs text-white/70">📸</p>}
                      </div>
                    </div>
                    {totalStages > 0 && (
                      <div className="mt-2 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-1.5 bg-christmas-gold" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track (middle) */}
          <div className="xl:col-span-8 h-full flex flex-col min-h-0">
            {track ? (
              <RaceTrackTV track={track as any} players={players} lang={lang} />
            ) : (
              <div className="card flex-1 flex items-center justify-center">
                <div className="text-white/70">{lang === 'cs' ? 'Chybí trať.' : 'Missing race track.'}</div>
              </div>
            )}

            {/* Controls + event feed under the track */}
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-2xl font-bold mb-3">{t('tv.raceStatus', lang)}</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-lg">
                      {t('tv.status', lang)}: <span className="font-bold">{room.status}</span>
                    </p>
                    {track && totalStages > 0 && (
                      <p className="text-sm text-white/70 mt-1">
                        {t('tv.progressSummary', lang)}: {completedCount}/{players.length} • {t('tv.lead', lang)} {Math.min(leadStage + 1, totalStages)}/{totalStages}
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
                              try {
                                await updateRoom({
                                  status: 'running',
                                  ...(room.roomMode === 'amazing_race' && { raceStartedAt: Date.now() }),
                                });
                              } catch (e: any) {
                                console.error('Failed to start:', e);
                                toast.error(e?.message || 'Failed to start');
                              }
                            }}
                            className="btn-primary"
                            disabled={pictionaryBusy}
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
                </div>
              </div>

              <div className="card">
                <h3 className="text-2xl font-bold mb-3">{t('tv.eventFeed', lang)}</h3>
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

          {/* Leaderboard (right) */}
          <div className="card xl:col-span-2 h-full relative overflow-hidden">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-christmas-gold/10 blur-2xl" />
            <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-christmas-green/10 blur-2xl" />
            <div className="relative">
              <h2 className="text-2xl font-bold mb-4">{t('common.leaderboard', lang)}</h2>

              {/* Top 3 */}
              {sortedPlayers.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-center items-end gap-2">
                    {sortedPlayers[1] && (
                      <div className="flex flex-col items-center">
                        <div className="text-3xl">{sortedPlayers[1].avatar}</div>
                        <div className="text-xs text-white/70 mt-1">#2</div>
                        <div className="text-sm font-black text-white/90">{sortedPlayers[1].score ?? 0}</div>
                      </div>
                    )}
                    {sortedPlayers[0] && (
                      <div className="flex flex-col items-center">
                        <div className="text-4xl">🏆</div>
                        <div className="text-3xl -mt-1">{sortedPlayers[0].avatar}</div>
                        <div className="text-xs text-white/70 mt-1">#1</div>
                        <div className="text-base font-black text-christmas-gold">{sortedPlayers[0].score ?? 0}</div>
                      </div>
                    )}
                    {sortedPlayers[2] && (
                      <div className="flex flex-col items-center">
                        <div className="text-3xl">{sortedPlayers[2].avatar}</div>
                        <div className="text-xs text-white/70 mt-1">#3</div>
                        <div className="text-sm font-black text-white/90">{sortedPlayers[2].score ?? 0}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {sortedPlayers.slice(0, 10).map((p: any, idx: number) => (
                  <div
                    key={p.uid}
                    className={`rounded-2xl border p-3 flex items-center justify-between gap-3 ${
                      idx === 0 ? 'border-christmas-gold/40 bg-christmas-gold/10' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-bold">
                        <span className="mr-2">{idx === 0 ? '🏆' : `#${idx + 1}`}</span>
                        <span className="mr-2">{p.avatar}</span>
                        {p.name}
                      </p>
                      {track && totalStages > 0 && (
                        <p className="text-xs text-white/60">
                          {t('race.stage', lang)} {Math.min((p.stageIndex ?? 0) + 1, totalStages)}/{totalStages}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-christmas-gold">{p.score ?? 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mini-games mode has its own dedicated TV hub and returns early above. */}
      </div>
    </main>
  );
}

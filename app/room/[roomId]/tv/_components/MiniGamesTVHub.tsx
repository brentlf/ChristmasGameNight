'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MiniGameType, Player, Room } from '@/types';
import { useSessionSelected } from '@/lib/hooks/useSessionSelected';
import { useSessionAnswers } from '@/lib/hooks/useSessionAnswers';
import { useSessionScores } from '@/lib/hooks/useSessionScores';
import { usePictionaryLive } from '@/lib/hooks/usePictionaryLive';
import { usePictionaryGuesses } from '@/lib/hooks/usePictionaryGuesses';
import {
  controllerFinishSession,
  controllerPictionaryReveal,
  controllerStartPictionaryRound,
  controllerRevealAndScore,
  controllerStartQuestion,
  isPictionaryGuessCorrect,
  startMiniGameSession,
} from '@/lib/sessions/sessionEngine';
import { getEmojiItemById, getTriviaItemById, getWYRItemById } from '@/lib/miniGameContent';
import TimerRing from '@/app/components/TimerRing';
import GameIntro from '@/app/components/GameIntro';
import { useAudio } from '@/lib/contexts/AudioContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { rolloverRoomWithSamePlayers } from '@/lib/utils/room';

function gameLabel(gameId: MiniGameType) {
  if (gameId === 'trivia') return '⚡ Trivia';
  if (gameId === 'emoji') return '🎬 Emoji';
  if (gameId === 'wyr') return '🎄 Would You Rather';
  if (gameId === 'pictionary') return '🎨 Pictionary';
  return gameId;
}

function presenceStatus(players: Player[], now: number, thresholdMs: number) {
  const present: Player[] = [];
  const missing: Player[] = [];
  for (const p of players) {
    const last = Number((p as any)?.lastActiveAt ?? 0);
    if (last > 0 && now - last <= thresholdMs) present.push(p);
    else missing.push(p);
  }
  return { present, missing };
}

function GameTile(props: {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accent: 'gold' | 'green' | 'blue' | 'red';
  disabled?: boolean;
  onClick?: () => void;
}) {
  const { title, subtitle, description, icon, accent, disabled, onClick } = props;

  const accentBorder =
    accent === 'gold'
      ? 'hover:border-fire-gold/60'
      : accent === 'green'
      ? 'hover:border-christmas-green/60'
      : accent === 'blue'
      ? 'hover:border-blue-400/60'
      : 'hover:border-christmas-red/60';

  const accentGlow =
    accent === 'gold'
      ? 'from-fire-gold/25 via-fire-orange/15'
      : accent === 'green'
      ? 'from-christmas-green/25 via-fire-gold/15'
      : accent === 'blue'
      ? 'from-blue-400/25 via-fire-gold/10'
      : 'from-christmas-red/25 via-fire-gold/10';

  const iconGlow =
    accent === 'gold'
      ? 'drop-shadow-[0_0_15px_rgba(255,193,7,0.45)]'
      : accent === 'green'
      ? 'drop-shadow-[0_0_15px_rgba(22,163,74,0.45)]'
      : accent === 'blue'
      ? 'drop-shadow-[0_0_15px_rgba(96,165,250,0.45)]'
      : 'drop-shadow-[0_0_15px_rgba(239,68,68,0.45)]';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'group relative overflow-hidden rounded-2xl bg-wood-dark/40 backdrop-blur-xl border border-wood-light/30',
        accentBorder,
        'transition-all duration-500',
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.03] hover:bg-wood-dark/50',
      ].join(' ')}
      style={{
        boxShadow:
          '0 10px 30px rgba(0, 0, 0, 0.40), 0 0 20px rgba(255, 140, 0, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.10)',
      }}
    >
      {/* Warm glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${accentGlow} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Floating glows */}
      <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-fire-gold/25 blur-2xl animate-candle-flicker" />
      <div className="absolute bottom-4 left-4 w-32 h-32 rounded-full bg-fire-orange/20 blur-2xl animate-candle-flicker-delayed" />

      {/* Shimmer */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fire-gold/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

      <div className="relative z-10 p-6 text-left">
        <div className={`text-6xl mb-4 transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500 ${iconGlow}`}>
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-white group-hover:text-fire-gold transition-colors duration-300">
            {title}
          </h3>
          <div className="text-xs font-semibold text-white/70 whitespace-normal break-words pr-1">{subtitle}</div>
        </div>
        <p className="text-sm text-white/75 mt-3 group-hover:text-white/95 transition-colors duration-300 whitespace-normal break-words">
          {description}
        </p>
      </div>
    </button>
  );
}

export default function MiniGamesTVHub(props: {
  roomId: string;
  room: Room;
  players: Player[];
  lang: 'en' | 'cs';
  isController: boolean;
}) {
  const { roomId, room, players, lang, isController } = props;
  const { playSound } = useAudio();

  const currentSession = room.currentSession ?? null;
  const sessionId = currentSession?.sessionId ?? null;
  const gameId = (currentSession?.gameId as MiniGameType | undefined) ?? undefined;
  const sessionStatus = currentSession?.status ?? 'between';
  const questionIndex = typeof currentSession?.questionIndex === 'number' ? currentSession.questionIndex : null;

  const { selectedIds } = useSessionSelected(roomId, sessionId);
  const { answersForQuestion } = useSessionAnswers(roomId, sessionId, questionIndex);
  const { scores } = useSessionScores(roomId, sessionId);
  const { live } = usePictionaryLive(roomId, sessionId);
  const { guesses } = usePictionaryGuesses(roomId, sessionId);

  const activeUids = currentSession?.activePlayerUids ?? [];
  const activeCount = activeUids.length;
  const answeredCount = answersForQuestion.length;

  const [busy, setBusy] = useState(false);
  const lastRevealKey = useRef<string>('');
  const lastAutoAdvanceKey = useRef<string>('');
  const [confirmStart, setConfirmStart] = useState<null | { kind: 'game'; gameId: MiniGameType } | { kind: 'race' }>(
    null
  );

  // Note: "Back to lobby" control is rendered in the TV header (left of QR code).

  // Anti-stall: if someone is idle/disconnected too long, drop them from active list so the game doesn't hang.
  useEffect(() => {
    if (!isController) return;
    if (!sessionId) return;
    if (!currentSession) return;
    const idleMs = 120_000;
    const id = setInterval(() => {
      const now = Date.now();
      const drawerUid = currentSession.drawerUid ?? null;
      const filtered = activeUids.filter((uid) => {
        if (drawerUid && uid === drawerUid) return true;
        const p = players.find((pp) => pp.uid === uid) as any;
        const last = Number(p?.lastActiveAt ?? 0);
        return last > 0 && now - last <= idleMs;
      });
      if (filtered.length === activeUids.length) return;
      updateDoc(doc(db, 'rooms', roomId), {
        'currentSession.activePlayerUids': filtered,
      } as any).catch(() => {});
    }, 2000);
    return () => clearInterval(id);
  }, [activeUids, currentSession, isController, players, roomId, sessionId]);

  const content = useMemo(() => {
    if (!gameId || questionIndex === null) return null;
    const id = selectedIds?.[questionIndex];
    if (!id) return null;
    if (gameId === 'trivia') return { type: 'trivia' as const, item: getTriviaItemById(id) };
    if (gameId === 'emoji') return { type: 'emoji' as const, item: getEmojiItemById(id) };
    if (gameId === 'wyr') return { type: 'wyr' as const, item: getWYRItemById(id) };
    return null;
  }, [gameId, questionIndex, selectedIds]);

  // If anyone answers but wasn't in active list (late join / forgot to tap ready), include them so they don't get ignored.
  useEffect(() => {
    if (!isController) return;
    if (!sessionId) return;
    const answeredUids = answersForQuestion.map((a) => a.uid);
    const missing = answeredUids.filter((u) => !activeUids.includes(u));
    if (!missing.length) return;
    updateDoc(doc(db, 'rooms', roomId), {
      'currentSession.activePlayerUids': Array.from(new Set([...activeUids, ...missing])),
    } as any).catch(() => {});
  }, [activeUids, answersForQuestion, isController, roomId, sessionId]);

  // Auto-reveal when everyone answered or the timer expires (anti-stall).
  useEffect(() => {
    if (!isController) return;
    if (!sessionId || !gameId) return;
    if (sessionStatus !== 'in_game') return;
    if (questionIndex === null) return;

    const key = `${sessionId}:${gameId}:${questionIndex}`;
    const timedOut = typeof currentSession?.questionEndsAt === 'number' && Date.now() >= currentSession.questionEndsAt;

    if (gameId === 'pictionary') {
      if (!timedOut) return;
      if (lastRevealKey.current === key) return;
      lastRevealKey.current = key;
      setBusy(true);
      controllerPictionaryReveal({
        roomId,
        sessionId,
        roundIndex: questionIndex,
        drawerUid: currentSession?.drawerUid ?? null,
        timedOut: true,
      })
        .catch(() => {
          lastRevealKey.current = '';
        })
        .finally(() => setBusy(false));
      return;
    }

    const allAnswered = activeCount > 0 && answeredCount >= activeCount;
    if (!allAnswered && !timedOut) return;
    if (lastRevealKey.current === key) return;

    lastRevealKey.current = key;
    setBusy(true);
    controllerRevealAndScore({ roomId, sessionId, gameId, questionIndex })
      .catch(() => {
        lastRevealKey.current = '';
      })
      .finally(() => setBusy(false));
  }, [activeCount, answeredCount, currentSession?.questionEndsAt, gameId, isController, questionIndex, roomId, sessionId, sessionStatus]);

  // Auto-advance after reveal (3s) → next question or end
  useEffect(() => {
    if (!isController) return;
    if (!sessionId || !gameId) return;
    if (sessionStatus !== 'reveal') return;
    if (questionIndex === null) return;

    const key = `${sessionId}:${gameId}:${questionIndex}`;
    if (lastAutoAdvanceKey.current === key) return;
    lastAutoAdvanceKey.current = key;

    const delayMs = gameId === 'pictionary' ? 2000 : 3000;
    const id = setTimeout(async () => {
      try {
        playSound('whoosh', 0.18);
        const nextIndex = questionIndex + 1;
        if (selectedIds && nextIndex < selectedIds.length) {
          if (gameId === 'pictionary') {
            await controllerStartPictionaryRound({ roomId, sessionId, roundIndex: nextIndex });
          } else {
            await controllerStartQuestion({ roomId, sessionId, questionIndex: nextIndex });
          }
        } else {
          playSound('cheer', 0.25);
          await controllerFinishSession({ roomId, sessionId });
        }
      } catch {
        lastAutoAdvanceKey.current = '';
      }
    }, delayMs);

    return () => clearTimeout(id);
  }, [gameId, isController, playSound, questionIndex, roomId, selectedIds, sessionId, sessionStatus]);

  const startGame = async (g: MiniGameType) => {
    if (!isController) return;
    setBusy(true);
    try {
      const sid = await startMiniGameSession({
        roomId,
        gameId: g,
        secondsPerQuestion: g === 'pictionary' ? 60 : 45,
        questionCount: 10,
      });
      // Stay in intro; controller can skip or let it play.
      playSound('jingle', 0.18);
      return sid;
    } finally {
      setBusy(false);
    }
  };

  const startRace = async () => {
    if (!isController) return;
    await updateDoc(doc(db, 'rooms', roomId), {
      roomMode: 'amazing_race',
      status: 'running',
      raceStartedAt: Date.now(),
      currentSession: null,
    } as any);
  };

  const requestStartGame = (g: MiniGameType) => {
    if (!isController || busy) return;
    setConfirmStart({ kind: 'game', gameId: g });
  };

  const requestStartRace = () => {
    if (!isController || busy) return;
    setConfirmStart({ kind: 'race' });
  };

  const confirmModal =
    confirmStart && typeof document !== 'undefined'
      ? (() => {
          const now = Date.now();
          const thresholdMs = 90_000; // "present" = active in last 90s
          const { present, missing } = presenceStatus(players, now, thresholdMs);

          const title =
            confirmStart.kind === 'race'
              ? lang === 'cs'
                ? 'Spustit Amazing Race?'
                : 'Start Amazing Race?'
              : lang === 'cs'
              ? `Spustit ${gameLabel(confirmStart.gameId)}?`
              : `Start ${gameLabel(confirmStart.gameId)}?`;

          const subtitle =
            missing.length === 0
              ? lang === 'cs'
                ? 'Všichni hráči vypadají aktivní.'
                : 'All players look active.'
              : lang === 'cs'
              ? `Chybí ${missing.length}/${players.length} hráčů (neaktivní posledních ${Math.round(thresholdMs / 1000)}s).`
              : `${missing.length}/${players.length} players may be away (inactive for ${Math.round(thresholdMs / 1000)}s).`;

          const proceed = async () => {
            if (busy) return;
            const action = confirmStart;
            setConfirmStart(null);
            if (!action) return;
            if (action.kind === 'race') await startRace();
            else await startGame(action.gameId);
          };

          return createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-6"
              role="dialog"
              aria-modal="true"
              aria-label="Confirm start"
              onClick={() => setConfirmStart(null)}
            >
              <div
                className="w-full max-w-2xl rounded-3xl border border-white/15 bg-black/70 backdrop-blur-md p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-2xl font-black">{title}</h3>
                    <p className="text-sm text-white/70 mt-1">{subtitle}</p>
                  </div>
                  <button type="button" className="btn-secondary" onClick={() => setConfirmStart(null)}>
                    {lang === 'cs' ? 'Zrušit' : 'Cancel'}
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-black text-white/60 mb-2">
                      {lang === 'cs' ? 'Přítomní' : 'Present'} ({present.length}/{players.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {present.length === 0 ? (
                        <span className="text-sm text-white/60">—</span>
                      ) : (
                        present.map((p) => (
                          <span key={p.uid} className="text-sm rounded-full bg-white/10 border border-white/15 px-3 py-1">
                            <span className="mr-2">{p.avatar}</span>
                            {p.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs font-black text-white/60 mb-2">
                      {lang === 'cs' ? 'Chybí / neaktivní' : 'Missing / inactive'} ({missing.length}/{players.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {missing.length === 0 ? (
                        <span className="text-sm text-white/60">—</span>
                      ) : (
                        missing.map((p) => (
                          <span key={p.uid} className="text-sm rounded-full bg-white/10 border border-white/15 px-3 py-1">
                            <span className="mr-2">{p.avatar}</span>
                            {p.name}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button type="button" className="btn-secondary" onClick={() => setConfirmStart(null)}>
                    {lang === 'cs' ? 'Ještě počkat' : 'Wait'}
                  </button>
                  <button type="button" className="btn-primary" onClick={proceed}>
                    {lang === 'cs' ? 'Spustit' : 'Start'}
                  </button>
                </div>
              </div>
            </div>,
            document.body
          );
        })()
      : null;

  const renderQuestion = () => {
    if (gameId === 'pictionary') {
      const canvasId = `pictionary-tv-${sessionId}-${questionIndex ?? 0}`;
      const promptId = questionIndex !== null ? (selectedIds?.[questionIndex] ?? null) : null;
      return (
        <PictionaryTVRound
          roomId={roomId}
          sessionId={sessionId!}
          room={room}
          players={players}
          live={live}
          guesses={guesses}
          canvasId={canvasId}
          lang={lang}
          promptId={promptId}
          isController={isController}
        />
      );
    }
    if (!content || !gameId) return null;
    if (content.type === 'trivia' && content.item) {
      return (
        <div className="space-y-4">
          <div className="text-white/70 text-sm">Question {questionIndex! + 1}/{selectedIds.length}</div>
          <div className="text-4xl font-black leading-tight">{content.item.question[lang]}</div>
          <div className="grid grid-cols-2 gap-3">
            {content.item.options[lang].map((opt, idx) => (
              <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xl">
                <span className="text-white/60 mr-2">{String.fromCharCode(65 + idx)}.</span>
                {opt}
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (content.type === 'emoji' && content.item) {
      return (
        <div className="space-y-4 text-center">
          <div className="text-white/70 text-sm text-left">Question {questionIndex! + 1}/{selectedIds.length}</div>
          <div className="text-8xl">{content.item.emoji}</div>
          <div className="text-2xl text-white/85">{lang === 'cs' ? 'Co to je?' : 'What is it?'}</div>
        </div>
      );
    }
    if (content.type === 'wyr' && content.item) {
      return (
        <div className="space-y-4">
          <div className="text-white/70 text-sm">Question {questionIndex! + 1}/{selectedIds.length}</div>
          <div className="text-4xl font-black leading-tight text-center">{content.item.prompt[lang]}</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-white/60 font-black mb-2 text-sm">A</div>
              <div className="text-2xl font-semibold">{content.item.optionA[lang]}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-white/60 font-black mb-2 text-sm">B</div>
              <div className="text-2xl font-semibold">{content.item.optionB[lang]}</div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderReveal = () => {
    if (!gameId) return null;
    const r = currentSession?.revealData ?? null;

    if (gameId === 'pictionary') {
      const name = (r as any)?.correctName as string | null | undefined;
      const timedOut = Boolean((r as any)?.timedOut);
      return (
        <div className="text-center">
          <div className="text-6xl mb-3">{timedOut ? '⏱️' : '✅'}</div>
          <div className="text-3xl font-black">
            {timedOut ? (lang === 'cs' ? 'Čas vypršel' : 'Time’s up') : lang === 'cs' ? 'Správně!' : 'Correct!'}
          </div>
          {!timedOut && name && (
            <div className="mt-3 text-4xl font-black text-christmas-gold">{name}</div>
          )}
          <p className="text-sm text-white/60 mt-3">
            {lang === 'cs' ? 'Slovo se na TV nikdy nezobrazuje.' : 'The word is never shown on the TV.'}
          </p>
        </div>
      );
    }

    if (gameId === 'trivia' && r) {
      return (
        <div className="text-center">
          <div className="text-6xl mb-3">✅</div>
          <div className="text-3xl font-black">{lang === 'cs' ? 'Správná odpověď' : 'Correct answer'}</div>
          <div className="text-white/70 mt-2">
            {lang === 'cs' ? 'Správně:' : 'Correct:'} {Number(r.correctCount ?? 0)}/{Number(r.total ?? activeCount)}
          </div>
        </div>
      );
    }

    if (gameId === 'emoji' && r) {
      return (
        <div className="text-center">
          <div className="text-6xl mb-3">🎬</div>
          <div className="text-3xl font-black">{lang === 'cs' ? 'Správně bylo' : 'It was'}</div>
          <div className="text-4xl font-black text-christmas-gold mt-3">
            {(r.correct?.[lang] ?? r.correct?.en ?? '').toString()}
          </div>
          <div className="text-white/70 mt-2">
            {lang === 'cs' ? 'Správně:' : 'Correct:'} {Number(r.correctCount ?? 0)}/{Number(r.total ?? activeCount)}
          </div>
        </div>
      );
    }

    if (gameId === 'wyr' && r) {
      return (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-6xl mb-2">📊</div>
            <div className="text-3xl font-black">{lang === 'cs' ? 'Hlasování' : 'Vote'}</div>
            <div className="text-white/70 mt-2">{(r.commentary?.[lang] ?? r.commentary?.en ?? '').toString()}</div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/60 font-black mb-2">A</div>
              <div className="text-4xl font-black">{Number(r.aPct ?? 0)}%</div>
              <div className="text-white/60">{Number(r.aCount ?? 0)} votes</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/60 font-black mb-2">B</div>
              <div className="text-4xl font-black">{Number(r.bPct ?? 0)}%</div>
              <div className="text-white/60">{Number(r.bCount ?? 0)} votes</div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="text-5xl mb-3">✨</div>
        <div className="text-2xl font-bold">{lang === 'cs' ? 'Odhalení…' : 'Reveal…'}</div>
      </div>
    );
  };

  const view = () => {
    if (!currentSession || !sessionId || !gameId || sessionStatus === 'between' || room.status === 'between_sessions') {
      // Host Session: always allow starting any mini-game from the TV hub.
      return (
        <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/5 p-6 relative overflow-hidden flex flex-col">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/10 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black">{lang === 'cs' ? 'Vyber další hru' : 'Choose the next game'}</h2>
              <p className="text-white/70 mt-1">
                {lang === 'cs' ? 'Jedna místnost → mnoho session.' : 'One room → many sessions.'}
              </p>
            </div>
            {isController && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (busy) return;
                    setBusy(true);
                    try {
                      const newRoomId = await rolloverRoomWithSamePlayers(roomId);
                      window.location.href = `/room/${newRoomId}/tv`;
                    } catch {
                      // ignore; toast handled elsewhere if needed
                    } finally {
                      setBusy(false);
                    }
                  }}
                  className="btn-secondary"
                  disabled={busy}
                >
                  {lang === 'cs' ? '✨ Nová noc' : '✨ New night'}
                </button>
              </div>
            )}
          </div>

          <div className="relative mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <GameTile
              title={lang === 'cs' ? 'Amazing Race' : 'Amazing Race'}
              subtitle={lang === 'cs' ? 'Hlavní hra' : 'Main event'}
              description={lang === 'cs' ? 'Velká týmová jízda s checkpointy.' : 'A bigger adventure with checkpoints.'}
              icon="🏁"
              accent="red"
              disabled={!isController || busy}
              onClick={requestStartRace}
            />
            <GameTile
              title="Trivia Blitz"
              subtitle={lang === 'cs' ? 'Rychlé body' : 'Fast points'}
              description={lang === 'cs' ? '10 otázek. Odpovídej na telefonu.' : '10 questions. Answer on your phone.'}
              icon="⚡"
              accent="gold"
              disabled={!isController || busy}
              onClick={() => requestStartGame('trivia')}
            />
            <GameTile
              title={lang === 'cs' ? 'Emoji hádanka' : 'Emoji Guess'}
              subtitle={lang === 'cs' ? 'Filmy & písně' : 'Movies & songs'}
              description={lang === 'cs' ? 'Uhodni název podle emotikonů.' : 'Guess from the emoji clue.'}
              icon="🎬"
              accent="blue"
              disabled={!isController || busy}
              onClick={() => requestStartGame('emoji')}
            />
            <GameTile
              title={lang === 'cs' ? 'Co radši?' : 'Would You Rather'}
              subtitle={lang === 'cs' ? 'Hlasování' : 'Vote'}
              description={lang === 'cs' ? 'Vyber A/B. Pak se zasměj splitu.' : 'Pick A/B. Enjoy the chaos split.'}
              icon="🎄"
              accent="green"
              disabled={!isController || busy}
              onClick={() => requestStartGame('wyr')}
            />
            <GameTile
              title="Pictionary"
              subtitle={lang === 'cs' ? 'Kresli & hádej' : 'Draw & guess'}
              description={lang === 'cs' ? 'Jeden kreslí, ostatní tipují z TV.' : 'One draws, everyone guesses from the TV.'}
              icon="🎨"
              accent="gold"
              disabled={!isController || busy}
              onClick={() => requestStartGame('pictionary')}
            />
          </div>

          {!isController && (
            <p className="relative text-sm text-white/60 mt-5">
              {lang === 'cs' ? 'Host spustí hru z TV.' : 'The host starts the game from the TV.'}
            </p>
          )}
        </div>
      );
    }

    if (sessionStatus === 'intro') {
      return (
        <GameIntro
          gameId={gameId}
          lang={lang}
          allowSkip={isController}
          onSkip={async () => {
            if (!isController) return;
            if (gameId === 'pictionary') {
              await controllerStartPictionaryRound({ roomId, sessionId, roundIndex: 0 });
            } else {
              await controllerStartQuestion({ roomId, sessionId, questionIndex: 0 });
            }
          }}
        />
      );
    }

    if (sessionStatus === 'in_game') {
      return (
        <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="min-w-0">
              <div className="text-sm text-white/70">{gameLabel(gameId)}</div>
              <div className="text-white/90 text-lg font-bold">
                {gameId === 'pictionary'
                  ? lang === 'cs'
                    ? 'Hádání běží…'
                    : 'Guessing…'
                  : `${lang === 'cs' ? 'Odpovězeno' : 'Answered'}: `}
                {gameId !== 'pictionary' && (
                  <>
                    <span className="text-christmas-gold">{answeredCount}</span>/{activeCount}
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TimerRing endsAt={currentSession.questionEndsAt} startedAt={currentSession.questionStartedAt} size={52} />
              {isController && (
                <>
                  <button
                    type="button"
                    className="btn-secondary text-sm"
                    disabled={busy}
                    onClick={() => {
                      if (!sessionId || questionIndex === null) return;
                      if (gameId === 'pictionary') {
                        controllerPictionaryReveal({
                          roomId,
                          sessionId,
                          roundIndex: questionIndex,
                          drawerUid: currentSession?.drawerUid ?? null,
                          timedOut: true,
                        }).catch(() => {});
                      } else {
                        controllerRevealAndScore({ roomId, sessionId, gameId, questionIndex }).catch(() => {});
                      }
                    }}
                  >
                    {lang === 'cs' ? 'Vynutit konec' : 'Force end'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex-1 min-h-0">{renderQuestion()}</div>
        </div>
      );
    }

    if (sessionStatus === 'reveal') {
      return (
        <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/5 p-8 md:p-10 flex flex-col justify-center">
          {renderReveal()}
        </div>
      );
    }

    if (sessionStatus === 'finished') {
      const scoreMap = new Map(scores.map((s) => [s.uid, Number((s as any).score ?? 0)]));
      const ranked = [...players]
        .map((p) => ({ ...p, sessionScore: scoreMap.get(p.uid) ?? 0 }))
        .sort((a, b) => b.sessionScore - a.sessionScore);

      return (
        <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-sm text-white/70">{gameLabel(gameId)}</div>
              <h2 className="text-3xl font-black">{lang === 'cs' ? 'Výsledky' : 'Results'}</h2>
            </div>
            {isController && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  updateDoc(doc(db, 'rooms', roomId), { status: 'lobby', currentSession: null } as any).catch(() => {});
                }}
              >
                {lang === 'cs' ? 'Zpět do lobby' : 'Back to lobby'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 min-h-0 overflow-auto pr-1">
            {ranked.slice(0, 8).map((p, idx) => (
              <div key={p.uid} className="rounded-2xl border border-white/10 bg-black/20 p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-white/70 text-xs font-black">{idx === 0 ? '🏆' : `#${idx + 1}`}</div>
                  <div className="truncate text-xl font-bold">
                    <span className="mr-2 text-2xl">{p.avatar}</span>
                    {p.name}
                  </div>
                </div>
                <div className="text-3xl font-black text-christmas-gold">{(p as any).sessionScore}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">{view()}</div>
      {confirmModal}
    </div>
  );
}

function PictionaryTVRound(props: {
  roomId: string;
  sessionId: string;
  room: Room;
  players: Player[];
  live: any;
  guesses: any[];
  canvasId: string;
  lang: 'en' | 'cs';
  promptId: string | null;
  isController: boolean;
}) {
  const { roomId, sessionId, room, players, live, guesses, canvasId, lang, promptId, isController } = props;
  const currentSession = room.currentSession;
  const roundIndex = currentSession?.questionIndex ?? 0;
  const drawerUid = currentSession?.drawerUid ?? null;
  const drawer = drawerUid ? players.find((p) => p.uid === drawerUid) : null;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const processedGuessIds = useRef<Set<string>>(new Set());
  const revealTriggeredForRound = useRef<string>('');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    processedGuessIds.current = new Set();
    revealTriggeredForRound.current = '';
  }, [roundIndex, sessionId]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  // Draw live vector segments.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const events = Array.isArray(live?.events) ? live.events : [];
    for (const seg of events) {
      const x0 = Number(seg.x0 ?? 0) * rect.width;
      const y0 = Number(seg.y0 ?? 0) * rect.height;
      const x1 = Number(seg.x1 ?? 0) * rect.width;
      const y1 = Number(seg.y1 ?? 0) * rect.height;
      ctx.strokeStyle = (seg.c ?? '#ffffff').toString();
      ctx.lineWidth = Math.max(1, Number(seg.w ?? 3));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }, [live?.events, live?.seq]);

  useEffect(() => {
    if (!isController) return;
    const cs = room.currentSession;
    if (!cs) return;
    if (cs.status !== 'in_game') return;
    if (cs.gameId !== 'pictionary') return;
    if (!promptId) return;
    const triggerKey = `${sessionId}:pictionary:${roundIndex}`;
    if (revealTriggeredForRound.current === triggerKey) return;

    const roundGuesses = (guesses ?? []).filter((g: any) => Number(g.round ?? -1) === roundIndex);
    // Process newest -> oldest
    for (const g of roundGuesses) {
      const id = String(g.id ?? '');
      if (!id) continue;
      if (processedGuessIds.current.has(id)) continue;
      processedGuessIds.current.add(id);
      const text = String(g.guess ?? '');
      if (!text.trim()) continue;

      isPictionaryGuessCorrect({ promptId, guess: text })
        .then((ok) => {
          if (!ok) return;
          // Guard: if we already revealed, ignore.
          if (room.currentSession?.status !== 'in_game') return;
          if (revealTriggeredForRound.current === triggerKey) return;
          revealTriggeredForRound.current = triggerKey;
          controllerPictionaryReveal({
            roomId,
            sessionId,
            roundIndex,
            drawerUid: drawerUid ?? null,
            correctUid: String(g.uid ?? ''),
            correctName: String(g.name ?? ''),
            timedOut: false,
          }).catch(() => {});
        })
        .catch(() => {});
    }
  }, [drawerUid, guesses, promptId, room.currentSession?.status, roomId, roundIndex, sessionId]);

  // Fade-out display for guesses (UI only)
  const visibleGuesses = useMemo(() => {
    const roundGuesses = (guesses ?? [])
      .filter((g: any) => Number(g.round ?? -1) === roundIndex)
      .map((g: any) => ({
        id: String(g.id),
        name: String(g.name ?? ''),
        guess: String(g.guess ?? ''),
        createdAt: Number(g.createdAt ?? 0),
      }))
      .sort((a, b) => a.createdAt - b.createdAt);
    return roundGuesses.slice(-10);
  }, [guesses, roundIndex]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-white/70 text-sm">
            {lang === 'cs' ? 'Kreslí' : 'Drawing'}:{' '}
            <span className="text-white/90 font-bold">{drawer ? drawer.name : '—'}</span>
          </div>
          <div className="text-xs text-white/50">
            {lang === 'cs' ? 'Tipy se zobrazí na 2s a zmizí.' : 'Guesses appear for 2s then fade.'}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 overflow-hidden">
        <div className="relative">
          <canvas ref={canvasRef} id={canvasId} className="w-full h-[520px] bg-white/5" />
          <div className="absolute left-4 bottom-4 right-4 space-y-2 pointer-events-none">
            {visibleGuesses.map((g) => {
              const ageMs = Math.max(0, now - g.createdAt);
              const opacity = ageMs >= 2000 ? 0 : Math.max(0, 1 - ageMs / 2000);
              return (
                <div
                  key={g.id}
                  className="rounded-2xl border border-white/10 bg-black/60 backdrop-blur px-4 py-2 text-white/90"
                  style={{ opacity, transition: 'opacity 160ms linear' }}
                >
                  <span className="font-bold">{g.name}:</span> {g.guess}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}



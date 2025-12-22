'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '@/lib/contexts/AudioContext';
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
  setFamilyFeudTeams,
  startFamilyFeudRound,
  endFamilyFeudRound,
  drawBingoBall,
  claimBingo,
  finishBingoGame,
} from '@/lib/sessions/sessionEngine';
import { getGuessTheSongItemById, getFamilyFeudItemById } from '@/lib/miniGameContent';
import { useGameContent } from '@/lib/hooks/useGameContent';
import type { FamilyFeudQuestion } from '@/content/family_feud_christmas';
import TimerRing from '@/app/components/TimerRing';
import GameIntro from '@/app/components/GameIntro';
import GameFinale from '@/app/components/GameFinale';
import BingoBallMachine from '@/app/components/BingoBallMachine';
import { collection, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { rolloverRoomWithSamePlayers } from '@/lib/utils/room';
import toast from 'react-hot-toast';

function gameLabel(gameId: MiniGameType) {
  if (gameId === 'trivia') return '⚡ Trivia';
  if (gameId === 'emoji') return '🎬 Emoji';
  if (gameId === 'wyr') return '🎄 Would You Rather';
  if (gameId === 'pictionary') return '🎨 Pictionary';
  if (gameId === 'guess_the_song') return '🎵 Guess the Song';
  if (gameId === 'family_feud') return '🎯 Family Feud';
  if (gameId === 'bingo') return '🎄 Christmas Bingo';
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
  size?: 'main' | 'mini';
  disabled?: boolean;
  onClick?: () => void;
}) {
  const { title, subtitle, description, icon, accent, size = 'mini', disabled, onClick } = props;

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
        // h-full lets tiles stretch when placed in a full-height grid cell.
        'group relative overflow-hidden rounded-2xl bg-wood-dark/40 backdrop-blur-xl border border-wood-light/30 h-full',
        accentBorder,
        'transition-all duration-500',
        disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.03] hover:bg-wood-dark/50',
        // Keep "main event" tiles compact by default; scale up on big screens.
        size === 'main'
          ? 'min-h-[110px] sm:min-h-[120px] lg:min-h-[130px]'
          : 'min-h-[100px] sm:min-h-[105px] lg:min-h-[110px]',
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

      <div className={['relative z-10 text-left', size === 'main' ? 'p-3 sm:p-4' : 'p-3'].join(' ')}>
        <div
          className={[
            size === 'main'
              ? 'text-2xl sm:text-3xl lg:text-4xl mb-1.5 sm:mb-2'
              : 'text-xl sm:text-2xl lg:text-3xl mb-1 sm:mb-1.5',
            'transform group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500',
            iconGlow,
          ].join(' ')}
        >
          {icon}
        </div>
        <div className="space-y-1 md:space-y-0.5">
          <h3
            className={[
              size === 'main' ? 'text-sm sm:text-base lg:text-xl' : 'text-xs sm:text-sm lg:text-lg',
              'font-black text-white group-hover:text-fire-gold transition-colors duration-300 break-words',
            ].join(' ')}
          >
            {title}
          </h3>
          <div className="text-xs md:text-xs font-semibold text-white/70 whitespace-normal break-words pr-1">{subtitle}</div>
        </div>
        <p
          className={[
            'text-[11px] sm:text-xs',
            'text-white/75 mt-1.5 md:mt-1 group-hover:text-white/95 transition-colors duration-300 whitespace-normal break-words line-clamp-2',
          ].join(' ')}
        >
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
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiGeneratingLabel, setAiGeneratingLabel] = useState<string>('');
  const lastRevealKey = useRef<string>('');
  const lastAutoAdvanceKey = useRef<string>('');
  const [confirmStart, setConfirmStart] = useState<null | { kind: 'game'; gameId: MiniGameType; aiEnhanced?: boolean; aiTheme?: string; aiDifficulty?: 'easy' | 'medium' | 'hard' } | { kind: 'race'; aiEnhanced?: boolean; aiTheme?: string; aiDifficulty?: 'easy' | 'medium' | 'hard' }>(
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

  const content = useGameContent(gameId || null, questionIndex, selectedIds, roomId, sessionId);

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

  const startGame = async (g: MiniGameType, aiEnhanced: boolean = false, aiTheme?: string, aiDifficulty?: 'easy' | 'medium' | 'hard') => {
    if (!isController) return;
    setBusy(true);
    try {
      const theme = aiTheme?.trim() || 'Christmas';
      const sid = await startMiniGameSession({
        roomId,
        gameId: g,
        secondsPerQuestion: g === 'pictionary' ? 60 : 45,
        questionCount: 10,
        aiEnhanced,
        aiTheme: theme,
        aiDifficulty: aiDifficulty || 'easy',
      });
      // Stay in intro; controller can skip or let it play.
      playSound('sleighbells', 0.22);
      return sid;
    } finally {
      setBusy(false);
    }
  };

  const startRace = async (aiEnhanced: boolean = false, aiTheme?: string, aiDifficulty?: 'easy' | 'medium' | 'hard') => {
    if (!isController) return;
    const theme = aiTheme?.trim() || 'Christmas';
    await updateDoc(doc(db, 'rooms', roomId), {
      roomMode: 'amazing_race',
      status: 'running',
      raceStartedAt: Date.now(),
      currentSession: null,
      ...(aiEnhanced ? { raceAiEnhanced: true, raceAiTheme: theme, raceAiDifficulty: aiDifficulty || 'easy' } : {}),
    } as any);
    
    // If AI-enhanced, generate content for all stages via API route
    if (aiEnhanced) {
      try {
        const response = await fetch('/api/generate-race-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomId, trackId: 'christmas_race_v1', theme: theme, difficulty: aiDifficulty || 'easy' }),
        });

        if (response.ok) {
          const { raceContent } = await response.json();
          // Store AI-generated content in raceStageQuestions
          await updateDoc(doc(db, 'rooms', roomId), {
            raceStageQuestions: raceContent,
          } as any);
        } else {
          console.error('Failed to generate AI race content:', await response.text());
          // Continue anyway - will fall back to static content
        }
      } catch (error) {
        console.error('Error generating AI race content:', error);
        // Continue anyway - will fall back to static content
      }
    }
  };

  const requestStartGame = (g: MiniGameType) => {
    if (!isController || busy) return;
    setConfirmStart({ kind: 'game', gameId: g, aiEnhanced: false, aiTheme: '', aiDifficulty: 'easy' });
  };

  const requestStartRace = () => {
    if (!isController || busy) return;
    setConfirmStart({ kind: 'race', aiEnhanced: false, aiTheme: '', aiDifficulty: 'easy' });
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
            // If AI is enabled, keep user informed while generating.
            const willGenerateAi = Boolean(action?.aiEnhanced);
            if (willGenerateAi) {
              const label =
                action?.kind === 'race'
                  ? lang === 'cs'
                    ? 'Generuji AI obsah…'
                    : 'Generating AI content…'
                  : lang === 'cs'
                  ? 'Generuji AI otázky…'
                  : 'Generating AI questions…';
              setAiGeneratingLabel(label);
              setAiGenerating(true);
            }
            setConfirmStart(null);
            if (!action) return;
            // Ensure theme is properly trimmed and defaults to Christmas if empty
            const theme = action.aiTheme?.trim() || 'Christmas';
            try {
              if (action.kind === 'race') {
                await startRace(action.aiEnhanced ?? false, theme, action.aiDifficulty);
              } else {
                await startGame(action.gameId, action.aiEnhanced ?? false, theme, action.aiDifficulty);
              }
            } finally {
              setAiGenerating(false);
              setAiGeneratingLabel('');
            }
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

                {((confirmStart.kind === 'game' && confirmStart.gameId !== 'guess_the_song') || confirmStart.kind === 'race') && (
                  <div className="mt-4 space-y-2">
                    {/* AI Toggle - Compact */}
                    <label 
                      className="flex items-center justify-between gap-2 cursor-pointer rounded-lg border border-white/10 bg-white/5 p-2 hover:bg-white/10 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        const newAiEnhanced = !confirmStart.aiEnhanced;
                        setConfirmStart(confirmStart ? { 
                          ...confirmStart, 
                          aiEnhanced: newAiEnhanced, 
                          // Only set default theme if enabling AI and theme is empty/whitespace
                          aiTheme: newAiEnhanced && (!confirmStart.aiTheme || !confirmStart.aiTheme.trim()) 
                            ? 'Christmas' 
                            : confirmStart.aiTheme,
                          aiDifficulty: confirmStart.aiDifficulty || 'easy' 
                        } : null);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <span className="text-xs font-medium text-white/90">
                          {lang === 'cs' ? 'AI' : 'AI'}
                        </span>
                      </div>
                      <div className={`relative w-10 h-5 rounded-full transition-colors ${confirmStart.aiEnhanced ? 'bg-fire-gold' : 'bg-white/20'}`}>
                        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ${confirmStart.aiEnhanced ? 'translate-x-5' : ''}`} />
                      </div>
                    </label>
                    
                    {confirmStart.aiEnhanced && (
                      <div className="rounded-lg border border-white/10 bg-white/5 p-2 space-y-2">
                        {/* Difficulty - Icon-based buttons */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm shrink-0">⚡</span>
                          <div className="flex gap-0.5 flex-1">
                            {(['easy', 'medium', 'hard'] as const).map((level) => {
                              const icons = { easy: '⭐', medium: '⭐⭐', hard: '⭐⭐⭐' };
                              const isActive = (confirmStart.aiDifficulty || 'easy') === level;
                              return (
                                <button
                                  key={level}
                                  type="button"
                                  onClick={() => {
                                    setConfirmStart(confirmStart ? { ...confirmStart, aiDifficulty: level } : null);
                                  }}
                                  className={`flex-1 py-1.5 px-1.5 rounded text-[11px] transition-all ${
                                    isActive
                                      ? 'bg-fire-gold/40 text-white'
                                      : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                                  }`}
                                  title={level === 'easy' ? (lang === 'cs' ? 'Snadná' : 'Easy') : level === 'medium' ? (lang === 'cs' ? 'Střední' : 'Medium') : (lang === 'cs' ? 'Těžká' : 'Hard')}
                                >
                                  {icons[level]}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Theme - Compact input */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm shrink-0">🎨</span>
                          <input
                            type="text"
                            value={confirmStart.aiTheme || ''}
                            onChange={(e) => {
                              setConfirmStart(confirmStart ? { ...confirmStart, aiTheme: e.target.value } : null);
                            }}
                            placeholder={lang === 'cs' ? 'Téma...' : 'Theme...'}
                            className="flex-1 input-field text-xs py-1.5 px-2.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 flex items-center justify-end gap-2">
                  <button type="button" className="btn-secondary" onClick={() => setConfirmStart(null)}>
                    {lang === 'cs' ? 'Zrušit' : 'Cancel'}
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

  const generatingModal =
    aiGenerating && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-6" role="dialog" aria-modal="true">
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-black/60 backdrop-blur-md p-5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center">
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white/90">{aiGeneratingLabel || (lang === 'cs' ? 'Generuji…' : 'Generating…')}</div>
                  <div className="text-xs text-white/55">{lang === 'cs' ? 'Chvilku prosím.' : 'Just a moment.'}</div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
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
    if (gameId === 'family_feud') {
      const roundIndex = currentSession?.roundIndex ?? 0;
      const questionId = selectedIds?.[roundIndex] ?? null;
      return (
        <FamilyFeudTVRound
          roomId={roomId}
          sessionId={sessionId!}
          room={room}
          players={players}
          selectedIds={selectedIds}
          roundIndex={roundIndex}
          questionId={questionId}
          lang={lang}
          isController={isController}
        />
      );
    }
    if (gameId === 'bingo') {
      return (
        <BingoTVRound
          roomId={roomId}
          sessionId={sessionId!}
          room={room}
          players={players}
          lang={lang}
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
            {content.item.options[lang].map((opt: string, idx: number) => (
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
    if (content.type === 'guess_the_song' && content.item) {
      return (
        <GuessTheSongTVQuestion
          item={content.item}
          questionIndex={questionIndex!}
          totalQuestions={selectedIds.length}
          lang={lang}
        />
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
      const correctIndex = Number((r as any)?.correctIndex ?? -1);
      const correctText =
        content?.type === 'trivia' && content.item && Array.isArray(content.item.options?.[lang])
          ? (content.item.options[lang][correctIndex] ?? null)
          : null;
      return (
        <div className="text-center">
          <div className="text-6xl mb-3">✅</div>
          <div className="text-3xl font-black">{lang === 'cs' ? 'Správná odpověď' : 'Correct answer'}</div>
          {typeof correctText === 'string' && correctText.trim() && correctIndex >= 0 && (
            <div className="mt-3 text-3xl font-black text-christmas-gold">
              {String.fromCharCode(65 + correctIndex)}. {correctText}
            </div>
          )}
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
      const aVoters: string[] = Array.isArray((r as any).aUids) ? ((r as any).aUids as string[]) : [];
      const bVoters: string[] = Array.isArray((r as any).bUids) ? ((r as any).bUids as string[]) : [];
      const nameFor = (uid: string) => players.find((p) => p.uid === uid)?.name || uid;

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
              {aVoters.length > 0 && (
                <div className="mt-3 text-xs text-white/70 space-y-1">
                  <div className="font-semibold text-white/80">{lang === 'cs' ? 'Hlasovali:' : 'Voted:'}</div>
                  <div className="flex flex-wrap gap-2">
                    {aVoters.map((uid) => (
                      <span key={uid} className="rounded-full bg-white/10 px-2 py-1 border border-white/15 text-white/80">
                        {nameFor(uid)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm text-white/60 font-black mb-2">B</div>
              <div className="text-4xl font-black">{Number(r.bPct ?? 0)}%</div>
              <div className="text-white/60">{Number(r.bCount ?? 0)} votes</div>
              {bVoters.length > 0 && (
                <div className="mt-3 text-xs text-white/70 space-y-1">
                  <div className="font-semibold text-white/80">{lang === 'cs' ? 'Hlasovali:' : 'Voted:'}</div>
                  <div className="flex flex-wrap gap-2">
                    {bVoters.map((uid) => (
                      <span key={uid} className="rounded-full bg-white/10 px-2 py-1 border border-white/15 text-white/80">
                        {nameFor(uid)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (gameId === 'guess_the_song' && r) {
      return (
        <div className="text-center">
          <div className="text-6xl mb-3">🎵</div>
          <div className="text-3xl font-black">{lang === 'cs' ? 'Správná odpověď' : 'Correct answer'}</div>
          <div className="text-4xl font-black text-christmas-gold mt-3">
            {(r.correctAnswer?.[lang] ?? r.correctAnswer?.en ?? '').toString()}
          </div>
          <div className="text-white/70 mt-2">
            {lang === 'cs' ? 'Správně:' : 'Correct:'} {Number(r.correctCount ?? 0)}/{Number(r.total ?? activeCount)}
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
        <div className="rounded-3xl border border-white/10 bg-white/5 p-2.5 md:p-3 relative overflow-hidden flex flex-col h-full min-h-0">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/10 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-2 md:gap-3 shrink-0">
            <div>
              <h2 className="text-lg md:text-xl font-black break-words">{lang === 'cs' ? 'Vyber další hru' : 'Choose the next game'}</h2>
              <p className="text-white/70 mt-0.5 text-xs break-words">
                {lang === 'cs' ? 'Jedna místnost → mnoho session.' : 'One room → many sessions.'}
              </p>
            </div>
            {isController && (
              <div className="flex gap-2 shrink-0">
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
                  className="btn-secondary text-xs md:text-sm break-words"
                  disabled={busy}
                >
                  {lang === 'cs' ? '✨ Nová noc' : '✨ New night'}
                </button>
              </div>
            )}
          </div>

          {/* Layout: Main Events (content-sized) + Mini Games (fills remaining space) */}
          <div className="relative mt-2 md:mt-3 flex-1 min-h-0 flex flex-col gap-2 md:gap-2.5">
            {/* Main Events (content-sized) */}
            <div className="shrink-0">
              <div className="mb-1.5 flex items-center justify-between shrink-0">
                <div className="text-xs font-black tracking-widest text-white/60 uppercase">
                  {lang === 'cs' ? 'Hlavní události' : 'Main Events'}
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-2.5">
                <GameTile
                  size="main"
                  title={lang === 'cs' ? 'Amazing Race' : 'Amazing Race'}
                  subtitle={lang === 'cs' ? 'Hlavní hra' : 'Main event'}
                  description={lang === 'cs' ? 'Velká týmová jízda s checkpointy.' : 'A bigger adventure with checkpoints.'}
                  icon="🏁"
                  accent="red"
                  disabled={!isController || busy}
                  onClick={requestStartRace}
                />
                <GameTile
                  size="main"
                  title={lang === 'cs' ? 'Vánoční rodinný souboj' : 'Christmas Family Feud'}
                  subtitle={lang === 'cs' ? 'Hlavní hra' : 'Main event'}
                  description={
                    lang === 'cs'
                      ? 'Dva týmy soupeří. Hádejte odpovědi a odhalte je na tabuli.'
                      : 'Two teams compete. Guess answers to reveal them on the board.'
                  }
                  icon="🎯"
                  accent="red"
                  disabled={!isController || busy}
                  onClick={() => requestStartGame('family_feud')}
                />
              </div>
            </div>

            {/* Mini Games (fills remaining space) */}
            <div className="flex-1 min-h-0 flex flex-col">
              <div className="mb-1.5 flex items-center justify-between shrink-0">
                <div className="text-xs font-black tracking-widest text-white/60 uppercase">
                  {lang === 'cs' ? 'Mini hry' : 'Mini Games'}
                </div>
              </div>
              <div className="flex-1 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 md:gap-2.5 auto-rows-[minmax(100px,1fr)]">
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
                  <GameTile
                    title={lang === 'cs' ? 'Uhádni písničku' : 'Guess the Song'}
                    subtitle={lang === 'cs' ? 'Poslouchej & hádej' : 'Listen & guess'}
                    description={
                      lang === 'cs'
                        ? 'Poslouchej úryvek a uhodni vánoční písničku.'
                        : 'Listen to the snippet and guess the Christmas song.'
                    }
                    icon="🎵"
                    accent="blue"
                    disabled={!isController || busy}
                    onClick={() => requestStartGame('guess_the_song')}
                  />
                  <GameTile
                    title={lang === 'cs' ? 'Vánoční bingo' : 'Christmas Bingo'}
                    subtitle={lang === 'cs' ? 'Klasické bingo' : 'Classic bingo'}
                    description={lang === 'cs' ? 'Sleduj koule a označuj čísla na své kartě.' : 'Watch the balls and mark numbers on your card.'}
                    icon="🎄"
                    accent="red"
                    disabled={!isController || busy}
                    onClick={() => requestStartGame('bingo')}
                  />
                </div>
              </div>
            </div>
          </div>

          {!isController && (
            <p className="relative text-xs md:text-sm text-white/60 mt-3 md:mt-4 shrink-0 break-words">
              {lang === 'cs' ? 'Host spustí hru z TV.' : 'The host starts the game from the TV.'}
            </p>
          )}
        </div>
      );
    }

    if (sessionStatus === 'team_setup') {
      return (
        <FamilyFeudTeamSetup
          roomId={roomId}
          sessionId={sessionId!}
          room={room}
          players={players}
          lang={lang}
          isController={isController}
        />
      );
    }

    if (sessionStatus === 'intro') {
      return (
        <div className="flex-1 min-h-0 flex flex-col">
          <GameIntro
            className="flex-1 min-h-0"
            gameId={gameId}
            lang={lang}
            allowSkip={isController}
            onSkip={async () => {
              if (!isController) return;
              if (gameId === 'pictionary') {
                await controllerStartPictionaryRound({ roomId, sessionId, roundIndex: 0 });
              } else if (gameId === 'family_feud') {
                await startFamilyFeudRound({ roomId, sessionId, roundIndex: 0 });
              } else if (gameId === 'bingo') {
                await updateDoc(doc(db, 'rooms', roomId), {
                  'currentSession.status': 'in_game',
                } as any);
              } else {
                await controllerStartQuestion({ roomId, sessionId, questionIndex: 0 });
              }
            }}
          />
        </div>
      );
    }

    if (sessionStatus === 'in_game' || sessionStatus === 'in_round' || sessionStatus === 'steal' || sessionStatus === 'claiming') {
      // Family Feud uses full-screen game board
      if (gameId === 'family_feud') {
        return (
          <div className="flex-1 min-h-0 w-full flex flex-col">
            {renderQuestion()}
          </div>
        );
      }
      
      // Bingo should still use the center pillar styling (like other mini-games),
      // but keep its own internal layout.
      if (gameId === 'bingo') {
        return (
          <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/5 overflow-hidden">
            {renderQuestion()}
          </div>
        );
      }
      
      // Other games use the standard layout
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
              <TimerRing endsAt={currentSession.questionEndsAt} startedAt={currentSession.questionStartedAt} size={52} enableTickSound />
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

    if (sessionStatus === 'reveal' || sessionStatus === 'round_reveal') {
      if (gameId === 'family_feud') {
        // Family Feud shows the full game board with all answers revealed
        return (
          <div className="flex-1 min-h-0 w-full">
            {renderQuestion()}
          </div>
        );
      }
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
        <GameFinale
          ranked={ranked}
          gameTitle={gameLabel(gameId)}
          lang={lang}
          onBackToLobby={
            isController
              ? () => {
                  // Continue to the "choose next game" screen.
                  updateDoc(doc(db, 'rooms', roomId), { status: 'between_sessions', currentSession: null } as any).catch(() => {});
                }
              : undefined
          }
          showBackButton={isController}
          backButtonLabel={isController ? (lang === 'cs' ? 'Další hra' : 'Next game') : undefined}
        />
      );
    }

    return null;
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 flex flex-col">{view()}</div>
      {confirmModal}
      {generatingModal}
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

      isPictionaryGuessCorrect({ promptId, guess: text, roomId, sessionId })
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
            {lang === 'cs' ? 'Tipy se zobrazí na 5s a zmizí.' : 'Guesses appear for 5s then fade.'}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/30 overflow-hidden">
        <div className="relative">
          <canvas ref={canvasRef} id={canvasId} className="w-full h-[520px] bg-white/5" />
          <div className="absolute left-4 bottom-4 right-4 space-y-2 pointer-events-none">
            {visibleGuesses.map((g) => {
              const ageMs = Math.max(0, now - g.createdAt);
              const opacity = ageMs >= 5000 ? 0 : Math.max(0, 1 - ageMs / 5000);
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

function GuessTheSongTVQuestion(props: {
  item: ReturnType<typeof getGuessTheSongItemById>;
  questionIndex: number;
  totalQuestions: number;
  lang: 'en' | 'cs';
}) {
  const { item, questionIndex, totalQuestions, lang } = props;
  const { playSound } = useAudio();
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [replayCooldown, setReplayCooldown] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!item) return;
    
    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    
    const audio = new Audio(item.audioSrc);
    audio.volume = 0.3;
    audio.preload = 'auto';
    audioRef.current = audio;
    
    // Set up event handlers
    const handleEnded = () => {
      setAudioPlaying(false);
    };
    
    const handleError = () => {
      setAudioPlaying(false);
      setAutoplayBlocked(true);
    };
    
    const handleCanPlay = () => {
      // Try to auto-play once audio is ready
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setAudioPlaying(true);
            setAutoplayBlocked(false);
          })
          .catch((error) => {
            // Autoplay was blocked - this is expected in many browsers
            setAudioPlaying(false);
            setAutoplayBlocked(true);
            // Don't log to console as this is expected behavior
          });
      }
    };
    
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplaythrough', handleCanPlay);
    
    // Also try immediate play (may work if user has already interacted)
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setAudioPlaying(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          // Will try again on canplaythrough
          setAutoplayBlocked(true);
        });
    }

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplaythrough', handleCanPlay);
      audio.pause();
      audio.currentTime = 0;
      audio.src = '';
      setAudioPlaying(false);
      setAutoplayBlocked(false);
    };
  }, [item]);

  const handleReplay = () => {
    if (replayCooldown || !audioRef.current) return;
    setReplayCooldown(true);
    setAutoplayBlocked(false);
    setAudioPlaying(true);
    audioRef.current.currentTime = 0;
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setAudioPlaying(true);
        })
        .catch((error) => {
          setAudioPlaying(false);
          console.error('Failed to play audio:', error);
        });
    }
    setTimeout(() => setReplayCooldown(false), 2000);
  };

  if (!item) return null;

  return (
    <div className="space-y-4">
      <div className="text-white/70 text-sm">Song {questionIndex + 1}/{totalQuestions}</div>
      <div className="text-4xl font-black leading-tight text-center">{item.questionText[lang]}</div>
      
      <div className="flex items-center justify-center gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 flex items-center justify-center">
          <div className="text-6xl">🎵</div>
        </div>
        <button
          type="button"
          onClick={() => {
            playSound('click', 0.1);
            handleReplay();
          }}
          disabled={replayCooldown || audioPlaying}
          className="btn-secondary disabled:opacity-50"
        >
          {audioPlaying
            ? lang === 'cs'
              ? 'Přehrává se...'
              : 'Playing...'
            : replayCooldown
            ? lang === 'cs'
              ? 'Počkej...'
              : 'Wait...'
            : autoplayBlocked
            ? lang === 'cs'
              ? '▶️ Přehrát'
              : '▶️ Play snippet'
            : lang === 'cs'
            ? '▶️ Přehrát znovu'
            : '▶️ Replay snippet'}
        </button>
      </div>
      
      {autoplayBlocked && (
        <div className="text-center text-sm text-white/60">
          {lang === 'cs'
            ? 'Klikni na tlačítko pro přehrání úryvku.'
            : 'Click the button to play the snippet.'}
        </div>
      )}

      <div className="text-center text-white/60 text-sm">
        {lang === 'cs'
          ? 'Odpovědi se zobrazí na telefonech.'
          : 'Answers will appear on phones.'}
      </div>
    </div>
  );
}

function FamilyFeudTeamSetup(props: {
  roomId: string;
  sessionId: string;
  room: Room;
  players: Player[];
  lang: 'en' | 'cs';
  isController: boolean;
}) {
  const { roomId, sessionId, room, players, lang, isController } = props;
  const currentSession = room.currentSession;
  const teamMapping = currentSession?.teamMapping || {};
  const [draggedPlayer, setDraggedPlayer] = useState<string | null>(null);
  const [localMapping, setLocalMapping] = useState<Record<string, 'A' | 'B'>>(teamMapping);
  const { playSound } = useAudio();

  const teamA = players.filter((p) => localMapping[p.uid] === 'A');
  const teamB = players.filter((p) => localMapping[p.uid] === 'B');
  const unassigned = players.filter((p) => !localMapping[p.uid]);

  const handleRandomAssign = () => {
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    const newMapping: Record<string, 'A' | 'B'> = {};
    shuffled.forEach((p, idx) => {
      newMapping[p.uid] = idx % 2 === 0 ? 'A' : 'B';
    });
    setLocalMapping(newMapping);
    playSound('click', 0.1);
  };

  const handleSave = async () => {
    if (!isController) return;
    if (teamA.length === 0 || teamB.length === 0) {
      alert(lang === 'cs' ? 'Každý tým musí mít alespoň jednoho hráče.' : 'Each team must have at least one player.');
      return;
    }
    playSound('success', 0.15);
    await setFamilyFeudTeams({ roomId, sessionId, teamMapping: localMapping });
  };

  const handleDrop = (team: 'A' | 'B', uid: string) => {
    setLocalMapping((prev) => ({ ...prev, [uid]: team }));
    setDraggedPlayer(null);
    playSound('click', 0.05);
  };

  return (
    <div className="flex-1 min-h-0 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8 flex flex-col">
      <div className="mb-6">
        <h2 className="text-3xl font-black mb-2">
          {lang === 'cs' ? 'Rozdělení týmů' : 'Team Setup'}
        </h2>
        <p className="text-white/70 text-sm">
          {lang === 'cs' ? 'Přetáhněte hráče do týmů nebo použijte náhodné rozdělení.' : 'Drag players to teams or use random assignment.'}
        </p>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Team A */}
        <div 
          className="rounded-2xl border-2 border-christmas-red/40 bg-christmas-red/10 p-4"
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedPlayer) handleDrop('A', draggedPlayer);
          }}
        >
          <div className="text-xl font-black mb-3 text-christmas-red">
            {lang === 'cs' ? 'Tým A' : 'Team A'} ({teamA.length})
          </div>
          <div className="space-y-2 min-h-[200px]">
            {teamA.map((p) => (
              <div
                key={p.uid}
                draggable={isController}
                onDragStart={() => setDraggedPlayer(p.uid)}
                onDragEnd={() => setDraggedPlayer(null)}
                className="rounded-xl border border-white/20 bg-white/5 p-3 flex items-center gap-3 cursor-move"
              >
                <span className="text-2xl">{p.avatar}</span>
                <span className="font-semibold">{p.name}</span>
                {isController && (
                  <button
                    type="button"
                    onClick={() => setLocalMapping((prev) => {
                      const next = { ...prev };
                      delete next[p.uid];
                      return next;
                    })}
                    className="ml-auto text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {teamA.length === 0 && (
              <div className="text-white/40 text-sm text-center py-8">
                {lang === 'cs' ? 'Přetáhněte sem hráče' : 'Drag players here'}
              </div>
            )}
          </div>
        </div>

        {/* Unassigned */}
        <div className="rounded-2xl border border-white/20 bg-white/5 p-4">
          <div className="text-lg font-bold mb-3 text-white/70">
            {lang === 'cs' ? 'Nepřiřazeno' : 'Unassigned'} ({unassigned.length})
          </div>
          <div className="space-y-2 min-h-[200px]">
            {unassigned.map((p) => (
              <div
                key={p.uid}
                draggable={isController}
                onDragStart={() => setDraggedPlayer(p.uid)}
                onDragEnd={() => setDraggedPlayer(null)}
                className="rounded-xl border border-white/20 bg-white/5 p-3 flex items-center gap-3 cursor-move"
              >
                <span className="text-2xl">{p.avatar}</span>
                <span className="font-semibold">{p.name}</span>
              </div>
            ))}
            {unassigned.length === 0 && (
              <div className="text-white/40 text-sm text-center py-8">
                {lang === 'cs' ? 'Všichni přiřazeni' : 'All assigned'}
              </div>
            )}
          </div>
          {isController && unassigned.length > 0 && (
            <button
              type="button"
              onClick={handleRandomAssign}
              className="btn-secondary w-full mt-4 text-sm"
            >
              {lang === 'cs' ? '🎲 Náhodné rozdělení' : '🎲 Random Assign'}
            </button>
          )}
        </div>

        {/* Team B */}
        <div 
          className="rounded-2xl border-2 border-blue-400/40 bg-blue-400/10 p-4"
          onDragOver={(e) => {
            e.preventDefault();
            if (draggedPlayer) handleDrop('B', draggedPlayer);
          }}
        >
          <div className="text-xl font-black mb-3 text-blue-400">
            {lang === 'cs' ? 'Tým B' : 'Team B'} ({teamB.length})
          </div>
          <div className="space-y-2 min-h-[200px]">
            {teamB.map((p) => (
              <div
                key={p.uid}
                draggable={isController}
                onDragStart={() => setDraggedPlayer(p.uid)}
                onDragEnd={() => setDraggedPlayer(null)}
                className="rounded-xl border border-white/20 bg-white/5 p-3 flex items-center gap-3 cursor-move"
              >
                <span className="text-2xl">{p.avatar}</span>
                <span className="font-semibold">{p.name}</span>
                {isController && (
                  <button
                    type="button"
                    onClick={() => setLocalMapping((prev) => {
                      const next = { ...prev };
                      delete next[p.uid];
                      return next;
                    })}
                    className="ml-auto text-white/60 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {teamB.length === 0 && (
              <div className="text-white/40 text-sm text-center py-8">
                {lang === 'cs' ? 'Přetáhněte sem hráče' : 'Drag players here'}
              </div>
            )}
          </div>
        </div>
      </div>

      {isController && (
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleRandomAssign}
            className="btn-secondary"
          >
            {lang === 'cs' ? '🎲 Náhodně' : '🎲 Random'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={teamA.length === 0 || teamB.length === 0}
            className="btn-primary"
          >
            {lang === 'cs' ? 'Pokračovat' : 'Continue'}
          </button>
        </div>
      )}
    </div>
  );
}

function FamilyFeudTVRound(props: {
  roomId: string;
  sessionId: string;
  room: Room;
  players: Player[];
  selectedIds: string[] | null;
  roundIndex: number;
  questionId: string | null;
  lang: 'en' | 'cs';
  isController: boolean;
}) {
  const { roomId, sessionId, room, players, selectedIds, roundIndex, questionId, lang, isController } = props;
  const currentSession = room.currentSession;
  const [question, setQuestion] = useState<FamilyFeudQuestion | null>(null);
  
  // Load question (async for AI content)
  useEffect(() => {
    if (!questionId) {
      setQuestion(null);
      return;
    }
    
    getFamilyFeudItemById(questionId, roomId, sessionId).then((item) => {
      setQuestion(item || null);
    }).catch((error) => {
      console.error('Error loading Family Feud question:', error);
      setQuestion(null);
    });
  }, [questionId, roomId, sessionId]);
  
  const activeTeam = currentSession?.activeTeam || 'A';
  const strikes = currentSession?.strikes || 0;
  const revealedAnswerIds = currentSession?.revealedAnswerIds || [];
  const teamScores = currentSession?.teamScores || { A: 0, B: 0 };
  const teamMapping = currentSession?.teamMapping || {};
  const sessionStatus = currentSession?.status;
  const { playSound } = useAudio();
  const [showQuestion, setShowQuestion] = useState(true);
  const prevRevealedCount = useRef(0);
  const prevStrikes = useRef(0);

  // Default to showing the question on TV (more "game show" and less confusing).
  useEffect(() => {
    setShowQuestion(true);
  }, [questionId]);

  // Play sounds when answers are revealed or strikes occur
  useEffect(() => {
    const currentRevealedCount = revealedAnswerIds.length;
    const currentStrikes = strikes;

    // Answer revealed sound
    if (currentRevealedCount > prevRevealedCount.current && sessionStatus === 'in_round') {
      playSound('feud.reveal', 0.35);
    }

    // Strike sound
    if (currentStrikes > prevStrikes.current && sessionStatus === 'in_round') {
      playSound('feud.strike', 0.4);
    }

    // Steal opportunity sound
    if (sessionStatus === 'steal' && prevStrikes.current < 3) {
      playSound('feud.steal', 0.28);
    }

    prevRevealedCount.current = currentRevealedCount;
    prevStrikes.current = currentStrikes;
  }, [revealedAnswerIds.length, strikes, sessionStatus, playSound]);

  const handleEndRound = async () => {
    if (!isController) return;
    playSound('ui.transition', 0.25);
    await endFamilyFeudRound({ roomId, sessionId, roundIndex });
  };

  if (!question) {
    return (
      <div className="text-center text-white/70">
        {lang === 'cs' ? 'Načítání otázky...' : 'Loading question...'}
      </div>
    );
  }

  // Calculate current round score (sum of revealed answers)
  const currentRoundScore = question.answers
    .filter((a) => revealedAnswerIds.includes(a.id))
    .reduce((sum, a) => sum + a.points, 0);

  // In round_reveal status, show all answers (revealed and unrevealed)
  const showAllAnswers = sessionStatus === 'round_reveal';

  // Organize answers into two columns (left and right)
  const leftColumnAnswers = question.answers.filter((_, idx) => idx % 2 === 0);
  const rightColumnAnswers = question.answers.filter((_, idx) => idx % 2 === 1);

  return (
    <div
      // NOTE: This board is rendered inside the TV hub center column (already `flex-1 min-h-0`).
      // Do NOT force viewport min-heights here or it will overflow and look "too tall".
      className="relative w-full flex-1 min-h-0 flex flex-col items-stretch p-3 md:p-4"
      style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
    >
      {/* Outer frame with lights effect */}
      <div className="absolute inset-0 border-[14px] border-orange-500 rounded-3xl" style={{ boxShadow: 'inset 0 0 24px rgba(255, 165, 0, 0.26)' }} />
      <div className="absolute inset-[14px] border-[3px] border-black rounded-2xl" />
      <div className="absolute inset-[17px] border-[10px] rounded-xl" style={{ 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
        borderColor: '#1e40af',
        boxShadow: 'inset 0 0 50px rgba(30, 64, 175, 0.5), 0 0 100px rgba(37, 99, 235, 0.3)'
      }}>
        {/* Decorative lights on frame */}
        <div className="absolute top-2 left-2 right-2 h-4 flex gap-2">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full bg-amber-300/40" style={{ boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }} />
          ))}
        </div>
        <div className="absolute bottom-2 left-2 right-2 h-4 flex gap-2">
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} className="flex-1 h-2 rounded-full bg-amber-300/40" style={{ boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }} />
          ))}
        </div>
        <div className="absolute left-2 top-2 bottom-2 w-4 flex flex-col gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 w-2 rounded-full bg-amber-300/40" style={{ boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }} />
          ))}
        </div>
        <div className="absolute right-2 top-2 bottom-2 w-4 flex flex-col gap-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex-1 w-2 rounded-full bg-amber-300/40" style={{ boxShadow: '0 0 8px rgba(251, 191, 36, 0.6)' }} />
          ))}
        </div>

        {/* Main content area */}
        <div className="relative z-10 flex-1 min-h-0 flex flex-col p-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <div className="text-5xl md:text-6xl font-black text-white tracking-wider" style={{ textShadow: '0 0 18px rgba(255, 255, 255, 0.75), 0 0 34px rgba(255, 255, 255, 0.35)' }}>
                ROUND
              </div>
              <div className="text-3xl font-black text-white/80">
                {roundIndex + 1}/{selectedIds?.length || 4}
              </div>
            </div>
            <div className="flex items-center gap-8">
              {/* Current Score Display */}
              <div className="bg-sky-300 rounded-xl px-6 py-3 border-4 border-white" style={{ boxShadow: '0 0 26px rgba(125, 211, 252, 0.75), inset 0 0 18px rgba(255, 255, 255, 0.28)' }}>
                <div className="text-7xl font-black text-white" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)' }}>
                  {currentRoundScore}
                </div>
              </div>
            </div>
          </div>

          {/* Question area */}
          <div className="mb-4 shrink-0">
            {showQuestion || showAllAnswers ? (
              <div className="bg-blue-900 rounded-2xl p-4 border-4 border-white min-h-[96px] flex items-center justify-center">
                <div className="text-3xl md:text-4xl font-black text-white text-center leading-tight" style={{ textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)' }}>
                  {question.question[lang]}
                </div>
              </div>
            ) : (
              <div className="bg-blue-900 rounded-2xl p-4 border-4 border-white min-h-[96px] flex items-center justify-center">
                <div className="text-3xl text-white/50 font-bold">
                  {lang === 'cs' ? 'Otázka je skryta' : 'Question Hidden'}
                </div>
              </div>
            )}
            {isController && !showAllAnswers && (
              <button
                type="button"
                onClick={() => setShowQuestion(!showQuestion)}
                className="mt-3 bg-black text-white px-6 py-3 rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors"
              >
                {showQuestion ? (lang === 'cs' ? 'SKRÝT OTÁZKU' : 'HIDE QUESTION') : (lang === 'cs' ? 'ZOBRAZIT OTÁZKU' : 'SHOW QUESTION')}
              </button>
            )}
            {showAllAnswers && (
              <div className="mt-3 text-center">
                <div className="inline-block bg-yellow-400 text-black px-6 py-3 rounded-lg font-black text-lg animate-pulse" style={{ boxShadow: '0 0 30px rgba(250, 204, 21, 0.6)' }}>
                  {lang === 'cs' ? 'KONEC KOLA - VŠECHNY ODPOVĚDI' : 'ROUND END - ALL ANSWERS'}
                </div>
              </div>
            )}
          </div>

          {/* Answer Board - Two Columns */}
          <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 mb-4">
            {/* Left Column */}
            <div className="min-h-0 grid grid-rows-4 gap-3">
              {leftColumnAnswers.map((answer) => {
                const isRevealed = revealedAnswerIds.includes(answer.id) || showAllAnswers;
                const wasRevealed = revealedAnswerIds.includes(answer.id);
                return (
                  <div
                    key={answer.id}
                    className="relative bg-blue-900 rounded-lg border-2 border-white/90 overflow-hidden transition-all duration-500"
                    style={{
                      boxShadow: isRevealed ? '0 0 18px rgba(255, 255, 255, 0.28), inset 0 0 12px rgba(255, 255, 255, 0.08)' : '0 0 8px rgba(0, 0, 0, 0.45)',
                      transform: isRevealed ? 'scale(1.01)' : 'scale(1)',
                      opacity: showAllAnswers && !wasRevealed ? 0.7 : 1,
                    }}
                  >
                    {isRevealed ? (
                      <>
                        {/* Points box */}
                        <div className={`absolute top-2 right-2 rounded-md px-3 py-1.5 border-2 ${
                          wasRevealed ? 'bg-white border-blue-600' : 'bg-gray-400 border-gray-500'
                        }`}>
                          <div className={`text-2xl md:text-3xl font-black ${wasRevealed ? 'text-blue-600' : 'text-gray-700'}`} style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.25)' }}>
                            {answer.points}
                          </div>
                        </div>
                        {/* Answer text */}
                        <div className="p-4 pr-20">
                          <div className={`text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-wide ${wasRevealed ? 'text-white' : 'text-gray-300'}`} style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.75)' }}>
                            {answer.text[lang]}
                          </div>
                          {showAllAnswers && !wasRevealed && (
                            <div className="text-xs text-gray-400 mt-1 font-semibold">
                              {lang === 'cs' ? '(Neuhodnuto)' : '(Not guessed)'}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-3 min-h-[64px] flex items-center justify-center">
                        <div className="text-4xl font-black text-white/15">?</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Right Column */}
            <div className="min-h-0 grid grid-rows-4 gap-3">
              {rightColumnAnswers.map((answer) => {
                const isRevealed = revealedAnswerIds.includes(answer.id) || showAllAnswers;
                const wasRevealed = revealedAnswerIds.includes(answer.id);
                return (
                  <div
                    key={answer.id}
                    className="relative bg-blue-900 rounded-lg border-2 border-white/90 overflow-hidden transition-all duration-500"
                    style={{
                      boxShadow: isRevealed ? '0 0 18px rgba(255, 255, 255, 0.28), inset 0 0 12px rgba(255, 255, 255, 0.08)' : '0 0 8px rgba(0, 0, 0, 0.45)',
                      transform: isRevealed ? 'scale(1.01)' : 'scale(1)',
                      opacity: showAllAnswers && !wasRevealed ? 0.7 : 1,
                    }}
                  >
                    {isRevealed ? (
                      <>
                        {/* Points box */}
                        <div className={`absolute top-2 right-2 rounded-md px-3 py-1.5 border-2 ${
                          wasRevealed ? 'bg-white border-blue-600' : 'bg-gray-400 border-gray-500'
                        }`}>
                          <div className={`text-2xl md:text-3xl font-black ${wasRevealed ? 'text-blue-600' : 'text-gray-700'}`} style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.25)' }}>
                            {answer.points}
                          </div>
                        </div>
                        {/* Answer text */}
                        <div className="p-4 pr-20">
                          <div className={`text-xl md:text-2xl lg:text-3xl font-black uppercase tracking-wide ${wasRevealed ? 'text-white' : 'text-gray-300'}`} style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.75)' }}>
                            {answer.text[lang]}
                          </div>
                          {showAllAnswers && !wasRevealed && (
                            <div className="text-xs text-gray-400 mt-1 font-semibold">
                              {lang === 'cs' ? '(Neuhodnuto)' : '(Not guessed)'}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="p-3 min-h-[64px] flex items-center justify-center">
                        <div className="text-4xl font-black text-white/15">?</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Team Scores */}
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-sm text-white/80 mb-1 font-bold">{lang === 'cs' ? 'TÝM A' : 'TEAM A'}</div>
                  <div className={`text-5xl font-black ${activeTeam === 'A' && sessionStatus === 'in_round' ? 'text-red-500' : 'text-white'}`} style={{ textShadow: activeTeam === 'A' && sessionStatus === 'in_round' ? '0 0 20px rgba(239, 68, 68, 0.8)' : '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
                    {teamScores.A}
                  </div>
                </div>
                <div className="text-4xl font-black text-white">-</div>
                <div className="text-center">
                  <div className="text-sm text-white/80 mb-1 font-bold">{lang === 'cs' ? 'TÝM B' : 'TEAM B'}</div>
                  <div className={`text-5xl font-black ${activeTeam === 'B' && sessionStatus === 'in_round' ? 'text-blue-400' : 'text-white'}`} style={{ textShadow: activeTeam === 'B' && sessionStatus === 'in_round' ? '0 0 20px rgba(96, 165, 250, 0.8)' : '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
                    {teamScores.B}
                  </div>
                </div>
              </div>
            </div>

            {/* Strikes */}
            {sessionStatus === 'in_round' && (
              <div className="flex items-center gap-3">
                <div className="text-2xl font-black text-white mr-2">{lang === 'cs' ? 'CHYBY:' : 'STRIKES:'}</div>
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center bg-red-600"
                    style={{
                      boxShadow: i <= strikes ? '0 0 30px rgba(220, 38, 38, 0.8), inset 0 0 20px rgba(0, 0, 0, 0.3)' : '0 0 10px rgba(0, 0, 0, 0.5)',
                    }}
                  >
                    <div className="text-4xl font-black text-white" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)' }}>
                      {i <= strikes ? '✕' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Steal indicator */}
            {sessionStatus === 'steal' && (
              <div className="bg-yellow-400 rounded-xl px-8 py-4 border-4 border-white animate-pulse" style={{ boxShadow: '0 0 40px rgba(250, 204, 21, 0.8)' }}>
                <div className="text-3xl font-black text-black uppercase tracking-wider">
                  {lang === 'cs' ? `TÝM ${activeTeam} MŮŽE UKRÁST!` : `TEAM ${activeTeam} CAN STEAL!`}
                </div>
              </div>
            )}

            {/* Round summary when showing all answers */}
            {showAllAnswers && (
              <div className="mt-4 text-center">
                <div className="inline-block bg-white/10 rounded-xl px-6 py-3 border-2 border-white/30">
                  <div className="text-sm text-white/80 mb-1 font-bold">
                    {lang === 'cs' ? 'Body v tomto kole' : 'Points this round'}
                  </div>
                  <div className="text-3xl font-black text-white">
                    {currentRoundScore}
                  </div>
                </div>
              </div>
            )}

            {/* Controller actions */}
            {isController && sessionStatus === 'round_reveal' && (
              <div className="flex justify-center mt-4">
                <button
                  type="button"
                  onClick={handleEndRound}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-xl font-black text-xl border-4 border-white hover:from-blue-600 hover:to-blue-700 transition-all"
                  style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.6)' }}
                >
                  {lang === 'cs' ? 'DALŠÍ KOLO >>' : 'NEXT ROUND >>'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BingoTVRound(props: {
  roomId: string;
  sessionId: string;
  room: Room;
  players: Player[];
  lang: 'en' | 'cs';
  isController: boolean;
}) {
  const { roomId, sessionId, room, players, lang, isController } = props;
  const { playSound } = useAudio();
  const currentSession = room.currentSession;
  const drawnBalls = currentSession?.drawnBalls || [];
  const currentBall = drawnBalls.length > 0 ? drawnBalls[drawnBalls.length - 1] : null;
  const bingoWinners: string[] = Array.isArray((currentSession as any)?.bingoWinners)
    ? (((currentSession as any).bingoWinners as string[]) || [])
    : [];
  const bingoMode = ((currentSession as any)?.bingoMode === 'top3' ? 'top3' : 'first') as 'first' | 'top3';
  const lastWinnerUid = (currentSession as any)?.bingoLastWinnerUid || bingoWinners[bingoWinners.length - 1] || null;
  const winner = lastWinnerUid ? players.find((p) => p.uid === lastWinnerUid) : null;
  const [isDrawing, setIsDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const sessionStatus = currentSession?.status;
  const autoAdvanceScheduledRef = useRef(false);
  const processingClaimsRef = useRef<Set<string>>(new Set());

  // Process bingo claims coming from phones (stored under sessions/{sessionId}/claims)
  useEffect(() => {
    if (!isController) return;
    const claimsRef = collection(db, 'rooms', roomId, 'sessions', sessionId, 'claims');
    const unsubscribe = onSnapshot(
      claimsRef,
      (snap) => {
        snap.docChanges().forEach((change) => {
          const data = change.doc.data() as any;
          const status = data?.status || 'pending';
          const uid = data?.uid || change.doc.id;
          if (status !== 'pending' || !uid) return;
          if (processingClaimsRef.current.has(change.doc.id)) return;
          processingClaimsRef.current.add(change.doc.id);

          claimBingo({ roomId, sessionId, uid })
            .then((res) =>
              setDoc(
                change.doc.ref,
                { status: 'processed', result: res, processedAt: Date.now() },
                { merge: true }
              )
            )
            .catch((err: any) => {
              setDoc(
                change.doc.ref,
                { status: 'error', error: err?.message || 'Failed', processedAt: Date.now() },
                { merge: true }
              ).catch(() => {});
              toast.error(err?.message || 'Failed to process bingo claim');
            })
            .finally(() => {
              processingClaimsRef.current.delete(change.doc.id);
            });
        });
      },
      (error) => {
        console.error('[BingoTV] Claims listener error', error);
        toast.error(error?.message || 'Bingo claims listener error');
      }
    );
    return () => unsubscribe();
  }, [isController, roomId, sessionId]);

  const handleDrawBall = async () => {
    if (busy || isDrawing || sessionStatus !== 'in_game') return;
    setBusy(true);
    setIsDrawing(true);
    try {
      playSound('ui.click', 0.25);
      await drawBingoBall({ roomId, sessionId });
      playSound('bingo.spin', 0.22);
    } catch (error: any) {
      toast.error(error.message || 'Failed to draw ball');
    } finally {
      setBusy(false);
      setTimeout(() => setIsDrawing(false), 1000);
    }
  };

  const handleFinishGame = async () => {
    if (busy) return;
    setBusy(true);
    try {
      playSound('game.game_win', 0.25);
      await finishBingoGame({ roomId, sessionId });
    } catch (error: any) {
      toast.error(error.message || 'Failed to finish game');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!isController) return;
    if (sessionStatus !== 'claiming') {
      autoAdvanceScheduledRef.current = false;
      return;
    }
    if (!lastWinnerUid) return;
    if (autoAdvanceScheduledRef.current) return;
    autoAdvanceScheduledRef.current = true;

    const t = setTimeout(() => {
      // In top3 mode: auto-resume if we still need more winners; auto-finish at 3.
      // In first mode: do nothing (host chooses end/continue).
      if (bingoMode === 'top3') {
        if (bingoWinners.length >= 3) {
          handleFinishGame().catch(() => {});
        } else {
          // Resume the game so more players can claim.
          updateDoc(doc(db, 'rooms', roomId), {
            'currentSession.status': 'in_game',
          } as any).catch(() => {});
        }
      }
    }, 2500);

    return () => clearTimeout(t);
    // Intentionally exclude handleFinishGame (it closes over busy, and we guard via ref).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isController, sessionStatus, lastWinnerUid, bingoMode, bingoWinners.length, roomId, sessionId]);

  const handleContinueTop3 = async () => {
    if (!isController || busy) return;
    setBusy(true);
    try {
      playSound('ui.click', 0.25);
      await updateDoc(doc(db, 'rooms', roomId), {
        'currentSession.bingoMode': 'top3',
        'currentSession.status': 'in_game',
      } as any);
    } catch (error: any) {
      toast.error(error.message || 'Failed to continue');
    } finally {
      setBusy(false);
    }
  };

  // Show winner celebration while a claim is being shown (or after finishing)
  if ((sessionStatus === 'claiming' || sessionStatus === 'finished') && winner) {
    const revealData = currentSession?.revealData as any;
    const place = Number(revealData?.placement ?? bingoWinners.indexOf(winner.uid) + 1) || null;
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-8">
        <div className="text-center space-y-6">
          <div className="text-8xl mb-4 animate-bounce">🎉</div>
          <div className="text-6xl font-black text-christmas-gold mb-2">
            {lang === 'cs' ? 'BINGO!' : 'BINGO!'}
          </div>
          {place ? (
            <div className="text-xl text-white/70">
              {lang === 'cs' ? `Místo: #${place}` : `Place: #${place}`}
            </div>
          ) : null}
          <div className="text-4xl font-bold text-white mb-4">
            {winner.name} {winner.avatar}
          </div>
          {revealData?.pattern && (
            <div className="text-xl text-white/70">
              {lang === 'cs' ? `Výherní vzor: ${revealData.pattern}` : `Winning pattern: ${revealData.pattern}`}
            </div>
          )}
          {isController && (
            <div className="flex flex-col items-center gap-3 mt-6">
              {bingoMode === 'first' && bingoWinners.length === 1 ? (
                <>
                  <button
                    type="button"
                    className="btn-primary text-lg"
                    onClick={handleFinishGame}
                    disabled={busy}
                  >
                    {lang === 'cs' ? 'Ukončit hru (výsledky)' : 'End game (results)'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary text-lg"
                    onClick={handleContinueTop3}
                    disabled={busy}
                  >
                    {lang === 'cs' ? 'Pokračovat na TOP 3' : 'Continue to Top 3'}
                  </button>
                </>
              ) : (
                <>
                  {/* In top3 mode, we auto-advance; keep a manual finish button as a safety valve */}
                  <button
                    type="button"
                    className="btn-primary text-lg"
                    onClick={handleFinishGame}
                    disabled={busy}
                  >
                    {lang === 'cs' ? 'Ukončit hru' : 'Finish game'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col p-6 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-2xl font-black text-white mb-1">
            {lang === 'cs' ? '🎄 Vánoční Bingo' : '🎄 Christmas Bingo'}
          </div>
          <div className="text-white/70 text-sm">
            {lang === 'cs' ? `Vylosováno: ${drawnBalls.length}/75` : `Drawn: ${drawnBalls.length}/75`}
          </div>
        </div>
        {isController && sessionStatus === 'in_game' && (
          <button
            type="button"
            className="btn-primary text-lg px-6 py-3"
            onClick={handleDrawBall}
            disabled={busy || isDrawing || drawnBalls.length >= 75}
          >
            {isDrawing
              ? lang === 'cs'
                ? 'Losuje se...'
                : 'Drawing...'
              : lang === 'cs'
              ? 'Vylosovat kouli'
              : 'Draw Next Ball'}
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 flex items-center justify-center">
        <BingoBallMachine currentBall={currentBall} isDrawing={isDrawing} lang={lang} />
      </div>

      {/* Recently drawn balls */}
      {drawnBalls.length > 0 && (
        <div className="mt-6">
          <div className="text-white/70 text-sm mb-3">
            {lang === 'cs' ? 'Nedávno vylosované:' : 'Recently drawn:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {drawnBalls.slice(-5).reverse().map((ball, idx) => (
              <div
                key={idx}
                className="px-4 py-2 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500 border-2 border-yellow-600 text-blue-900 font-black text-lg shadow-lg"
              >
                {ball}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



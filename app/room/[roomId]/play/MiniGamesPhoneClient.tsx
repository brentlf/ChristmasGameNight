'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { MiniGameType, Player, Room } from '@/types';
import { getLanguage, t } from '@/lib/i18n';
import { useSessionSelected } from '@/lib/hooks/useSessionSelected';
import { useSessionAnswers } from '@/lib/hooks/useSessionAnswers';
import { useSessionScores } from '@/lib/hooks/useSessionScores';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { submitSessionAnswer, submitFamilyFeudAnswer, submitFamilyFeudSteal } from '@/lib/sessions/sessionEngine';
import { getGuessTheSongItemById, getFamilyFeudItemById } from '@/lib/miniGameContent';
import type { FamilyFeudQuestion } from '@/content/family_feud_christmas';
import TimerRing from '@/app/components/TimerRing';
import GameIntro from '@/app/components/GameIntro';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateSeed, shuffleSeeded } from '@/lib/utils/seededRandom';
import { useAudio } from '@/lib/contexts/AudioContext';
import { getPictionaryItemById } from '@/lib/miniGameContent';
import { submitPictionaryGuess, writePictionaryLive, type PictionarySegment } from '@/lib/sessions/pictionaryClient';
import { usePictionaryLive } from '@/lib/hooks/usePictionaryLive';
import { useGameContent } from '@/lib/hooks/useGameContent';

// TypeScript declarations for Speech Recognition API
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function answeredProgress(answered: number, total: number) {
  return `${Math.min(answered, total)}/${Math.max(total, 0)}`;
}

export default function MiniGamesPhoneClient(props: { roomId: string; room: Room; player: Player }) {
  const { roomId, room, player } = props;
  const lang = getLanguage();
  const { playSound } = useAudio();
  const { players: allPlayers } = usePlayers(roomId);

  const currentSession = room.currentSession ?? null;
  const sessionId = currentSession?.sessionId ?? null;
  const gameId = (currentSession?.gameId as MiniGameType | undefined) ?? undefined;
  const status = currentSession?.status ?? 'between';
  const questionIndex = typeof currentSession?.questionIndex === 'number' ? currentSession.questionIndex : null;

  const { selectedIds } = useSessionSelected(roomId, sessionId);
  const { answersForQuestion } = useSessionAnswers(roomId, sessionId, questionIndex);
  const { scores } = useSessionScores(roomId, sessionId);

  const activeUids = currentSession?.activePlayerUids ?? [];
  const activeCount = activeUids.length;
  const answeredCount = answersForQuestion.length;

  const myAnswered = useMemo(() => {
    if (questionIndex === null) return false;
    return answersForQuestion.some((a) => a.uid === player.uid && a.questionIndex === questionIndex);
  }, [answersForQuestion, player.uid, questionIndex]);

  const [localIntroDismissedSessionId, setLocalIntroDismissedSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId && status === 'intro') {
      // Reset local dismissal when a new session starts.
      setLocalIntroDismissedSessionId(null);
    }
  }, [sessionId, status]);

  const setReady = async (ready: boolean) => {
    try {
      await updateDoc(doc(db, 'rooms', roomId, 'players', player.uid), {
        ready,
        lastActiveAt: Date.now(),
      } as any);
      playSound('click');
    } catch (e: any) {
      toast.error(e?.message || t('common.error', lang));
    }
  };

  const submit = async (answer: string | number | null) => {
    if (!sessionId || questionIndex === null || !gameId) return;
    try {
      playSound('click');
      await submitSessionAnswer({ roomId, sessionId, uid: player.uid, questionIndex, answer });
      playSound('success', 0.12);
    } catch (e: any) {
      toast.error(e?.message || t('common.error', lang));
    }
  };

  const content = useGameContent(gameId || null, questionIndex, selectedIds, roomId, sessionId);

  // Lobby / between sessions
  if (!currentSession || !sessionId || !gameId || status === 'between' || room.status === 'between_sessions') {
    return (
      <main className="min-h-dvh px-4 py-10 md:py-16">
        <div className="mx-auto max-w-xl">
          <div className="card text-center relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />
            <div className="relative">
              <div className="text-5xl mb-4">{player.avatar}</div>
              <h1 className="game-show-title mb-2">{room.name}</h1>
              <p className="text-white/75 mb-6">{lang === 'cs' ? 'Čekej na hostitele na TV…' : 'Waiting for the host on TV…'}</p>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-5">
                <p className="text-sm text-white/70 mb-3">{lang === 'cs' ? 'Jsi připravený?' : 'Ready to play?'}</p>
                <button
                  type="button"
                  className={player.ready ? 'btn-primary w-full' : 'btn-secondary w-full'}
                  onClick={() => setReady(!Boolean(player.ready))}
                >
                  {player.ready ? (lang === 'cs' ? '✅ Připraven' : '✅ Ready') : lang === 'cs' ? 'Tapni Ready' : 'Tap Ready'}
                </button>
              </div>

              <Link href={`/room/${roomId}/tv`} className="btn-secondary inline-block">
                📺 {t('race.tv', lang) || 'TV'}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Team setup for Family Feud
  if (status === 'team_setup') {
    return (
      <main className="min-h-dvh px-4 py-10 md:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="card text-center">
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="game-show-title mb-2">
              {lang === 'cs' ? 'Vánoční rodinný souboj' : 'Christmas Family Feud'}
            </h1>
            <p className="text-white/70 mb-6">
              {lang === 'cs' ? 'Host rozdělí týmy na TV.' : 'The host will assign teams on the TV.'}
            </p>
            <p className="text-sm text-white/60">
              {lang === 'cs' ? 'Počkej, až host dokončí rozdělení týmů.' : 'Wait for the host to finish team setup.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Intro (players can locally dismiss; controller can skip globally)
  if (status === 'intro' && localIntroDismissedSessionId !== sessionId) {
    return (
      <main className="min-h-dvh px-4 py-10 md:py-12">
        <div className="mx-auto max-w-3xl">
          <GameIntro
            gameId={gameId}
            lang={lang}
            allowSkip
            onSkip={() => setLocalIntroDismissedSessionId(sessionId)}
          />
          <div className="mt-4 text-center text-sm text-white/60">
            {lang === 'cs' ? 'TV může intro přeskočit pro všechny.' : 'The TV can skip the intro for everyone.'}
          </div>
        </div>
      </main>
    );
  }

  // In-game
  if (status === 'in_game' || status === 'in_round' || status === 'steal') {
    if (gameId === 'family_feud') {
      const roundIndex = currentSession?.roundIndex ?? 0;
      const questionId = selectedIds?.[roundIndex] ?? null;
      const teamMapping = currentSession?.teamMapping || {};
      const userTeam = teamMapping[player.uid];
      const activeTeam = currentSession?.activeTeam || 'A';
      const sessionStatus = currentSession?.status;
      
      return (
        <FamilyFeudPhoneRound
          roomId={roomId}
          sessionId={sessionId!}
          roundIndex={roundIndex}
          questionId={questionId}
          player={player}
          userTeam={userTeam}
          activeTeam={activeTeam}
          sessionStatus={sessionStatus}
          totalRounds={selectedIds?.length || 4}
        />
      );
    }
    
    if (gameId === 'pictionary') {
      const isDrawer = player.uid === (currentSession.drawerUid ?? null);
      const prompt = content?.type === 'pictionary' ? content.item : null;
      const drawerName = (() => {
        // We don't have players list on phone; show minimal.
        return isDrawer ? player.name : (lang === 'cs' ? 'Sleduj TV' : 'Watch the TV');
      })();
      return isDrawer ? (
        <PictionaryDrawerPhone
          roomId={roomId}
          sessionId={sessionId}
          roundIndex={questionIndex!}
          totalRounds={selectedIds.length}
          endsAt={currentSession.questionEndsAt}
          startedAt={currentSession.questionStartedAt}
          promptText={(prompt?.prompt?.[lang] ?? '').toString()}
        />
      ) : (
        <PictionaryGuesserPhone
          roomId={roomId}
          sessionId={sessionId}
          roundIndex={questionIndex!}
          promptId={selectedIds?.[questionIndex!] ?? null}
          totalRounds={selectedIds.length}
          endsAt={currentSession.questionEndsAt}
          startedAt={currentSession.questionStartedAt}
          player={player}
          drawerLabel={drawerName}
        />
      );
    }

    return (
      <main className="min-h-dvh px-4 py-6 md:py-10">
        <div className="max-w-xl mx-auto space-y-4">
          <div className="card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold">{room.name}</h1>
                <p className="text-white/70 text-sm">
                  {lang === 'cs' ? 'Otázka' : 'Q'} {questionIndex! + 1}/{selectedIds.length}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TimerRing endsAt={currentSession.questionEndsAt} startedAt={currentSession.questionStartedAt} size={46} />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/70">
                {lang === 'cs' ? 'Odpovězeno' : 'Answered'}: <span className="font-bold text-christmas-gold">{answeredProgress(answeredCount, activeCount)}</span>
              </p>
              {myAnswered && (
                <span className="text-xs px-2 py-1 rounded-full bg-white/10 border border-white/10 text-white/70">
                  {lang === 'cs' ? 'Zamčeno' : 'Locked'}
                </span>
              )}
            </div>

            {myAnswered ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
                <div className="text-4xl mb-3">⏳</div>
                <p className="text-white/90 font-semibold">{lang === 'cs' ? 'Čekáme na ostatní…' : 'Waiting for others…'}</p>
                <p className="text-sm text-white/60 mt-1">
                  {lang === 'cs' ? 'Odpovězeno' : 'Answered'} {answeredProgress(answeredCount, activeCount)}
                </p>
              </div>
            ) : (
              <>
                {content?.type === 'trivia' && content.item && (
                  <div className="space-y-3">
                    <p className="text-sm text-white/70">{content.item.question[lang]}</p>
                    {content.item.options[lang].map((opt: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => submit(idx)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 text-left"
                      >
                        <span className="text-white/60 mr-2">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}

                {content?.type === 'emoji' && content.item && (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <div className="text-8xl mb-2">{content.item.emoji}</div>
                      <p className="text-sm text-white/70">{lang === 'cs' ? 'Vyber odpověď:' : 'Pick an answer:'}</p>
                    </div>
                    {(() => {
                      const seed = generateSeed(roomId, questionIndex!);
                      const opts = shuffleSeeded([content.item.correct[lang], ...content.item.decoyOptions[lang]], seed);
                      return opts.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => submit(opt)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 text-left"
                        >
                          {opt}
                        </button>
                      ));
                    })()}
                  </div>
                )}

                {content?.type === 'wyr' && content.item && (
                  <div className="space-y-3">
                    <p className="text-sm text-white/70">{content.item.prompt[lang]}</p>
                    <button
                      type="button"
                      onClick={() => submit('A')}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-5 text-left"
                    >
                      <div className="text-xs text-white/60 font-black mb-1">A</div>
                      <div className="text-xl font-semibold">{content.item.optionA[lang]}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => submit('B')}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-5 text-left"
                    >
                      <div className="text-xs text-white/60 font-black mb-1">B</div>
                      <div className="text-xl font-semibold">{content.item.optionB[lang]}</div>
                    </button>
                  </div>
                )}

                {content?.type === 'guess_the_song' && content.item && (
                  <div className="space-y-3">
                    <div className="text-center mb-4">
                      <div className="text-6xl mb-2">🎵</div>
                      <p className="text-sm text-white/70">{content.item.questionText[lang]}</p>
                      <p className="text-xs text-white/50 mt-2">
                        {lang === 'cs' ? 'Sleduj TV pro přehrání úryvku.' : 'Watch TV for audio snippet.'}
                      </p>
                    </div>
                    {content.item.options[lang].map((opt: string, idx: number) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => submit(idx)}
                        className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 text-left"
                      >
                        <span className="text-white/60 mr-2">{String.fromCharCode(65 + idx)}.</span>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Reveal
  if (status === 'reveal' || status === 'round_reveal') {
    if (gameId === 'family_feud') {
      const roundIndex = currentSession?.roundIndex ?? 0;
      const teamScores = currentSession?.teamScores || { A: 0, B: 0 };
      const teamMapping = currentSession?.teamMapping || {};
      const userTeam = teamMapping[player.uid];
      
      return (
        <main className="min-h-dvh px-4 py-10">
          <div className="max-w-xl mx-auto">
            <div className="card text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h1 className="text-3xl font-black mb-2">
                {lang === 'cs' ? 'Konec kola' : 'Round End'}
              </h1>
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-white/70 text-sm mb-2">{lang === 'cs' ? 'Skóre týmů' : 'Team Scores'}</div>
                  <div className="flex justify-around">
                    <div>
                      <div className="text-xs text-white/60">{lang === 'cs' ? 'Tým A' : 'Team A'}</div>
                      <div className="text-3xl font-black text-christmas-red">{teamScores.A}</div>
                    </div>
                    <div>
                      <div className="text-xs text-white/60">{lang === 'cs' ? 'Tým B' : 'Team B'}</div>
                      <div className="text-3xl font-black text-blue-400">{teamScores.B}</div>
                    </div>
                  </div>
                </div>
                {userTeam && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-white/70 text-sm">{lang === 'cs' ? 'Tvůj tým' : 'Your team'}</div>
                    <div className="text-2xl font-black mt-1">
                      {lang === 'cs' ? `Tým ${userTeam}` : `Team ${userTeam}`}: {teamScores[userTeam] || 0}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/50 mt-4">
                {lang === 'cs' ? 'Další kolo hned…' : 'Next round in a moment…'}
              </p>
            </div>
          </div>
        </main>
      );
    }
    
    // Continue with existing reveal logic for other games
    const r = currentSession.revealData ?? {};
    const correctUids: string[] = Array.isArray(r.correctUids) ? r.correctUids : [];
    const isCorrect = correctUids.includes(player.uid);
    const scoreMap = new Map(scores.map((s) => [s.uid, Number((s as any).score ?? 0)]));
    const myScore = scoreMap.get(player.uid) ?? 0;

    return (
      <main className="min-h-dvh px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            {gameId === 'pictionary' ? (
              <>
                <div className="text-6xl mb-4">{r?.timedOut ? '⏱️' : '✅'}</div>
                <h1 className="text-3xl font-black mb-2">
                  {r?.timedOut ? (lang === 'cs' ? 'Čas vypršel' : 'Time’s up') : lang === 'cs' ? 'Uhodnuto!' : 'Guessed!'}
                </h1>
                {!r?.timedOut && (
                  <p className="text-white/70">
                    {lang === 'cs' ? 'Správně uhodl(a):' : 'Correct:'}{' '}
                    <span className="font-black text-christmas-gold">{String(r.correctName ?? '')}</span>
                  </p>
                )}
              </>
            ) : gameId === 'wyr' ? (
              <>
                <div className="text-6xl mb-4">📊</div>
                <h1 className="text-3xl font-black mb-2">{lang === 'cs' ? 'Hlas započítán' : 'Vote locked'}</h1>
                <p className="text-white/70">
                  A: {Number(r.aPct ?? 0)}% • B: {Number(r.bPct ?? 0)}%
                </p>
                <p className="text-sm text-white/60 mt-2">{(r.commentary?.[lang] ?? r.commentary?.en ?? '').toString()}</p>
              </>
            ) : gameId === 'guess_the_song' ? (
              <>
                <div className="text-6xl mb-4">{isCorrect ? '✅' : '❌'}</div>
                <h1 className="text-3xl font-black mb-2">
                  {isCorrect ? (lang === 'cs' ? 'Správně!' : 'Correct!') : lang === 'cs' ? 'Vedle…' : 'Not quite…'}
                </h1>
                <p className="text-white/70">
                  {lang === 'cs' ? 'Správně bylo:' : 'It was:'}{' '}
                  <span className="font-black text-christmas-gold">{(r.correctAnswer?.[lang] ?? r.correctAnswer?.en ?? '').toString()}</span>
                </p>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">{isCorrect ? '✅' : '❌'}</div>
                <h1 className="text-3xl font-black mb-2">
                  {isCorrect ? (lang === 'cs' ? 'Správně!' : 'Correct!') : lang === 'cs' ? 'Vedle…' : 'Not quite…'}
                </h1>
                {gameId === 'emoji' && (
                  <p className="text-white/70">
                    {lang === 'cs' ? 'Správně bylo:' : 'It was:'}{' '}
                    <span className="font-black text-christmas-gold">{(r.correct?.[lang] ?? r.correct?.en ?? '').toString()}</span>
                  </p>
                )}
              </>
            )}

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-white/70 text-sm">{lang === 'cs' ? 'Tvoje skóre (v této hře)' : 'Your score (this game)'}</div>
              <div className="text-4xl font-black text-christmas-gold">{myScore}</div>
              <div className="text-xs text-white/50 mt-2">
                {lang === 'cs' ? 'Další otázka hned…' : 'Next question in a moment…'}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Finished
  if (status === 'finished') {
    const scoreMap = new Map(scores.map((s) => [s.uid, Number((s as any).score ?? 0)]));
    const ranked = [...allPlayers]
      .map((p) => ({ ...p, sessionScore: scoreMap.get(p.uid) ?? 0 }))
      .sort((a, b) => b.sessionScore - a.sessionScore);
    const myRank = ranked.findIndex((p) => p.uid === player.uid);
    const isWinner = myRank === 0;

    return (
      <main className="min-h-dvh px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center relative overflow-hidden">
            {/* Celebration background */}
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-christmas-green/15 blur-3xl" />

            <div className="relative">
              {/* Winner celebration */}
              {isWinner ? (
                <>
                  <div className="text-8xl mb-4 animate-bounce-slow">{player.avatar}</div>
                  <div className="text-6xl mb-4 animate-spin-slow">👑</div>
                  <h1 className="game-show-title mb-2 text-5xl">
                    {lang === 'cs' ? '🎉 VÝBORNĚ! 🎉' : '🎉 YOU WON! 🎉'}
                  </h1>
                  <p className="text-white/80 mb-4 text-xl">
                    {lang === 'cs' ? 'Jsi vítěz!' : "You're the winner!"}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🎊</div>
                  <h1 className="game-show-title mb-2">{lang === 'cs' ? 'Hotovo!' : 'Well Played!'}</h1>
                  <p className="text-white/70 mb-4">
                    {lang === 'cs' ? `Skončil jsi na ${myRank + 1}. místě!` : `You finished in ${myRank + 1}${myRank === 0 ? 'st' : myRank === 1 ? 'nd' : myRank === 2 ? 'rd' : 'th'} place!`}
                  </p>
                </>
              )}

              <div className="mb-6">
                <div className="text-4xl font-black text-christmas-gold mb-2">
                  {scoreMap.get(player.uid) ?? 0} {lang === 'cs' ? 'bodů' : 'points'}
                </div>
              </div>

              {/* Top 3 preview */}
              {ranked.length > 0 && (
                <div className="mb-6 p-4 rounded-2xl border border-white/10 bg-white/5">
                  <p className="text-sm text-white/70 mb-3">{lang === 'cs' ? 'Top 3:' : 'Top 3:'}</p>
                  <div className="space-y-2">
                    {ranked.slice(0, 3).map((p, idx) => (
                      <div
                        key={p.uid}
                        className={`flex items-center justify-between p-2 rounded-xl ${
                          p.uid === player.uid ? 'bg-christmas-gold/20 border border-christmas-gold/50' : 'bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                          </span>
                          <span className="text-xl">{p.avatar}</span>
                          <span className="font-semibold">{p.name}</span>
                        </div>
                        <span className="text-xl font-bold text-christmas-gold">{p.sessionScore}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link href={`/room/${roomId}/tv`} className="btn-primary inline-block">
                📺 {lang === 'cs' ? 'Podívat se na TV' : 'Watch on TV'}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="text-white/70">{t('common.loading', lang)}</div>
    </main>
  );
}

function PictionaryDrawerPhone(props: {
  roomId: string;
  sessionId: string;
  roundIndex: number;
  totalRounds: number;
  promptText: string;
  startedAt?: number | null;
  endsAt?: number | null;
}) {
  const { roomId, sessionId, roundIndex, totalRounds, promptText, startedAt, endsAt } = props;
  const { playSound } = useAudio();
  const lang = getLanguage();

  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null);

  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);
  const seqRef = useRef(0);
  const eventsRef = useRef<PictionarySegment[]>([]);
  const pendingRef = useRef<PictionarySegment[]>([]);
  const flushTimer = useRef<any>(null);

  useEffect(() => {
    // Reset on new round
    drawing.current = false;
    lastPt.current = null;
    seqRef.current = 0;
    eventsRef.current = [];
    pendingRef.current = [];
  }, [roundIndex, sessionId]);

  const flush = async () => {
    if (!pendingRef.current.length) return;
    const next = [...eventsRef.current, ...pendingRef.current].slice(-1500);
    pendingRef.current = [];
    eventsRef.current = next;
    seqRef.current += 1;
    await writePictionaryLive({ roomId, sessionId, round: roundIndex, seq: seqRef.current, events: next });
  };

  const scheduleFlush = () => {
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      flushTimer.current = null;
      flush().catch(() => {});
    }, 120);
  };

  const getPos = (e: any) => {
    const canvas = canvasEl;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches?.[0]?.clientX ?? e.clientX;
    const clientY = e.touches?.[0]?.clientY ?? e.clientY;
    const x = (clientX - rect.left) / rect.width;
    const y = (clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)), rect };
  };

  const onDown = (e: any) => {
    e.preventDefault();
    const p = getPos(e);
    if (!p) return;
    drawing.current = true;
    lastPt.current = { x: p.x, y: p.y };
    playSound('click', 0.05);
  };

  const onMove = (e: any) => {
    if (!drawing.current) return;
    e.preventDefault();
    const p = getPos(e);
    if (!p || !lastPt.current) return;
    const seg: PictionarySegment = {
      x0: lastPt.current.x,
      y0: lastPt.current.y,
      x1: p.x,
      y1: p.y,
      w: 3,
      c: '#ffffff',
    };
    pendingRef.current.push(seg);
    lastPt.current = { x: p.x, y: p.y };

    // Local draw for responsiveness
    const ctx = canvasEl?.getContext('2d');
    if (ctx && p.rect) {
      ctx.strokeStyle = seg.c;
      ctx.lineWidth = seg.w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(seg.x0 * p.rect.width, seg.y0 * p.rect.height);
      ctx.lineTo(seg.x1 * p.rect.width, seg.y1 * p.rect.height);
      ctx.stroke();
    }

    scheduleFlush();
  };

  const onUp = () => {
    drawing.current = false;
    lastPt.current = null;
    flush().catch(() => {});
  };

  useEffect(() => {
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;
    const rect = canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvasEl.width = rect.width * dpr;
    canvasEl.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
  }, [canvasEl, roundIndex]);

  return (
    <main className="min-h-dvh px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">🎨 {lang === 'cs' ? 'Kreslíš!' : 'You’re drawing!'}</h1>
              <p className="text-sm text-white/70">
                {lang === 'cs' ? 'Kolo' : 'Round'} {roundIndex + 1}/{Math.max(1, totalRounds)}
              </p>
            </div>
            <TimerRing endsAt={endsAt} startedAt={startedAt} size={46} />
          </div>
        </div>

        <div className="card">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4 text-center">
            <div className="text-xs text-white/60 font-black mb-1">{lang === 'cs' ? 'Tvoje slovo' : 'Your word'}</div>
            <div className="text-3xl font-black text-christmas-gold">{promptText || '—'}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <canvas
              ref={setCanvasEl}
              className="w-full h-80 bg-white/5 touch-none"
              onMouseDown={onDown}
              onMouseMove={onMove}
              onMouseUp={onUp}
              onMouseLeave={onUp}
              onTouchStart={onDown}
              onTouchMove={onMove}
              onTouchEnd={onUp}
            />
          </div>

          <p className="text-xs text-white/50 mt-3 text-center">
            {lang === 'cs' ? 'Kresbu sledují všichni na TV.' : 'Everyone watches the drawing on the TV.'}
          </p>
        </div>
      </div>
    </main>
  );
}

function PictionaryGuesserPhone(props: {
  roomId: string;
  sessionId: string;
  roundIndex: number;
  promptId: string | null;
  totalRounds: number;
  startedAt?: number | null;
  endsAt?: number | null;
  player: Player;
  drawerLabel: string;
}) {
  const { roomId, sessionId, roundIndex, promptId, totalRounds, startedAt, endsAt, player, drawerLabel } = props;
  const lang = getLanguage();
  const { playSound } = useAudio();
  const [guess, setGuess] = useState('');
  const [lastSentAt, setLastSentAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [sentGuesses, setSentGuesses] = useState<Array<{ id: string; text: string; at: number }>>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const { live } = usePictionaryLive(roomId, sessionId);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const canSend = Date.now() - lastSentAt >= 2000;

  const send = async () => {
    const g = guess.trim();
    if (!g) return;
    if (!canSend) return;
    setBusy(true);
    try {
      setLastSentAt(Date.now());
      playSound('click', 0.1);

      // Validate correctness server-side so the phone UI can show Correct/Incorrect without exposing the prompt.
      let correct: boolean | null = null;
      if (promptId) {
        const checkRes = await fetch('/api/pictionary-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promptId, guess: g }),
        });
        if (checkRes.ok) {
          const data = (await checkRes.json()) as { correct?: boolean };
          correct = Boolean(data?.correct);
        }
      }

      await submitPictionaryGuess({ roomId, sessionId, uid: player.uid, name: player.name, round: roundIndex, guess: g });
      setSentGuesses((prev) => {
        const next = [{ id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, text: g, at: Date.now() }, ...prev];
        return next.slice(0, 8);
      });
      if (correct === true) setFeedback(lang === 'cs' ? 'Správně! ✅' : 'Correct! ✅');
      else if (correct === false) setFeedback(lang === 'cs' ? 'Špatně ❌' : 'Incorrect ❌');
      else setFeedback(lang === 'cs' ? 'Odesláno ✅' : 'Sent ✅');
      setGuess('');
    } catch (e: any) {
      setFeedback(lang === 'cs' ? 'Nepodařilo se odeslat' : 'Failed to send');
      toast.error(e?.message || t('common.error', lang));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!feedback) return;
    const id = setTimeout(() => setFeedback(null), 1800);
    return () => clearTimeout(id);
  }, [feedback]);

  // Render the TV drawing on the guessers' phones (same live stream as TV).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.clearRect(0, 0, rect.width, rect.height);

    if (!live) return;
    if (Number(live.round ?? -1) !== Number(roundIndex ?? -1)) return;

    const events = Array.isArray((live as any).events) ? ((live as any).events as any[]) : [];
    for (const seg of events) {
      const x0 = Number(seg.x0 ?? 0) * rect.width;
      const y0 = Number(seg.y0 ?? 0) * rect.height;
      const x1 = Number(seg.x1 ?? 0) * rect.width;
      const y1 = Number(seg.y1 ?? 0) * rect.height;
      ctx.strokeStyle = String(seg.c ?? '#ffffff');
      ctx.lineWidth = Math.max(1, Number(seg.w ?? 3));
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
  }, [live?.seq, live?.events, live?.round, roundIndex]);

  return (
    <main className="min-h-dvh px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{lang === 'cs' ? 'Hádej!' : 'Guess!'}</h1>
              <p className="text-sm text-white/70">
                {lang === 'cs' ? 'Kolo' : 'Round'} {roundIndex + 1}/{Math.max(1, totalRounds)} • {drawerLabel}
              </p>
              <p className="text-xs text-white/50 mt-1">
                {lang === 'cs' ? 'Sleduj kresbu zde a posílej tipy.' : 'Watch the drawing here and send guesses.'}
              </p>
            </div>
            <TimerRing endsAt={endsAt} startedAt={startedAt} size={46} />
          </div>
        </div>

        <div className="card">
          <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
            <canvas ref={canvasRef} className="w-full h-[42vh] max-h-[420px] bg-white/5" />
          </div>
          <p className="text-xs text-white/50 mt-3 text-center">
            {lang === 'cs' ? 'Kresba je živě z telefonu kreslíře.' : 'Drawing is live from the drawer’s phone.'}
          </p>
        </div>

        <div className="card">
          {feedback && (
            <div className="mb-3 text-center text-sm font-semibold text-white/80">
              {feedback}
            </div>
          )}
          <input
            className="input-field"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            placeholder={lang === 'cs' ? 'Napiš tip…' : 'Type a guess…'}
            maxLength={64}
            onKeyDown={(e) => {
              if (e.key === 'Enter') send();
            }}
            disabled={busy}
          />
          <button type="button" className="btn-primary w-full mt-3" onClick={send} disabled={busy || !guess.trim() || !canSend}>
            {busy ? (lang === 'cs' ? 'Posílám…' : 'Sending…') : canSend ? (lang === 'cs' ? 'Odeslat tip' : 'Send guess') : lang === 'cs' ? 'Zpomal…' : 'Slow down…'}
          </button>
          <p className="text-xs text-white/50 mt-3 text-center">
            {lang === 'cs' ? 'Limit: 1 tip / 2 sekundy.' : 'Rate limit: 1 guess / 2 seconds.'}
          </p>

          {sentGuesses.length > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <div className="text-xs font-semibold text-white/60 mb-2">
                {lang === 'cs' ? 'Tvoje poslední tipy' : 'Your recent guesses'}
              </div>
              <div className="flex flex-wrap gap-2">
                {sentGuesses.map((g) => (
                  <span
                    key={g.id}
                    className="max-w-full rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/80 truncate"
                    title={g.text}
                  >
                    {g.text}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-white/45 mt-2">
                {lang === 'cs'
                  ? 'Když někdo uhádne správně, kolo se brzy odhalí na TV.'
                  : 'When someone guesses correctly, the round will reveal on the TV shortly.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function FamilyFeudPhoneRound(props: {
  roomId: string;
  sessionId: string;
  roundIndex: number;
  questionId: string | null;
  player: Player;
  userTeam: 'A' | 'B' | undefined;
  activeTeam: 'A' | 'B';
  sessionStatus: string | undefined;
  totalRounds: number;
}) {
  const { roomId, sessionId, roundIndex, questionId, player, userTeam, activeTeam, sessionStatus, totalRounds } = props;
  const lang = getLanguage();
  const { playSound } = useAudio();
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null);
  const [isHttps, setIsHttps] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
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
  
  const isActiveTeam = userTeam === activeTeam;
  const isStealMode = sessionStatus === 'steal';
  const canAnswer = isActiveTeam && (sessionStatus === 'in_round' || isStealMode);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') {
      setVoiceAvailable(false);
      return;
    }
    
    // Check if we're on HTTPS (required for Web Speech API)
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    setIsHttps(isSecure);
    if (!isSecure) {
      console.warn('Web Speech API requires HTTPS');
      setVoiceAvailable(false);
      return;
    }
    
    // Check for Speech Recognition API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser');
      setVoiceAvailable(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = lang === 'cs' ? 'cs-CZ' : 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        playSound('click', 0.1);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript.trim();
        setAnswer(transcript);
        setIsListening(false);
        playSound('success', 0.15);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          setFeedback(lang === 'cs' ? 'Žádný zvuk' : 'No speech detected');
        } else if (event.error === 'not-allowed') {
          setFeedback(lang === 'cs' ? 'Mikrofon není povolen - zkontroluj nastavení prohlížeče' : 'Microphone not allowed - check browser settings');
          setVoiceAvailable(false);
        } else if (event.error === 'service-not-allowed') {
          setFeedback(lang === 'cs' ? 'Služba rozpoznávání není dostupná' : 'Recognition service not available');
          setVoiceAvailable(false);
        } else {
          setFeedback(lang === 'cs' ? 'Chyba rozpoznávání' : 'Recognition error');
        }
        setTimeout(() => setFeedback(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      setVoiceAvailable(true);
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error);
      setVoiceAvailable(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
        recognitionRef.current = null;
      }
    };
  }, [lang, playSound]);

  const startListening = () => {
    if (!recognitionRef.current || isListening || busy) return;
    
    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      setFeedback(lang === 'cs' ? 'Nelze spustit rozpoznávání' : 'Cannot start recognition');
      setTimeout(() => setFeedback(null), 2000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim() || busy || !canAnswer) return;
    
    // Stop listening if active
    stopListening();
    
    setBusy(true);
    try {
      playSound('click', 0.1);
      let result;
      if (isStealMode) {
        result = await submitFamilyFeudSteal({
          roomId,
          sessionId,
          uid: player.uid,
          roundIndex,
          answer: answer.trim(),
        });
      } else {
        result = await submitFamilyFeudAnswer({
          roomId,
          sessionId,
          uid: player.uid,
          roundIndex,
          answer: answer.trim(),
        });
      }
      
      if (result.correct) {
        playSound('success', 0.2);
        setFeedback(lang === 'cs' ? 'Správně! ✅' : 'Correct! ✅');
        setAnswer('');
      } else {
        playSound('ding', 0.15);
        if (isStealMode && !('stole' in result ? result.stole : false)) {
          setFeedback(lang === 'cs' ? 'Ukradení selhalo ❌' : 'Steal failed ❌');
        } else {
          setFeedback(lang === 'cs' ? 'Špatně ❌' : 'Incorrect ❌');
        }
      }
    } catch (e: any) {
      toast.error(e?.message || t('common.error', lang));
      setFeedback(lang === 'cs' ? 'Chyba' : 'Error');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!feedback) return;
    const id = setTimeout(() => setFeedback(null), 2000);
    return () => clearTimeout(id);
  }, [feedback]);

  if (!question) {
    return (
      <main className="min-h-dvh px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <p className="text-white/70">{lang === 'cs' ? 'Načítání...' : 'Loading...'}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!userTeam) {
    return (
      <main className="min-h-dvh px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <p className="text-white/70 mb-4">
              {lang === 'cs' ? 'Nejsi přiřazen k týmu.' : 'You are not assigned to a team.'}
            </p>
            <p className="text-sm text-white/60">
              {lang === 'cs' ? 'Kontaktuj hostitele.' : 'Contact the host.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">
                {lang === 'cs' ? 'Vánoční rodinný souboj' : 'Christmas Family Feud'}
              </h1>
              <p className="text-white/70 text-sm">
                {lang === 'cs' ? 'Kolo' : 'Round'} {roundIndex + 1}/{totalRounds}
              </p>
              <p className="text-xs text-white/60 mt-1">
                {lang === 'cs' ? `Tvůj tým: ${userTeam}` : `Your team: ${userTeam}`}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-4">
            <h2 className="text-2xl font-black mb-2">{question.question[lang]}</h2>
            {isStealMode ? (
              <div className="rounded-xl border-2 border-christmas-gold bg-christmas-gold/10 p-3 text-center">
                <div className="text-lg font-bold text-christmas-gold mb-1">
                  {lang === 'cs' ? '⚡ Ukradení!' : '⚡ Steal!'}
                </div>
                <div className="text-sm text-white/80">
                  {lang === 'cs' ? 'Máš jednu šanci ukrást všechny body!' : 'You have one chance to steal all the points!'}
                </div>
              </div>
            ) : isActiveTeam ? (
              <div className="rounded-xl border-2 border-christmas-red bg-christmas-red/10 p-3 text-center">
                <div className="text-lg font-bold text-christmas-red mb-1">
                  {lang === 'cs' ? '🎯 Tvá řada!' : '🎯 Your turn!'}
                </div>
                <div className="text-sm text-white/80">
                  {lang === 'cs' ? 'Hádej odpověď na tabuli.' : 'Guess an answer on the board.'}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-white/20 bg-white/5 p-3 text-center">
                <div className="text-sm text-white/70">
                  {lang === 'cs' ? `Čeká se na tým ${activeTeam}...` : `Waiting for team ${activeTeam}...`}
                </div>
              </div>
            )}
          </div>

          {canAnswer && (
            <>
              {feedback && (
                <div className="mb-3 text-center text-sm font-semibold text-white/80">
                  {feedback}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="text"
                  className="input-field flex-1"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={lang === 'cs' ? 'Napiš nebo použij mikrofon na klávesnici...' : 'Type or use keyboard microphone...'}
                  maxLength={64}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmit();
                  }}
                  disabled={busy || isListening}
                  // Enable native voice input on mobile devices
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck="false"
                />
                {voiceAvailable === true && recognitionRef.current && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    disabled={busy}
                    className={`px-4 py-3 rounded-xl border-2 font-bold transition-all ${
                      isListening
                        ? 'bg-red-600 border-red-500 text-white animate-pulse'
                        : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700'
                    } disabled:opacity-50`}
                    title={isListening ? (lang === 'cs' ? 'Zastavit nahrávání' : 'Stop recording') : (lang === 'cs' ? 'Začít nahrávání' : 'Start recording')}
                  >
                    {isListening ? '⏹️' : '🎤'}
                  </button>
                )}
              </div>
              {isListening && (
                <div className="mt-2 text-center text-sm text-blue-400 font-semibold animate-pulse">
                  {lang === 'cs' ? '🎤 Poslouchej...' : '🎤 Listening...'}
                </div>
              )}
              <button
                type="button"
                className="btn-primary w-full mt-3"
                onClick={handleSubmit}
                disabled={busy || !answer.trim() || isListening}
              >
                {busy
                  ? lang === 'cs'
                    ? 'Odesílám...'
                    : 'Sending...'
                  : isStealMode
                  ? lang === 'cs'
                    ? '⚡ Ukrást!'
                    : '⚡ Steal!'
                  : lang === 'cs'
                  ? 'Odeslat odpověď'
                  : 'Submit Answer'}
              </button>
              {voiceAvailable === false && (
                <div className="mt-2 text-center">
                  <p className="text-xs text-white/60 mb-1">
                    {lang === 'cs' 
                      ? '💡 Na mobilu použij mikrofon na klávesnici!' 
                      : '💡 On mobile, use the microphone button on your keyboard!'}
                  </p>
                  <p className="text-xs text-white/40">
                    {!isHttps
                      ? (lang === 'cs' 
                          ? 'Pro tlačítko mikrofonu vyžaduje HTTPS.' 
                          : 'Microphone button requires HTTPS.')
                      : (lang === 'cs' 
                          ? 'Nebo použij Chrome/Edge/Safari pro tlačítko mikrofonu.' 
                          : 'Or use Chrome/Edge/Safari for microphone button.')}
                  </p>
                </div>
              )}
            </>
          )}

          {!canAnswer && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-white/90 font-semibold">
                {lang === 'cs' ? 'Čekáme na tým...' : 'Waiting for team...'}
              </p>
              <p className="text-sm text-white/60 mt-1">
                {lang === 'cs' ? 'Sleduj TV pro aktuální stav.' : 'Watch the TV for current status.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}



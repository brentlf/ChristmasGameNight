'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { MiniGameType, Player, Room } from '@/types';
import { getLanguage, t } from '@/lib/i18n';
import { useSessionSelected } from '@/lib/hooks/useSessionSelected';
import { useSessionAnswers } from '@/lib/hooks/useSessionAnswers';
import { useSessionScores } from '@/lib/hooks/useSessionScores';
import { submitSessionAnswer } from '@/lib/sessions/sessionEngine';
import { getEmojiItemById, getTriviaItemById, getWYRItemById } from '@/lib/miniGameContent';
import TimerRing from '@/app/components/TimerRing';
import GameIntro from '@/app/components/GameIntro';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { generateSeed, shuffleSeeded } from '@/lib/utils/seededRandom';
import { useAudio } from '@/lib/contexts/AudioContext';
import { getPictionaryItemById } from '@/lib/miniGameContent';
import { submitPictionaryGuess, writePictionaryLive, type PictionarySegment } from '@/lib/sessions/pictionaryClient';

function answeredProgress(answered: number, total: number) {
  return `${Math.min(answered, total)}/${Math.max(total, 0)}`;
}

export default function MiniGamesPhoneClient(props: { roomId: string; room: Room; player: Player }) {
  const { roomId, room, player } = props;
  const lang = getLanguage();
  const { playSound } = useAudio();

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

  const content = useMemo(() => {
    if (!gameId || questionIndex === null) return null;
    const id = selectedIds?.[questionIndex];
    if (!id) return null;
    if (gameId === 'trivia') return { type: 'trivia' as const, item: getTriviaItemById(id) };
    if (gameId === 'emoji') return { type: 'emoji' as const, item: getEmojiItemById(id) };
    if (gameId === 'wyr') return { type: 'wyr' as const, item: getWYRItemById(id) };
    if (gameId === 'pictionary') return { type: 'pictionary' as const, item: getPictionaryItemById(id) };
    return null;
  }, [gameId, questionIndex, selectedIds]);

  // Lobby / between sessions
  if (!currentSession || !sessionId || !gameId || status === 'between' || room.status === 'between_sessions') {
    return (
      <main className="min-h-screen px-4 py-10 md:py-16">
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

  // Intro (players can locally dismiss; controller can skip globally)
  if (status === 'intro' && localIntroDismissedSessionId !== sessionId) {
    return (
      <main className="min-h-screen px-4 py-10 md:py-12">
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
  if (status === 'in_game') {
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
          endsAt={currentSession.questionEndsAt}
          startedAt={currentSession.questionStartedAt}
          promptText={(prompt?.prompt?.[lang] ?? '').toString()}
        />
      ) : (
        <PictionaryGuesserPhone
          roomId={roomId}
          sessionId={sessionId}
          roundIndex={questionIndex!}
          endsAt={currentSession.questionEndsAt}
          startedAt={currentSession.questionStartedAt}
          player={player}
          drawerLabel={drawerName}
        />
      );
    }

    return (
      <main className="min-h-screen px-4 py-6 md:py-10">
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
                    {content.item.options[lang].map((opt, idx) => (
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
                    <p className="text-sm text-white/70">{lang === 'cs' ? 'Vyber odpověď:' : 'Pick an answer:'}</p>
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
              </>
            )}
          </div>
        </div>
      </main>
    );
  }

  // Reveal
  if (status === 'reveal') {
    const r = currentSession.revealData ?? {};
    const correctUids: string[] = Array.isArray(r.correctUids) ? r.correctUids : [];
    const isCorrect = correctUids.includes(player.uid);
    const scoreMap = new Map(scores.map((s) => [s.uid, Number((s as any).score ?? 0)]));
    const myScore = scoreMap.get(player.uid) ?? 0;

    return (
      <main className="min-h-screen px-4 py-10">
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
    const myScore = scoreMap.get(player.uid) ?? 0;
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-4">🏁</div>
            <h1 className="game-show-title mb-2">{lang === 'cs' ? 'Hotovo!' : 'Done!'}</h1>
            <p className="text-white/70 mb-6">{lang === 'cs' ? 'Podívej se na TV pro výsledky.' : 'Look at the TV for results.'}</p>
            <div className="text-3xl font-black text-christmas-gold mb-6">{myScore}</div>
            <Link href={`/room/${roomId}/tv`} className="btn-secondary inline-block">
              📺 {t('race.tv', lang) || 'TV'}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-white/70">{t('common.loading', lang)}</div>
    </main>
  );
}

function PictionaryDrawerPhone(props: {
  roomId: string;
  sessionId: string;
  roundIndex: number;
  promptText: string;
  startedAt?: number | null;
  endsAt?: number | null;
}) {
  const { roomId, sessionId, roundIndex, promptText, startedAt, endsAt } = props;
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
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">🎨 {lang === 'cs' ? 'Kreslíš!' : 'You’re drawing!'}</h1>
              <p className="text-sm text-white/70">
                {lang === 'cs' ? 'Kolo' : 'Round'} {roundIndex + 1}/10
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
  startedAt?: number | null;
  endsAt?: number | null;
  player: Player;
  drawerLabel: string;
}) {
  const { roomId, sessionId, roundIndex, startedAt, endsAt, player, drawerLabel } = props;
  const lang = getLanguage();
  const { playSound } = useAudio();
  const [guess, setGuess] = useState('');
  const [lastSentAt, setLastSentAt] = useState(0);
  const [busy, setBusy] = useState(false);

  const canSend = Date.now() - lastSentAt >= 2000;

  const send = async () => {
    const g = guess.trim();
    if (!g) return;
    if (!canSend) return;
    setBusy(true);
    try {
      setLastSentAt(Date.now());
      playSound('click', 0.1);
      await submitPictionaryGuess({ roomId, sessionId, uid: player.uid, name: player.name, round: roundIndex, guess: g });
      setGuess('');
    } catch (e: any) {
      toast.error(e?.message || t('common.error', lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto space-y-4">
        <div className="card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{lang === 'cs' ? 'Hádej!' : 'Guess!'}</h1>
              <p className="text-sm text-white/70">
                {lang === 'cs' ? 'Kolo' : 'Round'} {roundIndex + 1}/10 • {drawerLabel}
              </p>
              <p className="text-xs text-white/50 mt-1">
                {lang === 'cs' ? 'Tipuj z TV. Můžeš posílat více tipů.' : 'Guess from the TV. You can send multiple guesses.'}
              </p>
            </div>
            <TimerRing endsAt={endsAt} startedAt={startedAt} size={46} />
          </div>
        </div>

        <div className="card">
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
        </div>
      </div>
    </main>
  );
}



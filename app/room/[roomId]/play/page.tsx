'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayer } from '@/lib/hooks/usePlayer';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { getLanguage, t } from '@/lib/i18n';
import { joinRoom, startRace } from '@/lib/utils/room';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ensureStageInitialized, getStageByIndex, getTotalStages, submitCodeLock, submitEmojiAnswer, submitRiddleAnswer, submitTriviaAnswer } from '@/lib/raceEngine';
import { getCodePuzzleById, getEmojiClueById, getFinalRiddleById, getPhotoPromptById, getRiddleGateRiddleById, getTriviaQuestionById } from '@/lib/raceContent';
import { completePhotoScavenger } from '@/lib/raceEngine';
import { validatePhotoWithAI } from '@/lib/utils/openai';
import type { Player, Room, RaceStageDefinition } from '@/types';

const AVATARS = ['🎅', '🎄', '🎁', '❄️', '🦌', '⛄', '🎄', '🎁', '🎅', '❄️'];

export default function PlayPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { room, loading: roomLoading, updateRoom } = useRoom(roomId);
  const [playerUid, setPlayerUid] = useState<string | null>(null);
  const { player, loading: playerLoading, updatePlayer } = usePlayer(roomId, playerUid);
  const { players } = usePlayers(roomId);
  const lang = getLanguage();
  
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setPlayerUid(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleJoin = async () => {
    if (!name.trim()) {
      toast.error(t('player.nameRequired', lang));
      return;
    }

    if (room && players.length >= room.maxPlayers) {
      toast.error(t('join.roomFull', lang));
      return;
    }

    setJoining(true);
    try {
      const uid = await joinRoom(roomId, name, selectedAvatar);
      setPlayerUid(uid);
      toast.success(t('player.joined', lang));
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
    } finally {
      setJoining(false);
    }
  };

  if (roomLoading || playerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">{t('common.error', lang)}</div>
      </div>
    );
  }

  if (!player) {
    return (
      <main className="min-h-screen px-4 py-10 md:py-16">
        <div className="mx-auto max-w-lg">
          <div className="card relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

            <div className="relative">
              <div className="mb-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
                  <span>🎮</span>
                  <span>{t('player.setup', lang)}</span>
                </div>
              </div>

              <h1 className="game-show-title mb-2 text-center">{room.name}</h1>
              <p className="text-center text-white/75 mb-8">
                {t('player.setupSubtitle', lang)}
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/80">
                    {t('player.enterName', lang)}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('player.namePlaceholder', lang)}
                    className="input-field"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-white/80">
                    {t('player.selectAvatar', lang)}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATARS.map((avatar, idx) => (
                      <button
                        key={`${avatar}-${idx}`}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`text-4xl p-3 rounded-2xl border transition ${
                          selectedAvatar === avatar
                            ? 'bg-christmas-gold/25 border-christmas-gold/40'
                            : 'bg-white/5 border-white/20 hover:bg-white/10'
                        }`}
                        aria-label={`Select avatar ${avatar}`}
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={handleJoin} disabled={joining} className="btn-primary w-full">
                  {joining ? t('common.loading', lang) : `🎟️ ${t('player.join', lang)}`}
                </button>

                <div className="mt-2 text-center">
                  <Link href={`/room/${roomId}/tv`} className="btn-secondary inline-block text-sm">
                    📺 {t('player.openTv', lang)}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return <RacePlay roomId={roomId} room={room} player={player as Player} lang={lang} />;
}

function RacePlay(props: { roomId: string; room: Room; player: Player; lang: 'en' | 'cs' }) {
  const { roomId, room, player, lang } = props;
  const trackId = room.raceTrackId;
  const totalStages = useMemo(() => getTotalStages(trackId), [trackId]);
  const stageIndex = player.stageIndex ?? 0;
  const stage = useMemo(() => getStageByIndex(trackId, stageIndex), [trackId, stageIndex]);
  const stageState = (player.stageState ?? {}) as Record<string, any>;
  const currentState = stage ? (stageState[(stage as RaceStageDefinition).id] ?? {}) : {};

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!stage) return;
    ensureStageInitialized({ roomId, uid: player.uid, trackId, stageIndex }).catch(() => {});
  }, [roomId, player.uid, trackId, stageIndex, stage]);

  const pct = totalStages > 0 ? Math.min(100, Math.round((stageIndex / totalStages) * 100)) : 0;

  if (stageIndex >= totalStages) {
    return (
      <main className="min-h-screen px-4 py-8 md:py-12">
        <div className="mx-auto max-w-xl">
          <div className="card text-center">
            <div className="text-6xl mb-4">🏁</div>
            <h1 className="game-show-title mb-3">{t('race.finishedTitle', lang)}</h1>
            <p className="text-white/80 mb-6">{t('race.finishedSubtitle', lang)}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/room/${roomId}/tv`} className="btn-secondary text-center">
                📺 {t('race.backToTv', lang)}
              </Link>
              <Link href={`/room/${roomId}/results`} className="btn-primary text-center">
                🏆 {t('race.viewResults', lang)}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (room.status === 'lobby') {
    return (
      <main className="min-h-screen px-4 py-10 md:py-16">
        <div className="mx-auto max-w-xl">
          <div className="card text-center">
            <div className="text-5xl mb-4">{player.avatar}</div>
            <h1 className="text-3xl font-black mb-2">{room.name}</h1>
            <p className="text-white/75 mb-6">{t('race.lobbyPrompt', lang)}</p>
            <button
              className="btn-primary w-full"
              onClick={async () => {
                try {
                  await startRace(roomId);
                } catch {}
              }}
            >
              🚦 {t('race.startMyRace', lang)}
            </button>
            <div className="mt-4 flex justify-center gap-3">
              <Link href={`/room/${roomId}/tv`} className="btn-secondary text-center">
                📺 {t('race.openTv', lang)}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!stage) {
    return (
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-xl">
          <div className="card text-center">
            <p className="text-white/70">{t('common.loading', lang)}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto">
        <div className="card mb-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{room.name}</h1>
              <p className="text-white/70">
                {t('common.score', lang)}: <span className="font-bold text-christmas-gold">{player.score ?? 0}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/room/${roomId}/tv`} className="btn-secondary text-sm">
                📺 {t('race.tv', lang)}
              </Link>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-white/70 mb-2">
              <span>
                {t('race.stage', lang)} {stageIndex + 1}/{totalStages}
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-3 bg-christmas-gold" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-3">
            <h2 className="text-3xl font-black">{stage.title[lang]}</h2>
            <p className="text-white/70 mt-1">{stage.description[lang]}</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-5">
            <p className="text-sm text-white/80 font-semibold mb-1">{t('race.rules', lang)}</p>
            <p className="text-sm text-white/70">{stage.rules[lang]}</p>
          </div>

          <StageBody
            roomId={roomId}
            trackId={trackId}
            stageIndex={stageIndex}
            stage={stage as RaceStageDefinition}
            state={currentState}
            lang={lang}
            now={now}
          />
        </div>
      </div>
    </main>
  );
}

function StageBody(props: {
  roomId: string;
  trackId: Room['raceTrackId'];
  stageIndex: number;
  stage: RaceStageDefinition;
  state: any;
  lang: 'en' | 'cs';
  now: number;
}) {
  const { roomId, trackId, stageIndex, stage, state, lang, now } = props;
  const uid = auth?.currentUser?.uid;
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const lockoutUntil = state.lockoutUntil ?? 0;
  const locked = lockoutUntil && now < lockoutUntil;
  const lockoutSeconds = locked ? Math.ceil((lockoutUntil - now) / 1000) : 0;

  useEffect(() => {
    setText('');
    setSelected(null);
    setShowHint(false);
  }, [stage.id]);

  if (!uid) {
    return <p className="text-white/70">{t('common.loading', lang)}</p>;
  }

  if (stage.type === 'riddle_gate' || stage.type === 'final_riddle') {
    const riddle =
      stage.type === 'riddle_gate'
        ? getRiddleGateRiddleById(state.riddleId ?? '')
        : getFinalRiddleById(state.riddleId ?? '');
    const hint = riddle?.hint?.[lang];

    return (
      <div className="space-y-4">
        <p className="text-2xl font-semibold leading-snug">{riddle?.prompt?.[lang] ?? t('common.loading', lang)}</p>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-field"
          placeholder={t('race.typeAnswer', lang)}
          disabled={busy}
        />

        <button
          className="btn-primary w-full"
          disabled={busy || !text.trim()}
          onClick={async () => {
            setBusy(true);
            try {
              const res = await submitRiddleAnswer({ roomId, uid, trackId, stageIndex, answer: text, lang });
              if (res.correct) toast.success(t('race.correct', lang));
              else toast.error(t('race.incorrect', lang));
            } catch (e: any) {
              toast.error(e?.message || t('common.error', lang));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? t('common.loading', lang) : t('common.submit', lang)}
        </button>

        {hint && (
          <button
            className="btn-secondary w-full"
            onClick={() => setShowHint((v) => !v)}
            type="button"
            disabled={busy}
          >
            {showHint ? t('race.hideHint', lang) : t('race.showHint', lang)}
          </button>
        )}

        {hint && showHint && <div className="text-white/80 text-sm">{hint}</div>}
      </div>
    );
  }

  if (stage.type === 'emoji_guess') {
    const clueIds: string[] = state.clueIds ?? [];
    const answered: Record<string, any> = state.answered ?? {};
    const correctCount = Number(state.correctCount ?? 0);
    const needCorrect = Number(stage.content.needCorrect ?? 3);

    const nextClueId = clueIds.find((id) => !answered[id]) ?? clueIds[0];
    const clue = getEmojiClueById(nextClueId ?? '');
    const options: string[] = clue?.options?.[lang] ?? [];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/70">
            {t('race.emojiProgress', lang)}: <span className="font-bold text-christmas-gold">{correctCount}</span>/{needCorrect}
          </p>
          {locked && (
            <p className="text-sm text-white/70">
              {t('race.locked', lang)} {lockoutSeconds}s
            </p>
          )}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
          <div className="text-6xl mb-2">{clue?.emoji ?? '❓'}</div>
          <div className="text-xs text-white/60 uppercase tracking-widest">{clue?.category ?? ''}</div>
        </div>

        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt}
              className="w-full rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-4 text-left disabled:opacity-50"
              disabled={busy || locked}
              onClick={async () => {
                setBusy(true);
                try {
                  const res = await submitEmojiAnswer({ roomId, uid, trackId, stageIndex, clueId: nextClueId, answerText: opt, lang });
                  if (res.correct) toast.success(t('race.correct', lang));
                  else toast.error(t('race.incorrect', lang));
                } catch (e: any) {
                  toast.error(e?.message || t('common.error', lang));
                } finally {
                  setBusy(false);
                }
              }}
              type="button"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (stage.type === 'trivia_solo') {
    const questionIds: string[] = state.questionIds ?? [];
    const current = Number(state.current ?? 0);
    const questionId = questionIds[current];
    const q = questionId ? getTriviaQuestionById(lang, questionId) : undefined;
    const secondsPerQuestion = Number(stage.content.secondsPerQuestion ?? 20);
    const startedAt = Number(state.questionStartedAt ?? state.startedAt ?? now);
    const elapsedS = Math.floor((now - startedAt) / 1000);
    const remaining = Math.max(0, secondsPerQuestion - elapsedS);

    useEffect(() => {
      if (!questionId) return;
      if (remaining !== 0) return;
      // Timeout auto-submit
      if (busy) return;
      setBusy(true);
      submitTriviaAnswer({ roomId, uid, trackId, stageIndex, questionId, choiceIndex: null, lang })
        .catch(() => {})
        .finally(() => setBusy(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [remaining, questionId]);

    if (!q) {
      return <p className="text-white/70">{t('common.loading', lang)}</p>;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/70">
            {t('race.question', lang)} {Math.min(current + 1, questionIds.length)}/{questionIds.length}
          </p>
          <p className="text-sm">
            ⏱️ <span className={remaining <= 5 ? 'text-christmas-red font-bold' : 'text-white/80'}>{remaining}s</span>
          </p>
        </div>

        <p className="text-2xl font-semibold leading-snug">{q.prompt}</p>

        <div className="space-y-2">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              className={`w-full rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
                selected === idx ? 'bg-christmas-gold/25 border-christmas-gold/40' : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              disabled={busy || remaining === 0}
              onClick={() => setSelected(idx)}
              type="button"
            >
              <span className="text-white/70 mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
            </button>
          ))}
        </div>

        <button
          className="btn-primary w-full"
          disabled={busy || selected === null || remaining === 0}
          onClick={async () => {
            setBusy(true);
            try {
              const res = await submitTriviaAnswer({ roomId, uid, trackId, stageIndex, questionId, choiceIndex: selected, lang });
              toast.success(res.correct ? t('race.correct', lang) : t('race.incorrect', lang));
              setSelected(null);
            } catch (e: any) {
              toast.error(e?.message || t('common.error', lang));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? t('common.loading', lang) : t('common.submit', lang)}
        </button>
      </div>
    );
  }

  if (stage.type === 'code_lock') {
    const puzzle = getCodePuzzleById(state.puzzleId ?? '');
    const hint = puzzle?.hint?.[lang];
    return (
      <div className="space-y-4">
        <pre className="whitespace-pre-wrap rounded-2xl border border-white/10 bg-white/5 p-4 text-white/85 text-sm">
          {puzzle?.prompt?.[lang] ?? t('common.loading', lang)}
        </pre>

        {locked && (
          <p className="text-sm text-white/70">
            {t('race.locked', lang)} {lockoutSeconds}s
          </p>
        )}

        <input
          value={text}
          onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="input-field text-center text-3xl font-black tracking-[0.35em]"
          placeholder="••••"
          maxLength={4}
          disabled={busy || locked}
        />

        <button
          className="btn-primary w-full"
          disabled={busy || locked || text.trim().length !== 4}
          onClick={async () => {
            setBusy(true);
            try {
              const res = await submitCodeLock({ roomId, uid, trackId, stageIndex, code: text, lang });
              if (res.correct) toast.success(t('race.correct', lang));
              else toast.error(t('race.incorrect', lang));
            } catch (e: any) {
              toast.error(e?.message || t('common.error', lang));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? t('common.loading', lang) : t('common.submit', lang)}
        </button>

        {hint && (
          <button className="btn-secondary w-full" onClick={() => setShowHint((v) => !v)} type="button">
            {showHint ? t('race.hideHint', lang) : t('race.showHint', lang)}
          </button>
        )}
        {hint && showHint && <div className="text-white/80 text-sm">{hint}</div>}
      </div>
    );
  }

  if (stage.type === 'photo_scavenger') {
    const prompt = getPhotoPromptById(state.promptId ?? '');
    return (
      <div className="space-y-4">
        <p className="text-xl font-semibold">{prompt?.prompt?.[lang] ?? t('common.loading', lang)}</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <label className="block text-sm font-semibold text-white/80 mb-2">{t('race.photoOptional', lang)}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-white/70"
            disabled={busy}
          />
          <p className="mt-2 text-xs text-white/60">{t('race.photoBonusNote', lang)}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            className="btn-primary w-full"
            disabled={busy || !file}
            onClick={async () => {
              if (!file) return;
              setBusy(true);
              try {
                toast.loading(t('race.validatingPhoto', lang), { id: 'photo-validation' });
                const promptText = prompt?.prompt?.[lang] ?? '';
                const result = await validatePhotoWithAI(file, promptText, lang);
                
                if (result.valid) {
                  toast.success(`${t('race.photoValidated', lang)} (${Math.round(result.confidence * 100)}%)`, { id: 'photo-validation' });
                  await completePhotoScavenger({ roomId, uid, trackId, stageIndex, aiValidated: true, confidence: result.confidence, lang });
                } else {
                  toast.error(`${t('race.photoInvalid', lang)}: ${result.reason || ''}`, { id: 'photo-validation' });
                  // Still allow completion without bonus
                  await completePhotoScavenger({ roomId, uid, trackId, stageIndex, aiValidated: false, confidence: result.confidence, lang });
                }
              } catch (e: any) {
                toast.error(e?.message || t('common.error', lang), { id: 'photo-validation' });
              } finally {
                setBusy(false);
              }
            }}
          >
            📸 {t('race.validatePhoto', lang)}
          </button>

          <button
            className="btn-secondary w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await completePhotoScavenger({ roomId, uid, trackId, stageIndex, aiValidated: false, confidence: 0, lang });
                toast.success(t('race.completed', lang));
              } catch (e: any) {
                toast.error(e?.message || t('common.error', lang));
              } finally {
                setBusy(false);
              }
            }}
            type="button"
          >
            ✅ {t('race.markDoneNoPhoto', lang)}
          </button>
        </div>

        {file && (
          <p className="text-xs text-white/70">
            {t('race.photoSelected', lang)}: {file.name}
          </p>
        )}
      </div>
    );
  }

  return <p className="text-white/70">{t('common.error', lang)}</p>;
}


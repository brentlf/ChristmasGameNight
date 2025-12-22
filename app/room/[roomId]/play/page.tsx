'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayer } from '@/lib/hooks/usePlayer';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { useUserProfile } from '@/lib/hooks/useUserProfile';
import { calculateOverallScoring } from '@/lib/utils/overallScoring';
import { getLanguage, t } from '@/lib/i18n';
import { joinRoom } from '@/lib/utils/room';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ensureStageInitialized, getStageByIndex, getTotalStages, submitCodeLock, submitEmojiAnswer, submitRiddleAnswer, submitTriviaAnswer } from '@/lib/raceEngine';
import { getCodePuzzleById, getEmojiClueById, getFinalRiddleById, getPhotoPromptById, getRiddleGateRiddleById, getTriviaQuestionById } from '@/lib/raceContent';
import type { Riddle, CodePuzzle } from '@/types';
import { completePhotoScavenger } from '@/lib/raceEngine';
import { validatePhotoWithAI } from '@/lib/utils/openai';
import type { Player, Room, RaceStageDefinition, MiniGameType } from '@/types';
import { MiniGameDashboard } from './MiniGameDashboard';
import { useAudio } from '@/lib/contexts/AudioContext';
import MiniGamesPhoneClient from './MiniGamesPhoneClient';
import { ReconnectCode } from '@/app/components/ReconnectCode';
import TimerRing from '@/app/components/TimerRing';

const AVATARS = ['🎅', '🎄', '🎁', '❄️', '🦌', '⛄', '🔔', '🕯️', '🧦', '🎀'];

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { room, loading: roomLoading, updateRoom } = useRoom(roomId);
  const [playerUid, setPlayerUid] = useState<string | null>(null);
  const { player, loading: playerLoading, updatePlayer } = usePlayer(roomId, playerUid);
  const { players } = usePlayers(roomId);
  const { previousNames, loading: profileLoading } = useUserProfile();
  const lang = getLanguage();
  const { playSound, vibrate } = useAudio();
  
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [joining, setJoining] = useState(false);
  const [nameInputMode, setNameInputMode] = useState<'select' | 'manual'>('select');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setPlayerUid(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!room) return;
    if (!room.redirectRoomId) return;
    if (room.redirectRoomId === roomId) return;
    router.replace(`/room/${room.redirectRoomId}/play`);
  }, [room, roomId, router]);

  const handleJoin = async () => {
    if (!name.trim()) {
      toast.error(t('player.nameRequired', lang));
      return;
    }

    if (room && players.length >= room.maxPlayers) {
      toast.error(t('join.roomFull', lang));
      return;
    }

    playSound('ui.lock_in');
    vibrate(10);
    setJoining(true);
    try {
      const uid = await joinRoom(roomId, name, selectedAvatar);
      setPlayerUid(uid);
      playSound('ui.success');
      vibrate([10, 20, 10]);
      toast.success(t('player.joined', lang));
    } catch (error: any) {
      toast.error(error.message || 'Failed to join room');
      playSound('ui.error');
      vibrate([20, 30, 20]);
    } finally {
      setJoining(false);
    }
  };

  if (roomLoading || playerLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-2xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-2xl">{t('common.error', lang)}</div>
      </div>
    );
  }

  if (!player) {
    return (
      <main className="px-3 md:px-4 py-4 md:py-6">
        <div className="mx-auto max-w-lg">
          <div className="card relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

            <div className="relative">
              <div className="mb-4 md:mb-6 text-center">
                <div className="inline-flex items-center gap-1.5 md:gap-2 rounded-full bg-white/10 border border-white/20 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white/80 backdrop-blur-md">
                  <span>🎮</span>
                  <span className="break-words">{t('player.setup', lang)}</span>
                </div>
              </div>

              <h1 className="game-show-title mb-2 text-center break-words">{room.name}</h1>
              <p className="text-center text-white/75 mb-6 md:mb-8 text-sm md:text-base break-words">
                {t('player.setupSubtitle', lang)}
              </p>

              <div className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2 text-white/80 break-words">
                    {t('player.enterName', lang)}
                  </label>
                  
                  {!profileLoading && previousNames.length > 0 && nameInputMode === 'select' ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {previousNames.map((prevName) => (
                          <button
                            key={prevName}
                            type="button"
                            onClick={() => {
                              setName(prevName);
                              setNameInputMode('manual');
                            }}
                            className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg border text-xs md:text-sm transition break-words ${
                              name === prevName
                                ? 'bg-christmas-gold/25 border-christmas-gold/40 text-white'
                                : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                            }`}
                          >
                            {prevName}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNameInputMode('manual');
                          setName('');
                        }}
                        className="text-xs text-white/60 hover:text-white/80 underline"
                      >
                        Or enter a new name
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('player.namePlaceholder', lang)}
                        className="input-field"
                        maxLength={20}
                      />
                      {!profileLoading && previousNames.length > 0 && nameInputMode === 'manual' && (
                        <button
                          type="button"
                          onClick={() => {
                            setNameInputMode('select');
                            setName('');
                          }}
                          className="text-xs text-white/60 hover:text-white/80 underline"
                        >
                          Or pick from previous names
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs md:text-sm font-semibold mb-1.5 md:mb-2 text-white/80 break-words">
                    {t('player.selectAvatar', lang)}
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {AVATARS.map((avatar, idx) => (
                      <button
                        key={`${avatar}-${idx}`}
                        type="button"
                        onClick={() => setSelectedAvatar(avatar)}
                        className={`text-3xl md:text-4xl p-2 md:p-3 rounded-xl md:rounded-2xl border transition ${
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

                <button onClick={handleJoin} disabled={joining} className="btn-primary w-full text-sm md:text-base break-words">
                  {joining ? t('common.loading', lang) : `🎟️ ${t('player.join', lang)}`}
                </button>

                <div className="mt-2 text-center">
                  <Link href={`/room/${roomId}/tv`} className="btn-secondary inline-block text-xs md:text-sm break-words">
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

  // Render based on room mode (default to amazing_race for backward compatibility)
  const roomMode = room.roomMode || 'amazing_race';
  
  if (roomMode === 'amazing_race') {
    return <RacePlay roomId={roomId} room={room} player={player as Player} lang={lang} />;
  }

  if (roomMode === 'mini_games') {
    return <MiniGamesPhoneClient roomId={roomId} room={room} player={player as Player} />;
  }

  if (roomMode === 'leaderboard') {
    return (
      <main className="px-3 md:px-4 py-4 md:py-6">
        <div className="mx-auto max-w-4xl">
          <div className="card">
            <h1 className="game-show-title mb-3 md:mb-4 text-center break-words">🏆 Leaderboard</h1>
            <p className="text-center text-white/70 mb-4 md:mb-6 text-sm md:text-base break-words">
              This room is configured for leaderboard view. Open the TV view to see standings.
            </p>
            <div className="text-center">
              <Link href={`/room/${roomId}/tv`} className="btn-primary inline-block text-sm md:text-base break-words">
                📺 Open TV View
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
      <main className="px-3 md:px-4 py-4 md:py-6">
        <div className="mx-auto max-w-xl">
          <div className="card text-center">
            <p className="text-white/70 text-sm md:text-base break-words">Unknown room mode</p>
          </div>
        </div>
      </main>
  );
}

function RacePlay(props: { roomId: string; room: Room; player: Player; lang: 'en' | 'cs' }) {
  const { roomId, room, player, lang } = props;
  const trackId = room.raceTrackId;
  const { players: allPlayers } = usePlayers(roomId);
  
  // Safety check for trackId
  if (!trackId) {
    return (
      <main className="px-3 md:px-4 py-4 md:py-6">
        <div className="mx-auto max-w-xl">
          <div className="card text-center">
            <p className="text-white/70 text-sm md:text-base break-words">{t('common.error', lang)}: Missing race track</p>
          </div>
        </div>
      </main>
    );
  }
  
  const totalStages = useMemo(() => {
    try {
      return getTotalStages(trackId);
    } catch (e) {
      console.error('Error getting total stages:', e);
      return 0;
    }
  }, [trackId]);
  
  const stageIndex = player.stageIndex ?? 0;
  const stage = useMemo(() => {
    try {
      return getStageByIndex(trackId, stageIndex);
    } catch (e) {
      console.error('Error getting stage:', e);
      return null;
    }
  }, [trackId, stageIndex]);
  
  const stageState = (player.stageState ?? {}) as Record<string, any>;
  const currentState = stage ? (stageState[(stage as RaceStageDefinition).id] ?? {}) : {};

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // Initialize stage even if it's null (will create the stage state)
    if (room.status === 'running' && trackId) {
      ensureStageInitialized({ roomId, uid: player.uid, trackId, stageIndex, room }).catch((err) => {
        console.error('Error initializing stage:', err);
      });
    }
  }, [roomId, player.uid, trackId, stageIndex, room.status]);

  const pct = totalStages > 0 ? Math.min(100, Math.round((stageIndex / totalStages) * 100)) : 0;

  const overallScoring = useMemo(() => {
    if (!room || !allPlayers.length) return null;
    return calculateOverallScoring(allPlayers, room);
  }, [allPlayers, room]);

  const finishedRanked = useMemo(() => {
    if (!allPlayers.length) return [];
    if (overallScoring && overallScoring.length > 0) {
      return overallScoring
        .map((result) => {
          const p = allPlayers.find((pl: any) => pl.uid === result.playerUid);
          if (!p) return null;
          return { ...(p as any), overallPoints: result.overallPoints };
        })
        .filter(Boolean) as Array<any>;
    }
    return [...allPlayers].sort((a: any, b: any) => {
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
  }, [allPlayers, overallScoring]);

  if (stageIndex >= totalStages) {
    const myRank = finishedRanked.findIndex((p: any) => p?.uid === player.uid);
    const isWinner = myRank === 0;

    return (
      <main className="px-3 md:px-4 py-4 md:py-6">
        <div className="max-w-xl mx-auto">
          <div className="card text-center relative overflow-hidden">
            {/* Celebration background */}
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-24 -bottom-24 h-72 w-72 rounded-full bg-christmas-green/15 blur-3xl" />

            <div className="relative">
              {/* Winner celebration */}
              {isWinner ? (
                <>
                  <div className="text-6xl md:text-8xl mb-3 md:mb-4 animate-bounce-slow">{player.avatar}</div>
                  <div className="text-5xl md:text-6xl mb-3 md:mb-4 animate-spin-slow">👑</div>
                  <h1 className="game-show-title mb-2 text-3xl md:text-4xl lg:text-5xl break-words">
                    {lang === 'cs' ? '🎉 VÝBORNĚ! 🎉' : '🎉 YOU WON! 🎉'}
                  </h1>
                  <p className="text-white/80 mb-3 md:mb-4 text-base md:text-lg lg:text-xl break-words">
                    {lang === 'cs' ? 'Jsi vítěz Amazing Race!' : "You're the Amazing Race winner!"}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-5xl md:text-6xl mb-3 md:mb-4">🏁</div>
                  <h1 className="game-show-title mb-2 text-2xl md:text-3xl lg:text-4xl break-words">{lang === 'cs' ? 'Hotovo!' : 'Race Complete!'}</h1>
                  <p className="text-white/70 mb-3 md:mb-4 text-sm md:text-base break-words">
                    {lang === 'cs' 
                      ? `Dokončil jsi Amazing Race na ${myRank + 1}. místě!` 
                      : `You finished Amazing Race in ${myRank + 1}${myRank === 0 ? 'st' : myRank === 1 ? 'nd' : myRank === 2 ? 'rd' : 'th'} place!`}
                  </p>
                </>
              )}

              {/* Top 3 preview */}
              {finishedRanked.length > 0 && (
                <div className="mb-4 md:mb-6 p-3 md:p-4 rounded-xl md:rounded-2xl border border-white/10 bg-white/5">
                  <p className="text-xs md:text-sm text-white/70 mb-2 md:mb-3 break-words">{lang === 'cs' ? 'Top 3:' : 'Top 3:'}</p>
                  <div className="space-y-1.5 md:space-y-2">
                    {finishedRanked.slice(0, 3).map((p: any, idx: number) => {
                      const score = overallScoring && overallScoring.length > 0 
                        ? p.overallPoints ?? 0
                        : p.score ?? 0;
                      return (
                        <div
                          key={p?.uid}
                          className={`flex items-center justify-between p-2 rounded-lg md:rounded-xl gap-2 ${
                            p?.uid === player.uid ? 'bg-christmas-gold/20 border border-christmas-gold/50' : 'bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 md:gap-2 min-w-0 flex-1">
                            <span className="text-base md:text-lg shrink-0">
                              {idx === 0 ? '👑' : idx === 1 ? '🥈' : '🥉'}
                            </span>
                            <span className="text-lg md:text-xl shrink-0">{p?.avatar}</span>
                            <span className="font-semibold text-sm md:text-base truncate break-words">{p?.name}</span>
                          </div>
                          <span className="text-lg md:text-xl font-bold text-christmas-gold shrink-0">{score}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
                <Link href={`/room/${roomId}/tv`} className="btn-secondary text-center text-sm md:text-base break-words">
                  📺 {t('race.backToTv', lang)}
                </Link>
                <Link href={`/room/${roomId}/results`} className="btn-primary text-center text-sm md:text-base break-words">
                  🏆 {t('race.viewResults', lang)}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (room.status === 'lobby') {
    return (
      <main className="px-4 py-10 md:py-16">
        <div className="mx-auto max-w-2xl">
          <div className="card text-center relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />
            <div className="relative">
              <div className="text-4xl md:text-5xl mb-3 md:mb-4">{player.avatar}</div>
              <h1 className="game-show-title mb-3 md:mb-4 break-words">{room.name}</h1>
              <p className="text-white/75 mb-4 md:mb-6 text-sm md:text-base break-words">
                {t('race.waitingForStart', lang) || 'Waiting for the host to start the race...'}
              </p>
              <div className="mb-4 md:mb-6">
                <ReconnectCode player={player} roomId={roomId} />
              </div>
              <p className="text-xs md:text-sm text-white/60 mb-4 md:mb-6 break-words">
                {t('race.waitingDesc', lang) || 'The race will begin once the host starts it from the TV view.'}
              </p>
              <Link href={`/room/${roomId}/tv`} className="btn-secondary inline-block text-sm md:text-base break-words">
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
      <main className="px-3 md:px-4 py-4 md:py-6">
        <div className="mx-auto max-w-xl">
          <div className="card text-center">
            <p className="text-white/70 mb-3 md:mb-4 text-sm md:text-base break-words">{t('common.loading', lang)}</p>
            <p className="text-xs md:text-sm text-white/50 break-words">
              {trackId ? `Track: ${trackId}, Stage: ${stageIndex + 1}` : 'Initializing stage...'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-3 md:px-4 py-4 md:py-6">
      <div className="max-w-xl mx-auto">
        <div className="card mb-3 md:mb-4">
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg md:text-xl font-bold break-words truncate">{room.name}</h1>
              <p className="text-white/70 text-xs md:text-sm break-words">
                {t('common.score', lang)}: <span className="font-bold text-christmas-gold">{player.score ?? 0}</span>
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/room/${roomId}/tv`} className="btn-secondary text-xs md:text-sm break-words">
                📺 {t('race.tv', lang)}
              </Link>
            </div>
          </div>

          <div className="mt-3 md:mt-4">
            <div className="flex items-center justify-between text-xs md:text-sm text-white/70 mb-1.5 md:mb-2">
              <span className="break-words">
                {t('race.stage', lang)} {stageIndex + 1}/{totalStages}
              </span>
              <span className="shrink-0">{pct}%</span>
            </div>
            <div className="h-2.5 md:h-3 w-full bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-christmas-gold" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="mb-2 md:mb-3">
            <h2 className="text-2xl md:text-3xl font-black break-words">{stage.title[lang]}</h2>
            <p className="text-white/70 mt-1 text-sm md:text-base break-words">{stage.description[lang]}</p>
          </div>

          <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4 mb-4 md:mb-5">
            <p className="text-xs md:text-sm text-white/80 font-semibold mb-1 break-words">{t('race.rules', lang)}</p>
            <p className="text-xs md:text-sm text-white/70 break-words">{stage.rules[lang]}</p>
          </div>

          <StageBody
            roomId={roomId}
            trackId={trackId}
            stageIndex={stageIndex}
            stage={stage as RaceStageDefinition}
            state={currentState}
            lang={lang}
            now={now}
            room={room}
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
  room: Room;
}) {
  const { roomId, trackId, stageIndex, stage, state, lang, now, room } = props;
  const uid = auth?.currentUser?.uid;
  const { playSound } = useAudio();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);

  // Ensure state and stage exist to prevent errors
  const safeState = state ?? {};
  const safeStage = stage ?? { type: '', id: '', content: {} };

  const lockoutUntil = safeState.lockoutUntil ?? 0;
  const locked = lockoutUntil && now < lockoutUntil;
  const lockoutSeconds = locked ? Math.ceil((lockoutUntil - now) / 1000) : 0;

  useEffect(() => {
    setText('');
    setSelected(null);
    setShowHint(false);
  }, [safeStage.id]);

  // Handle trivia_solo auto-submit timeout (must be at top level for hooks rules)
  const isTriviaSolo = safeStage.type === 'trivia_solo';
  const questionIds: string[] = isTriviaSolo ? (safeState.questionIds ?? []) : [];
  const current = isTriviaSolo ? Number(safeState.current ?? 0) : 0;
  const questionId = isTriviaSolo ? questionIds[current] : undefined;
  const secondsPerQuestion = isTriviaSolo ? Number(safeStage.content?.secondsPerQuestion ?? 20) : 0;
  const startedAt = isTriviaSolo ? Number(safeState.questionStartedAt ?? safeState.startedAt ?? now) : 0;
  const elapsedS = isTriviaSolo ? Math.floor((now - startedAt) / 1000) : 0;
  const remaining = isTriviaSolo ? Math.max(0, secondsPerQuestion - elapsedS) : 0;
  const endsAt = isTriviaSolo ? startedAt + secondsPerQuestion * 1000 : 0;

  useEffect(() => {
    if (!isTriviaSolo || !questionId) return;
    if (remaining !== 0) return;
    // Timeout auto-submit
    if (busy) return;
    setBusy(true);
    submitTriviaAnswer({ roomId, uid: uid!, trackId, stageIndex, questionId, choiceIndex: null, lang })
      .catch(() => {})
      .finally(() => setBusy(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, questionId, isTriviaSolo]);

  if (!uid) {
    return <p className="text-white/70">{t('common.loading', lang)}</p>;
  }

  if (safeStage.type === 'riddle_gate' || safeStage.type === 'final_riddle') {
    // Get room from props (passed down from parent component)
    const room = (props as any).room as Room | undefined;
    const needCorrect = safeStage.content?.needCorrect ?? 1;
    
    // Handle multiple riddles
    let riddle: Riddle | undefined;
    let currentIndex = 0;
    let totalRiddles = 1;
    let solvedCount = 0;
    
    if (needCorrect > 1 && safeStage.type === 'riddle_gate') {
      const riddleIds = safeState.riddleIds as string[] | undefined;
      const solvedRiddles = (safeState.solvedRiddles ?? []) as string[];
      currentIndex = safeState.currentRiddleIndex ?? 0;
      totalRiddles = needCorrect;
      solvedCount = solvedRiddles.length;
      
      if (riddleIds && currentIndex < riddleIds.length) {
        const currentRiddleId = riddleIds[currentIndex];
        // Try AI first, then static
        if (room && room.raceAiEnhanced && room.raceStageQuestions?.[safeStage.id]?.riddles) {
          riddle = room.raceStageQuestions[safeStage.id].riddles?.find((r: any) => r.id === currentRiddleId) as Riddle | undefined;
        }
        if (!riddle) {
          riddle = getRiddleGateRiddleById(currentRiddleId, room, safeStage.id);
        }
      }
    } else {
      // Single riddle (original logic)
      riddle =
        safeStage.type === 'riddle_gate'
          ? getRiddleGateRiddleById(safeState.riddleId ?? '', room, safeStage.id)
          : getFinalRiddleById(safeState.riddleId ?? '', room, safeStage.id);
    }
    
    const hint = riddle?.hint?.[lang];
    const additionalClue = riddle?.additionalClue?.[lang];
    const secondHint = riddle?.secondHint?.[lang];
    const attempts = Number(state.attempts ?? 0);
    const showAdditionalClue = attempts >= 3 && additionalClue;
    const showSecondHint = attempts >= 6 && secondHint;

    return (
      <div className="space-y-3 md:space-y-4">
        {needCorrect > 1 && safeStage.type === 'riddle_gate' && (
          <div className="text-center mb-2">
            <p className="text-sm md:text-base text-white/70 break-words">
              {lang === 'cs' ? `Hádanka ${currentIndex + 1} z ${totalRiddles}` : `Riddle ${currentIndex + 1} of ${totalRiddles}`}
              {solvedCount > 0 && (
                <span className="ml-2 text-christmas-gold">
                  ({lang === 'cs' ? `${solvedCount} vyřešeno` : `${solvedCount} solved`})
                </span>
              )}
            </p>
          </div>
        )}
        <p className="text-lg md:text-xl lg:text-2xl font-semibold leading-snug break-words">{riddle?.prompt?.[lang] ?? t('common.loading', lang)}</p>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="input-field"
          placeholder={t('race.typeAnswer', lang)}
          disabled={busy}
        />

        <button
          className="btn-primary w-full text-sm md:text-base break-words"
          disabled={busy || !text.trim()}
          onClick={async () => {
            playSound('click');
            setBusy(true);
            try {
              const res = await submitRiddleAnswer({ roomId, uid, trackId, stageIndex, answer: text, lang });
              if (res.correct) {
                playSound('success');
                setText(''); // Clear input for next riddle
                const needCorrect = safeStage.content?.needCorrect ?? 1;
                if (needCorrect > 1 && !res.finished) {
                  toast.success(lang === 'cs' ? 'Správně! Další hádanka...' : 'Correct! Next riddle...');
                } else {
                  toast.success(t('race.correct', lang));
                }
              } else {
                playSound('ding', 0.15);
                toast.error(t('race.incorrect', lang));
              }
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
            className="btn-secondary w-full text-sm md:text-base break-words"
            onClick={() => setShowHint((v) => !v)}
            type="button"
            disabled={busy}
          >
            {showHint ? t('race.hideHint', lang) : t('race.showHint', lang)}
          </button>
        )}

        {hint && showHint && <div className="text-white/80 text-xs md:text-sm break-words">{hint}</div>}

        {showAdditionalClue && (
          <div className="rounded-xl md:rounded-2xl border border-christmas-gold/30 bg-christmas-gold/10 p-3 md:p-4">
            <p className="text-xs text-christmas-gold/80 uppercase tracking-widest mb-1 break-words">
              {t('race.additionalClue', lang) || 'Additional Clue'}
            </p>
            <div className="text-white/90 text-xs md:text-sm break-words">{additionalClue}</div>
          </div>
        )}

        {showSecondHint && (
          <div className="rounded-xl md:rounded-2xl border border-christmas-gold/40 bg-christmas-gold/15 p-3 md:p-4">
            <p className="text-xs text-christmas-gold/90 uppercase tracking-widest mb-1 break-words">
              {t('race.secondHint', lang) || 'Extra Hint'}
            </p>
            <div className="text-white/90 text-xs md:text-sm break-words">{secondHint}</div>
          </div>
        )}
      </div>
    );
  }

  if (safeStage.type === 'emoji_guess') {
    const clueIds: string[] = safeState.clueIds ?? [];
    const answered: Record<string, any> = safeState.answered ?? {};
    const correctCount = Number(safeState.correctCount ?? 0);
    const needCorrect = Number(safeStage.content?.needCorrect ?? 3);

    const nextClueId = clueIds.find((id) => !answered[id]) ?? clueIds[0];
    const clue = getEmojiClueById(nextClueId ?? '', room, safeStage.id);
    const options: string[] = clue?.options?.[lang] ?? [];

    return (
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs md:text-sm text-white/70 break-words">
            {t('race.emojiProgress', lang)}: <span className="font-bold text-christmas-gold">{correctCount}</span>/{needCorrect}
          </p>
          {locked && (
            <p className="text-xs md:text-sm text-white/70 shrink-0 break-words">
              {t('race.locked', lang)} {lockoutSeconds}s
            </p>
          )}
        </div>

        <div className="rounded-2xl md:rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6 text-center">
          <div className="text-5xl md:text-6xl mb-2">{clue?.emoji ?? '❓'}</div>
          <div className="text-xs text-white/60 uppercase tracking-widest break-words">{clue?.category ?? ''}</div>
        </div>

        <div className="space-y-2">
          {options.map((opt) => (
            <button
              key={opt}
              className="w-full rounded-xl md:rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition p-3 md:p-4 text-left disabled:opacity-50 text-xs md:text-sm break-words"
              disabled={busy || locked}
              onClick={async () => {
                playSound('click');
                setBusy(true);
                try {
                  const res = await submitEmojiAnswer({ roomId, uid, trackId, stageIndex, clueId: nextClueId, answerText: opt, lang });
                  if (res.correct) {
                    playSound('success');
                    toast.success(t('race.correct', lang));
                  } else {
                    playSound('ding', 0.15);
                    toast.error(t('race.incorrect', lang));
                  }
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

  if (safeStage.type === 'trivia_solo') {
    const q = questionId ? getTriviaQuestionById(lang, questionId, room, safeStage.id) : undefined;

    if (!q) {
      return <p className="text-white/70">{t('common.loading', lang)}</p>;
    }

    return (
      <div className="space-y-3 md:space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs md:text-sm text-white/70 break-words">
            {t('race.question', lang)} {Math.min(current + 1, questionIds.length)}/{questionIds.length}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <TimerRing endsAt={endsAt} startedAt={startedAt} size={42} showSeconds={false} />
            <p className="text-xs md:text-sm shrink-0">
              ⏱️ <span className={remaining <= 5 ? 'text-christmas-red font-bold' : 'text-white/80'}>{remaining}s</span>
            </p>
          </div>
        </div>

        <p className="text-lg md:text-xl lg:text-2xl font-semibold leading-snug break-words">{q.prompt}</p>

        <div className="space-y-2">
          {q.options.map((opt, idx) => (
            <button
              key={idx}
              className={`w-full rounded-xl md:rounded-2xl border p-3 md:p-4 text-left transition disabled:opacity-50 text-xs md:text-sm break-words ${
                selected === idx ? 'bg-christmas-gold/25 border-christmas-gold/40' : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              disabled={busy || remaining === 0}
              onClick={() => setSelected(idx)}
              type="button"
            >
              <span className="text-white/70 mr-2 shrink-0">{String.fromCharCode(65 + idx)}.</span> <span className="break-words">{opt}</span>
            </button>
          ))}
        </div>

        <button
          className="btn-primary w-full text-sm md:text-base break-words"
          disabled={busy || selected === null || remaining === 0 || !questionId}
          onClick={async () => {
            if (!questionId) return;
            playSound('click');
            setBusy(true);
            try {
              const res = await submitTriviaAnswer({ roomId, uid, trackId, stageIndex, questionId, choiceIndex: selected, lang });
              if (res.correct) {
                playSound('success');
              } else {
                playSound('ding', 0.15);
              }
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

  if (safeStage.type === 'code_lock') {
    const needCorrect = safeStage.content?.needCorrect ?? 1;
    
    // Handle multiple codes
    let puzzle: CodePuzzle | undefined;
    let currentIndex = 0;
    let totalCodes = 1;
    let solvedCount = 0;
    
    if (needCorrect > 1) {
      const puzzleIds = safeState.puzzleIds as string[] | undefined;
      const solvedCodes = (safeState.solvedCodes ?? []) as string[];
      currentIndex = safeState.currentPuzzleIndex ?? 0;
      totalCodes = needCorrect;
      solvedCount = solvedCodes.length;
      
      if (puzzleIds && currentIndex < puzzleIds.length) {
        const currentPuzzleId = puzzleIds[currentIndex];
        puzzle = getCodePuzzleById(currentPuzzleId);
      }
    } else {
      // Single code (original logic)
      puzzle = getCodePuzzleById(safeState.puzzleId ?? '');
    }
    
    const hint = puzzle?.hint?.[lang];
    return (
      <div className="space-y-3 md:space-y-4">
        {needCorrect > 1 && (
          <div className="text-center mb-2">
            <p className="text-sm md:text-base text-white/70 break-words">
              {lang === 'cs' ? `Kód ${currentIndex + 1} z ${totalCodes}` : `Code ${currentIndex + 1} of ${totalCodes}`}
              {solvedCount > 0 && (
                <span className="ml-2 text-christmas-gold">
                  ({lang === 'cs' ? `${solvedCount} vyřešeno` : `${solvedCount} solved`})
                </span>
              )}
            </p>
          </div>
        )}
        <pre className="whitespace-pre-wrap rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4 text-white/85 text-xs md:text-sm break-words">
          {puzzle?.prompt?.[lang] ?? t('common.loading', lang)}
        </pre>

        {locked && (
          <p className="text-xs md:text-sm text-white/70 break-words">
            {t('race.locked', lang)} {lockoutSeconds}s
          </p>
        )}

        <input
          value={text}
          onChange={(e) => setText(e.target.value.replace(/\D/g, '').slice(0, 4))}
          className="input-field text-center text-2xl md:text-3xl font-black tracking-[0.35em]"
          placeholder="••••"
          maxLength={4}
          disabled={busy || locked}
        />

        <button
          className="btn-primary w-full text-sm md:text-base break-words"
          disabled={busy || locked || text.trim().length !== 4}
          onClick={async () => {
            playSound('click');
            setBusy(true);
            try {
              const res = await submitCodeLock({ roomId, uid, trackId, stageIndex, code: text, lang });
              if (res.correct) {
                playSound('success');
                setText(''); // Clear input for next code
                const needCorrect = safeStage.content?.needCorrect ?? 1;
                if (needCorrect > 1) {
                  toast.success(lang === 'cs' ? 'Správně! Další kód...' : 'Correct! Next code...');
                } else {
                  toast.success(t('race.correct', lang));
                }
              } else {
                playSound('ding', 0.15);
                toast.error(t('race.incorrect', lang));
              }
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
          <button className="btn-secondary w-full text-sm md:text-base break-words" onClick={() => setShowHint((v) => !v)} type="button">
            {showHint ? t('race.hideHint', lang) : t('race.showHint', lang)}
          </button>
        )}
        {hint && showHint && <div className="text-white/80 text-xs md:text-sm break-words">{hint}</div>}
      </div>
    );
  }

  if (safeStage.type === 'photo_scavenger') {
    const prompt = getPhotoPromptById(safeState.promptId ?? '');
    return (
      <div className="space-y-3 md:space-y-4">
        <p className="text-lg md:text-xl font-semibold break-words">{prompt?.prompt?.[lang] ?? t('common.loading', lang)}</p>

        <div className="rounded-xl md:rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4">
          <label className="block text-xs md:text-sm font-semibold text-white/80 mb-1.5 md:mb-2 break-words">{t('race.photoOptional', lang)}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-xs md:text-sm text-white/70"
            disabled={busy}
          />
          <p className="mt-1.5 md:mt-2 text-xs text-white/60 break-words">{t('race.photoBonusNote', lang)}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
          <button
            className="btn-primary w-full text-sm md:text-base break-words"
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
            className="btn-secondary w-full text-sm md:text-base break-words"
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
          <p className="text-xs text-white/70 break-words truncate">
            {t('race.photoSelected', lang)}: {file.name}
          </p>
        )}
      </div>
    );
  }

  return <p className="text-white/70">{t('common.error', lang)}</p>;
}

// MiniGameRouter removed: mini-games are now TV-led sessions that auto-route on this /play page.

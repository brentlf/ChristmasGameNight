'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLanguage, t } from '@/lib/i18n';
import { createRoom } from '@/lib/utils/room';
import toast from 'react-hot-toast';
import type { RoomMode, MiniGameType } from '@/types';
import Link from 'next/link';
import { useAudio } from '@/lib/contexts/AudioContext';

// This page depends on URL search params (`mode`), so it can't be statically prerendered.
export const dynamic = 'force-dynamic';

export default function CreatePage() {
  // `useSearchParams()` requires a suspense boundary at the page level.
  return (
    <Suspense fallback={null}>
      <CreatePageInner />
    </Suspense>
  );
}

function CreatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const lang = getLanguage();
  const { playSound, vibrate } = useAudio();
  const modeParam = searchParams.get('mode') as RoomMode | null;
  const [roomMode, setRoomMode] = useState<RoomMode>(modeParam || 'amazing_race');
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [allowSkips, setAllowSkips] = useState(false);
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [overallScoringEnabled, setOverallScoringEnabled] = useState(true);
  const [overallScoringMode, setOverallScoringMode] = useState<'placements' | 'sumMiniGameScores' | 'hybrid'>('hybrid');
  // Host Session rooms allow starting any game from the TV hub, so we don't ask for per-room game selection.
  const allMiniGames: MiniGameType[] = ['trivia', 'emoji', 'wyr', 'pictionary'];
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (modeParam && ['amazing_race', 'mini_games', 'leaderboard'].includes(modeParam)) {
      setRoomMode(modeParam);
    } else if (!modeParam) {
      // If no mode specified, redirect to game night selection
      router.push('/game-night');
    }
  }, [modeParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomName.trim()) {
      toast.error(t('create.roomNameRequired', lang));
      return;
    }
    
    if (pinEnabled && (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin))) {
      toast.error(t('create.pinInvalid', lang));
      return;
    }

    playSound('ui.click');
    setLoading(true);
    try {
      const roomId = await createRoom({
        roomMode,
        name: roomName,
        maxPlayers,
        pinEnabled,
        pin: pinEnabled ? pin : undefined,
        settings: { difficulty, allowSkips },
        eventsEnabled,
        overallScoringEnabled,
        overallScoringMode,
        miniGamesEnabled: roomMode === 'mini_games' ? allMiniGames : undefined,
      });
      
      playSound('ui.success');
      router.push(`/room/${roomId}/tv`);
    } catch (error: any) {
      // Make Firestore permission issues actionable in dev.
      console.error('[CreatePage] failed to create room', {
        code: error?.code,
        message: error?.message,
        name: error?.name,
      });
      toast.error(error.message || t('common.failedToCreateRoom', lang));
      playSound('ui.error');
    } finally {
      setLoading(false);
    }
  };

  const getModeDisplayName = (mode: RoomMode): string => {
    switch (mode) {
      case 'amazing_race':
        return t('create.amazingRaceMode', lang);
      case 'mini_games':
        return t('create.hostSessionMode', lang);
      case 'leaderboard':
        return t('create.leaderboardMode', lang);
      default:
        return t('create.unknownMode', lang);
    }
  };

  const getDefaultRoomName = (mode: RoomMode): string => {
    switch (mode) {
      case 'amazing_race':
        return t('game.amazingRace', lang);
      case 'mini_games':
        return t('create.gameNightDefault', lang);
      case 'leaderboard':
        return t('common.leaderboard', lang);
      default:
        return t('create.gameRoomDefault', lang);
    }
  };

  // Set default room name when mode changes (only if field is empty)
  useEffect(() => {
    if (roomMode && !roomName.trim()) {
      setRoomName(getDefaultRoomName(roomMode));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomMode]);

  if (!modeParam) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="min-h-dvh px-4 py-4 md:py-5 flex flex-col">
      <div className="mx-auto max-w-3xl w-full flex-1 min-h-0 flex flex-col">
        <div className="mb-4 md:mb-6 flex items-center justify-between shrink-0">
          <Link href="/game-night" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md hover:bg-white/20 transition">
            <span>←</span>
            <span>{t('common.back', lang)}</span>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
            <span>🎬</span>
            <span>{getModeDisplayName(roomMode)}</span>
          </div>
        </div>

        <div className="card relative overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

          <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
            <div className="mb-3 md:mb-4 shrink-0">
              <h1 className="game-show-title mb-1 text-center text-2xl md:text-3xl">{t('create.title', lang)}</h1>
              <p className="text-center text-white/75 text-xs md:text-sm">
                Create a room for {getModeDisplayName(roomMode)}
              </p>
            </div>
          
            <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 flex-1 min-h-0">
            <div>
              <label className="block text-base md:text-lg font-semibold mb-1.5">
                {t('create.roomName', lang)}
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder={t('create.roomNamePlaceholder', lang)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-base md:text-lg font-semibold mb-1.5">
                {t('create.maxPlayers', lang)}: {maxPlayers}
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <input
                  type="range"
                  min="2"
                  max="10"
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="w-full"
                />
                <div className="mt-2 flex justify-between text-xs text-white/60">
                  <span>2</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinEnabled}
                  onChange={(e) => setPinEnabled(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-lg font-semibold">{t('create.pinEnabled', lang)}</span>
              </label>
              {pinEnabled && (
                <input
                  type="text"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={t('create.pinPlaceholder', lang)}
                  className="input-field mt-2"
                  maxLength={4}
                />
              )}
            </div>

            {roomMode === 'mini_games' && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white/85 mb-2">What you’re creating</p>
                <p className="text-sm text-white/70">
                  A single room where the TV host can start any mini-game or Amazing Race as separate sessions.
                </p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-white/10 border border-white/10">⚡ Trivia</span>
                  <span className="px-2 py-1 rounded bg-white/10 border border-white/10">🎬 Emoji</span>
                  <span className="px-2 py-1 rounded bg-white/10 border border-white/10">🎄 WYR</span>
                  <span className="px-2 py-1 rounded bg-white/10 border border-white/10">🎨 Pictionary</span>
                  <span className="px-2 py-1 rounded bg-white/10 border border-white/10">🏁 Amazing Race</span>
                </div>
              </div>
            )}

            {roomMode === 'amazing_race' && (
              <div>
                <label className="block text-base md:text-lg font-semibold mb-2">
                  {t('create.raceSettings', lang)}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                    <label className="block text-xs md:text-sm font-semibold mb-1.5 text-white/80">
                      {t('create.difficulty', lang)}
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                    <p className="mt-1.5 text-xs text-white/60">
                      {t('create.difficultyHelp', lang)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-2">
                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-xs md:text-sm font-semibold text-white/80">{t('create.allowSkips', lang)}</span>
                      <input
                        type="checkbox"
                        checked={allowSkips}
                        onChange={(e) => setAllowSkips(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-2 cursor-pointer">
                      <span className="text-xs md:text-sm font-semibold text-white/80">{t('create.eventsEnabled', lang)}</span>
                      <input
                        type="checkbox"
                        checked={eventsEnabled}
                        onChange={(e) => setEventsEnabled(e.target.checked)}
                        className="w-4 h-4"
                      />
                    </label>

                    <p className="text-xs text-white/60">
                      {t('create.eventsHelp', lang)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(roomMode === 'amazing_race' || roomMode === 'mini_games') && (
              <div>
              <label className="block text-base md:text-lg font-semibold mb-2">
                {t('scoring.overallScoring', lang)}
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 space-y-3">
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-xs md:text-sm font-semibold text-white/80">{t('scoring.enabled', lang)}</span>
                  <input
                    type="checkbox"
                    checked={overallScoringEnabled}
                    onChange={(e) => setOverallScoringEnabled(e.target.checked)}
                    className="w-4 h-4"
                  />
                </label>

                {overallScoringEnabled && (
                  <div>
                    <label className="block text-xs md:text-sm font-semibold mb-1.5 text-white/80">
                      {t('scoring.mode', lang)}
                    </label>
                    <select
                      value={overallScoringMode}
                      onChange={(e) => setOverallScoringMode(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="placements">{t('scoring.placements', lang)}</option>
                      <option value="sumMiniGameScores">{t('scoring.sumMiniGameScores', lang)}</option>
                      <option value="hybrid">{t('scoring.hybrid', lang)}</option>
                    </select>
                  </div>
                )}
              </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? t('common.loading', lang) : t('create.createRoom', lang)}
            </button>
          </form>
          </div>
        </div>
      </div>
    </main>
  );
}


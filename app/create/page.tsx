'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getLanguage, t } from '@/lib/i18n';
import { createRoom } from '@/lib/utils/room';
import toast from 'react-hot-toast';
import type { RoomMode, MiniGameType } from '@/types';
import Link from 'next/link';

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
  const modeParam = searchParams.get('mode') as RoomMode | null;
  const [roomMode, setRoomMode] = useState<RoomMode>(modeParam || 'amazing_race');
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [allowSkips, setAllowSkips] = useState(false);
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [overallScoringEnabled, setOverallScoringEnabled] = useState(false);
  const [overallScoringMode, setOverallScoringMode] = useState<'placements' | 'sumMiniGameScores' | 'hybrid'>('hybrid');
  const [miniGamesEnabled, setMiniGamesEnabled] = useState<MiniGameType[]>([]);
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

    if (roomMode === 'mini_games' && miniGamesEnabled.length === 0) {
      toast.error('Please select at least one mini game');
      return;
    }

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
        miniGamesEnabled: roomMode === 'mini_games' ? miniGamesEnabled : undefined,
      });
      
      router.push(`/room/${roomId}/tv`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const toggleMiniGame = (gameType: MiniGameType) => {
    setMiniGamesEnabled(prev =>
      prev.includes(gameType)
        ? prev.filter(g => g !== gameType)
        : [...prev, gameType]
    );
  };

  const getModeDisplayName = (mode: RoomMode): string => {
    switch (mode) {
      case 'amazing_race':
        return 'Amazing Race (Festive Dash)';
      case 'mini_games':
        return 'Mini Games';
      case 'leaderboard':
        return 'Leaderboard';
      default:
        return 'Unknown Mode';
    }
  };

  const getDefaultRoomName = (mode: RoomMode): string => {
    switch (mode) {
      case 'amazing_race':
        return 'Amazing Race';
      case 'mini_games':
        return 'Mini Games';
      case 'leaderboard':
        return 'Leaderboard';
      default:
        return 'Game Room';
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
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/game-night" className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md hover:bg-white/20 transition">
            <span>←</span>
            <span>Back</span>
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
            <span>🎬</span>
            <span>{getModeDisplayName(roomMode)}</span>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

          <div className="relative">
            <h1 className="game-show-title mb-2 text-center">{t('create.title', lang)}</h1>
            <p className="text-center text-white/75 mb-8">
              Create a room for {getModeDisplayName(roomMode)}
            </p>
          
            <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-lg font-semibold mb-2">
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
              <label className="block text-lg font-semibold mb-2">
                {t('create.maxPlayers', lang)}: {maxPlayers}
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
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
              <div>
                <label className="block text-lg font-semibold mb-3">
                  Select Mini Games
                </label>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                  {([
                    { type: 'trivia' as MiniGameType, name: '⚡ Trivia Blitz', desc: 'Quick-fire trivia questions' },
                    { type: 'emoji' as MiniGameType, name: '🎬 Emoji Movies/Songs', desc: 'Guess the movie or song from emojis' },
                    { type: 'wyr' as MiniGameType, name: '🤔 Would You Rather', desc: 'Make choices and see what others picked' },
                    { type: 'pictionary' as MiniGameType, name: '🎨 Pictionary', desc: 'Draw and guess prompts' },
                  ]).map((game) => (
                    <label
                      key={game.type}
                      className="flex items-start gap-3 cursor-pointer p-3 rounded-xl hover:bg-white/5 transition"
                    >
                      <input
                        type="checkbox"
                        checked={miniGamesEnabled.includes(game.type)}
                        onChange={() => toggleMiniGame(game.type)}
                        className="w-5 h-5 mt-0.5"
                      />
                      <div>
                        <div className="font-semibold text-white/90">{game.name}</div>
                        <div className="text-xs text-white/60">{game.desc}</div>
                      </div>
                    </label>
                  ))}
                  {miniGamesEnabled.length === 0 && (
                    <p className="text-xs text-white/60 italic">
                      Select at least one mini game to enable
                    </p>
                  )}
                </div>
              </div>
            )}

            {roomMode === 'amazing_race' && (
              <div>
                <label className="block text-lg font-semibold mb-3">
                  {t('create.raceSettings', lang)}
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <label className="block text-sm font-semibold mb-2 text-white/80">
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
                    <p className="mt-2 text-xs text-white/60">
                      {t('create.difficultyHelp', lang)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm font-semibold text-white/80">{t('create.allowSkips', lang)}</span>
                      <input
                        type="checkbox"
                        checked={allowSkips}
                        onChange={(e) => setAllowSkips(e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>

                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <span className="text-sm font-semibold text-white/80">{t('create.eventsEnabled', lang)}</span>
                      <input
                        type="checkbox"
                        checked={eventsEnabled}
                        onChange={(e) => setEventsEnabled(e.target.checked)}
                        className="w-5 h-5"
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
              <label className="block text-lg font-semibold mb-3">
                {t('scoring.overallScoring', lang)}
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-4">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm font-semibold text-white/80">{t('scoring.enabled', lang)}</span>
                  <input
                    type="checkbox"
                    checked={overallScoringEnabled}
                    onChange={(e) => setOverallScoringEnabled(e.target.checked)}
                    className="w-5 h-5"
                  />
                </label>

                {overallScoringEnabled && (
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-white/80">
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
              className="btn-primary w-full"
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


'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getLanguage, t } from '@/lib/i18n';
import { createRoom } from '@/lib/utils/room';
import toast from 'react-hot-toast';

export default function CreatePage() {
  const router = useRouter();
  const lang = getLanguage();
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(10);
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [allowSkips, setAllowSkips] = useState(false);
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      const roomId = await createRoom({
        name: roomName,
        maxPlayers,
        pinEnabled,
        pin: pinEnabled ? pin : undefined,
        settings: { difficulty, allowSkips },
        eventsEnabled,
      });
      
      router.push(`/room/${roomId}/tv`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
            <span>🎬</span>
            <span>{t('create.badge', lang)}</span>
            <span className="text-white/40">•</span>
            <span className="text-white/70">{t('create.badgeSub', lang)}</span>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

          <div className="relative">
            <h1 className="game-show-title mb-2 text-center">{t('create.title', lang)}</h1>
            <p className="text-center text-white/75 mb-8">
              {t('create.subtitle', lang)}
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


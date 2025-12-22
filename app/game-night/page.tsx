'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLanguage, hasStoredLanguage, setLanguage, t, type Language } from '@/lib/i18n';
import Link from 'next/link';
import type { RoomMode } from '@/types';

export default function GameNightPage() {
  const [language, setLanguageState] = useState<Language>('en');
  const [languageSelected, setLanguageSelected] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const stored = getLanguage();
    setLanguageState(stored);
    setLanguageSelected(hasStoredLanguage());
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setLanguageState(lang);
    setLanguageSelected(true);
  };

  const handleModeSelect = (mode: RoomMode) => {
    router.push(`/create?mode=${mode}`);
  };

  if (!languageSelected) {
    return (
      <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6 flex flex-col">
        <div className="mx-auto max-w-5xl w-full flex-1 min-h-0 flex flex-col">
          <div className="mb-6 md:mb-8 text-center shrink-0">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white/80 backdrop-blur-md">
              <span className="text-sm md:text-base">🎄</span>
              <span>{t('gamenight.title', language)}</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="card w-full max-w-lg text-center">
              <h1 className="game-show-title mb-3 md:mb-4 text-3xl md:text-4xl">{t('gamenight.title', language)}</h1>
              <p className="text-base md:text-lg lg:text-xl mb-6 md:mb-8 text-white/80">{t('gamenight.selectLanguage', language)}</p>
              <p className="text-xs md:text-sm mb-3 md:mb-4 text-white/70">{t('landing.selectLanguage', language)}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                <button onClick={() => handleLanguageSelect('en')} className="btn-primary w-full">
                  {t('landing.english', language)}
                </button>
                <button onClick={() => handleLanguageSelect('cs')} className="btn-primary w-full">
                  {t('landing.czech', language)}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6 flex flex-col">
      <div className="mx-auto max-w-4xl w-full flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex items-center justify-center">
          <div className="relative w-full max-w-3xl">
            <Link 
              href="/" 
              className="absolute -top-12 sm:-top-14 left-0 z-10 inline-flex items-center gap-2 md:gap-3 rounded-full bg-wood-dark/30 backdrop-blur-xl border border-wood-light/20 px-3 md:px-4 py-1.5 md:py-2 hover:bg-wood-dark/40 hover:border-fire-gold/40 transition text-xs md:text-sm text-white/85 hover:text-white"
              style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 140, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)' }}
            >
              <span>←</span>
              <span className="font-semibold">{t('nav.backToHome', language)}</span>
            </Link>
            <div className="card relative overflow-hidden w-full">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

            <div className="relative">
              <div className="text-center mb-6 md:mb-8">
                <h1 className="game-show-title mb-2 md:mb-3 text-3xl md:text-4xl">{t('gamenight.title', language)}</h1>
                <p className="text-base md:text-lg text-white/80">
                  {t('gamenight.chooseMode', language)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
                <button
                  onClick={() => handleModeSelect('mini_games')}
                  className="card text-center p-4 md:p-6 hover:bg-white/10 transition cursor-pointer border-2 border-transparent hover:border-christmas-gold/40"
                >
                  <div className="text-4xl md:text-5xl mb-2 md:mb-3">📺</div>
                  <h2 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">{t('gamenight.hostSession', language)}</h2>
                  <p className="text-xs md:text-sm text-white/70 mb-2 md:mb-3">{t('gamenight.hostSessionSub', language)}</p>
                  <p className="text-xs text-white/60">
                    {t('gamenight.hostSessionDesc', language)}
                  </p>
                </button>

                <Link
                  href="/leaderboard"
                  className="card text-center p-4 md:p-6 hover:bg-white/10 transition cursor-pointer border-2 border-transparent hover:border-christmas-gold/40"
                >
                  <div className="text-4xl md:text-5xl mb-2 md:mb-3">🏆</div>
                  <h2 className="text-lg md:text-xl font-bold mb-1.5 md:mb-2">{t('gamenight.leaderboard', language)}</h2>
                  <p className="text-xs md:text-sm text-white/70 mb-2 md:mb-3">{t('gamenight.leaderboardSub', language)}</p>
                  <p className="text-xs text-white/60">
                    {t('gamenight.leaderboardDesc', language)}
                  </p>
                </Link>
              </div>

              <div className="pt-4 md:pt-6 border-t border-white/10">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Link href="/join" className="btn-secondary flex-1 text-center text-sm md:text-base">
                    🎟️ {t('landing.joinRoom', language)}
                  </Link>
                  <Link
                    href="/active-rooms"
                    className="btn-secondary flex-1 text-center text-sm md:text-base"
                    title={t('gamenight.activeRooms', language)}
                    aria-label={t('gamenight.activeRooms', language)}
                  >
                    🏠 {t('gamenight.activeRooms', language)}
                  </Link>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

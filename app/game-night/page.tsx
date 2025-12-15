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
      <main className="min-h-screen px-4 py-10 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
              <span className="text-base">🎄</span>
              <span>Christmas Game Night</span>
            </div>
          </div>

          <div className="card mx-auto max-w-lg text-center">
            <h1 className="game-show-title mb-4">Christmas Game Night</h1>
            <p className="text-lg md:text-xl mb-8 text-white/80">Select your language</p>
            <p className="text-sm mb-4 text-white/70">{t('landing.selectLanguage', language)}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => handleLanguageSelect('en')} className="btn-primary w-full">
                English
              </button>
              <button onClick={() => handleLanguageSelect('cs')} className="btn-primary w-full">
                Čeština
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <Link href="/" className="hidden md:inline-flex items-center gap-3 rounded-full bg-white/10 border border-white/15 px-4 py-2 backdrop-blur-md hover:bg-white/20 transition">
            <span>←</span>
            <span className="font-semibold">Back to Home</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleLanguageSelect('en')}
              className={`px-4 py-2 rounded-full text-sm border backdrop-blur-md transition ${
                language === 'en'
                  ? 'bg-christmas-gold/25 border-christmas-gold/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => handleLanguageSelect('cs')}
              className={`px-4 py-2 rounded-full text-sm border backdrop-blur-md transition ${
                language === 'cs'
                  ? 'bg-christmas-gold/25 border-christmas-gold/40 text-white'
                  : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
              }`}
            >
              CS
            </button>
          </div>
        </div>

        <div className="card relative overflow-hidden">
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
          <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

          <div className="relative">
            <div className="text-center mb-8">
              <h1 className="game-show-title mb-3">Christmas Game Night</h1>
              <p className="text-lg text-white/80">
                Choose a game mode to create or join a room
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <button
                onClick={() => handleModeSelect('mini_games')}
                className="card text-center p-6 hover:bg-white/10 transition cursor-pointer border-2 border-transparent hover:border-christmas-gold/40"
              >
                <div className="text-5xl mb-3">📺</div>
                <h2 className="text-xl font-bold mb-2">Host Session</h2>
                <p className="text-sm text-white/70 mb-3">One room • many games</p>
                <p className="text-xs text-white/60">
                  Start any mini-game or Amazing Race from the TV hub. Phones auto-follow.
                </p>
              </button>

              <Link
                href="/leaderboard"
                className="card text-center p-6 hover:bg-white/10 transition cursor-pointer border-2 border-transparent hover:border-christmas-gold/40"
              >
                <div className="text-5xl mb-3">🏆</div>
                <h2 className="text-xl font-bold mb-2">Leaderboard</h2>
                <p className="text-sm text-white/70 mb-3">Global Rankings</p>
                <p className="text-xs text-white/60">
                  View all-time scores across all games
                </p>
              </Link>
            </div>

            <div className="pt-6 border-t border-white/10">
              <Link href="/join" className="btn-secondary w-full text-center">
                🎟️ {t('landing.joinRoom', language)}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Active Rooms Button - Bottom Right */}
      <Link
        href="/active-rooms"
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 rounded-full bg-wood-dark/60 backdrop-blur-xl border border-wood-light/30 hover:border-fire-gold/60 px-5 py-3 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
        style={{ 
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 193, 7, 0.15)' 
        }}
      >
        <span className="text-lg">🏠</span>
        <span>Active Rooms</span>
      </Link>
    </main>
  );
}

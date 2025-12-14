'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getLanguage, hasStoredLanguage, setLanguage, t, type Language } from '@/lib/i18n';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
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

  if (!languageSelected) {
    return (
      <main className="min-h-screen px-4 py-10 md:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm text-white/80 backdrop-blur-md">
              <span className="text-base">🎄</span>
              <span>Christmas Game Night</span>
              <span className="text-white/40">•</span>
              <span className="text-white/70">Amazing Race</span>
            </div>
          </div>

          <div className="card mx-auto max-w-lg text-center">
            <h1 className="game-show-title mb-4">{t('landing.title', language)}</h1>
            <p className="text-lg md:text-xl mb-8 text-white/80">{t('landing.subtitle', language)}</p>
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
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/10 border border-white/15 px-4 py-2 backdrop-blur-md">
            <span className="text-lg">🎄</span>
            <span className="font-semibold tracking-wide">Christmas Game Night</span>
            <span className="hidden sm:inline text-white/60">•</span>
            <span className="hidden sm:inline text-white/70">Amazing Race (independent progression)</span>
          </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          {/* Hero */}
          <div className="card relative overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-christmas-gold/15 blur-3xl" />
            <div className="absolute -left-28 -bottom-28 h-80 w-80 rounded-full bg-christmas-green/15 blur-3xl" />

            <div className="relative">
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs text-white/80">
                <span>✨</span>
                <span>Tonight’s holiday race</span>
              </p>

              <h1 className="game-show-title mt-4 mb-4">{t('landing.title', language)}</h1>
              <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-8">
                {t('landing.subtitle', language)}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/create" className="btn-primary w-full sm:w-auto text-center">
                  🎬 {t('landing.createRoom', language)}
                </Link>
                <Link href="/join" className="btn-secondary w-full sm:w-auto text-center">
                  🎟️ {t('landing.joinRoom', language)}
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 text-sm text-white/75">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">Instant setup</p>
                  <p className="mt-1 text-white/70">Create a room and put it on the TV.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="font-semibold text-white">Phone as controller</p>
                  <p className="mt-1 text-white/70">Players join and compete from their seats.</p>
                </div>
              </div>
            </div>
          </div>

          {/* “Photoshoot” style preview panel */}
          <div className="card relative overflow-hidden">
            <div className="absolute inset-0 opacity-70">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/20" />
              <div className="absolute right-[-20%] top-[10%] h-[460px] w-[460px] rounded-full bg-christmas-red/15 blur-3xl" />
              <div className="absolute left-[-10%] top-[55%] h-[420px] w-[420px] rounded-full bg-christmas-gold/12 blur-3xl" />
            </div>

            <div className="relative flex h-full flex-col">
              <div className="relative h-56 rounded-3xl overflow-hidden border border-white/20 bg-white/5 mb-6">
                <Image
                  src="/images/hero-livingroom.jpg"
                  alt="Cozy Christmas living room"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                  priority={false}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm text-white/80">Cozy lights. Big laughs. Fast rounds.</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-3">Game Night Vibes</h2>
              <p className="text-white/75 mb-6">
                Cozy lighting, quick rounds, and big reactions — built for the TV + phones setup.
              </p>

              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Festive Dash</p>
                    <span className="text-xl">🎄</span>
                  </div>
                  <p className="mt-1 text-sm text-white/70">Race through holiday riddles & clues.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Trivia Blitz</p>
                    <span className="text-xl">⚡</span>
                  </div>
                  <p className="mt-1 text-sm text-white/70">Fast answers. Faster points.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">Secret Missions</p>
                    <span className="text-xl">🕵️</span>
                  </div>
                  <p className="mt-1 text-sm text-white/70">Sneaky tasks during the party.</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/70">
                  Tip: open the <span className="text-white font-semibold">TV View</span> on a big screen and let
                  everyone scan the QR code.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="relative h-24 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <Image
                    src="/images/detail-cocoa.jpg"
                    alt="Hot chocolate"
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="relative h-24 rounded-2xl overflow-hidden border border-white/10 bg-white/5">
                  <Image
                    src="/images/detail-lights.jpg"
                    alt="Warm string lights"
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                    priority={false}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
              </div>

              <div className="mt-auto pt-6 text-xs text-white/60">
                Made to feel like a holiday studio set — without the setup stress.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


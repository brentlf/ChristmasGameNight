'use client';

import { useState, useEffect } from 'react';
import { getLanguage, setLanguage, t, type Language } from '@/lib/i18n';
import Link from 'next/link';

export default function Home() {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const stored = getLanguage();
    setLanguageState(stored);
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setLanguageState(lang);
  };

    return (
    <main className="min-h-screen px-4 py-10 md:py-16 flex items-center justify-center">
      <div className="mx-auto max-w-4xl w-full">
        {/* Header with animation */}
        <div className="mb-12 text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm text-white/80 backdrop-blur-md animate-float">
            <span className="text-base animate-pulse-slow">🎄</span>
            <span>Christmas</span>
            </div>
          </div>

        {/* Main title */}
        <div className="text-center mb-12 animate-slide-up-delayed">
          <h1 className="game-show-title mb-4 text-5xl md:text-7xl">{t('landing.title', language)}</h1>
          <p className="text-xl md:text-2xl text-white/80">{t('landing.subtitle', language)}</p>
        </div>

        {/* Square tiles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
          {/* Christmas Game Night Tile */}
          <Link 
            href="/game-night" 
            className="group relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-christmas-gold/20 via-christmas-bronze/15 to-christmas-red/10 backdrop-blur-xl border-2 border-white/20 hover:border-christmas-gold/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-christmas-gold/30 animate-scale-in"
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-christmas-gold/30 via-transparent to-christmas-bronze/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Floating orbs */}
            <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-christmas-gold/20 blur-2xl animate-float" />
            <div className="absolute bottom-4 left-4 w-32 h-32 rounded-full bg-christmas-bronze/15 blur-2xl animate-float-delayed" />
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-8 text-center z-10">
              <div className="text-6xl md:text-7xl mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                🎮
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white group-hover:text-christmas-gold transition-colors duration-300">
                Christmas Game Night
              </h2>
              <p className="text-white/70 text-sm md:text-base group-hover:text-white/90 transition-colors duration-300">
                Amazing Race & Trivia
              </p>
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </Link>

          {/* Christmas Traditions Tile */}
          <Link 
            href="/traditions" 
            className="group relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-christmas-green/20 via-christmas-red/15 to-christmas-gold/10 backdrop-blur-xl border-2 border-white/20 hover:border-christmas-green/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-christmas-green/30 animate-scale-in"
            style={{ animationDelay: '0.15s', animationFillMode: 'both' }}
          >
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-christmas-green/30 via-transparent to-christmas-red/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Floating orbs */}
            <div className="absolute top-4 left-4 w-28 h-28 rounded-full bg-christmas-green/20 blur-2xl animate-float-delayed" />
            <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-christmas-red/15 blur-2xl animate-float" />
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-8 text-center z-10">
              <div className="text-6xl md:text-7xl mb-4 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                🎡
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white group-hover:text-christmas-green transition-colors duration-300">
                Christmas Traditions
              </h2>
              <p className="text-white/70 text-sm md:text-base group-hover:text-white/90 transition-colors duration-300">
                Explore & Learn
              </p>
              
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </Link>
        </div>

        {/* Language selection buttons */}
        <div className="max-w-md mx-auto animate-slide-up-delayed">
          <p className="text-xs mb-3 text-white/60 text-center">{t('landing.selectLanguage', language)}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => handleLanguageSelect('en')} 
              className="group relative px-6 py-2 rounded-full overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 hover:border-christmas-gold/60 transition-all duration-300 hover:scale-105 hover:bg-white/15"
            >
              <span className="relative text-sm font-semibold text-white group-hover:text-christmas-gold transition-colors duration-300">
                English
              </span>
              <div className="absolute inset-0 bg-gradient-to-br from-christmas-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            <button 
              onClick={() => handleLanguageSelect('cs')} 
              className="group relative px-6 py-2 rounded-full overflow-hidden bg-white/10 backdrop-blur-md border border-white/20 hover:border-christmas-gold/60 transition-all duration-300 hover:scale-105 hover:bg-white/15"
            >
              <span className="relative text-sm font-semibold text-white group-hover:text-christmas-gold transition-colors duration-300">
                Čeština
              </span>
              <div className="absolute inset-0 bg-gradient-to-br from-christmas-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

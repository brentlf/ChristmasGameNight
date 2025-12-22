'use client';

import { useState, useEffect } from 'react';
import { getLanguage, setLanguage, t, type Language } from '@/lib/i18n';
import Link from 'next/link';
import { useAudio } from '@/lib/contexts/AudioContext';

export default function Home() {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);
  const { playSound } = useAudio();

  useEffect(() => {
    setMounted(true);
    const stored = getLanguage();
    setLanguageState(stored);
  }, []);

  const handleLanguageSelect = (lang: Language) => {
    playSound('click');
    setLanguage(lang);
    setLanguageState(lang);
  };

    return (
    <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6 flex items-center justify-center">
      <div className="mx-auto max-w-4xl w-full">
        {/* Header with animation */}
        <div className="mb-6 md:mb-8 text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 rounded-full bg-wood-dark/40 border border-wood-light/30 px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm text-white/90 backdrop-blur-md animate-float shadow-lg" style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 193, 7, 0.15)' }}>
            <span className="text-sm md:text-base animate-pulse-slow">🎄</span>
            <span>{mounted ? t('landing.christmas', language) : 'Christmas'}</span>
            </div>
          </div>

        {/* Main title */}
        <div className="text-center mb-6 md:mb-8 animate-slide-up-delayed">
          <h1 className="game-show-title mb-3 md:mb-4 text-3xl md:text-5xl lg:text-7xl">{mounted ? t('landing.title', language) : 'Christmas Game Night'}</h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/80">{mounted ? t('landing.subtitle', language) : 'Family Game Show'}</p>
        </div>

        {/* Square tiles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-6 mb-6 md:mb-8 max-w-3xl mx-auto">
          {/* Christmas Game Night Tile */}
          <Link 
            href="/game-night"
            onClick={() => playSound('whoosh', 0.3)}
            className="group relative aspect-[2/1] sm:aspect-[16/10] md:aspect-square rounded-lg md:rounded-2xl overflow-hidden bg-wood-dark/40 backdrop-blur-xl border border-wood-light/30 hover:border-fire-gold/60 transition-all duration-500 md:hover:scale-105 animate-scale-in"
            style={{ 
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 140, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Warm firelight glow on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-fire-orange/20 via-fire-gold/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Floating warm glows */}
            <div className="absolute top-3 right-3 w-20 h-20 md:top-4 md:right-4 md:w-24 md:h-24 rounded-full bg-fire-gold/25 blur-2xl animate-candle-flicker" />
            <div className="absolute bottom-3 left-3 w-24 h-24 md:bottom-4 md:left-4 md:w-32 md:h-32 rounded-full bg-fire-orange/20 blur-2xl animate-candle-flicker-delayed" />
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-2.5 sm:p-3 md:p-8 text-center z-10">
              <div className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl mb-1 sm:mb-1.5 md:mb-4 transform md:group-hover:scale-110 md:group-hover:rotate-12 transition-transform duration-500 filter drop-shadow-[0_0_15px_rgba(255,193,7,0.5)]">
                🎮
              </div>
              <h2 className="text-sm sm:text-base md:text-2xl lg:text-3xl font-bold mb-0.5 md:mb-2 text-white group-hover:text-fire-gold transition-colors duration-300 drop-shadow-lg break-words">
                {mounted ? t('landing.gameNightTile', language) : 'Christmas Game Night'}
              </h2>
              <p className="text-white/75 text-[11px] sm:text-xs md:text-sm lg:text-base group-hover:text-white/95 transition-colors duration-300 break-words">
                {mounted ? t('landing.gameNightTileSub', language) : 'Amazing Race & Trivia'}
              </p>
              
              {/* Warm shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fire-gold/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </Link>

          {/* Christmas Traditions Tile */}
          <Link 
            href="/traditions"
            onClick={() => playSound('whoosh', 0.3)}
            className="group relative aspect-[2/1] sm:aspect-[16/10] md:aspect-square rounded-lg md:rounded-2xl overflow-hidden bg-wood-dark/40 backdrop-blur-xl border border-wood-light/30 hover:border-fire-gold/60 transition-all duration-500 md:hover:scale-105 animate-scale-in"
            style={{ 
              animationDelay: '0.15s', 
              animationFillMode: 'both',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4), 0 0 20px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Warm festive glow on hover - with green accents for Christmas tree feel */}
            <div className="absolute inset-0 bg-gradient-to-br from-christmas-green/25 via-fire-gold/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Floating warm glows */}
            <div className="absolute top-3 left-3 w-24 h-24 md:top-4 md:left-4 md:w-28 md:h-28 rounded-full bg-christmas-green/25 blur-2xl animate-candle-flicker-delayed" />
            <div className="absolute bottom-3 right-3 w-20 h-20 md:bottom-4 md:right-4 md:w-24 md:h-24 rounded-full bg-fire-gold/20 blur-2xl animate-candle-flicker" />
            
            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center p-2.5 sm:p-3 md:p-8 text-center z-10">
              <div className="text-2xl sm:text-3xl md:text-6xl lg:text-7xl mb-1 sm:mb-1.5 md:mb-4 transform md:group-hover:scale-110 md:group-hover:-rotate-12 transition-transform duration-500 filter drop-shadow-[0_0_15px_rgba(22,163,74,0.5)]">
                🎡
              </div>
              <h2 className="text-sm sm:text-base md:text-2xl lg:text-3xl font-bold mb-0.5 md:mb-2 text-white group-hover:text-fire-gold transition-colors duration-300 drop-shadow-lg break-words">
                {mounted ? t('landing.traditionsTile', language) : 'Christmas Traditions'}
              </h2>
              <p className="text-white/75 text-[11px] sm:text-xs md:text-sm lg:text-base group-hover:text-white/95 transition-colors duration-300 break-words">
                {mounted ? t('landing.traditionsTileSub', language) : 'Explore & Learn'}
              </p>
              
              {/* Warm shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-fire-gold/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </Link>
        </div>

        {/* Language selection buttons */}
        <div className="max-w-md mx-auto animate-slide-up-delayed">
          <p className="text-xs mb-2 md:mb-3 text-white/70 text-center">{mounted ? t('landing.selectLanguage', language) : 'Select Language'}</p>
          <div className="flex gap-2 md:gap-3 justify-center">
            <button 
              onClick={() => handleLanguageSelect('en')} 
              className={`group relative px-6 py-2 rounded-full overflow-hidden backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
                language === 'en' 
                  ? 'bg-fire-gold/30 border-fire-gold/60' 
                  : 'bg-wood-dark/40 border-wood-light/30 hover:border-fire-gold/60 hover:bg-wood-dark/50'
              }`}
              style={{ boxShadow: language === 'en' 
                ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 193, 7, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                : '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
              }}
            >
              <span className={`relative text-sm font-semibold transition-colors duration-300 ${
                language === 'en' ? 'text-fire-gold' : 'text-white group-hover:text-fire-gold'
              }`}>
                {mounted ? t('landing.english', language) : 'English'}
              </span>
              <div className={`absolute inset-0 bg-gradient-to-br from-fire-gold/25 to-transparent transition-opacity duration-300 ${
                language === 'en' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`} />
            </button>
            <button 
              onClick={() => handleLanguageSelect('cs')} 
              className={`group relative px-6 py-2 rounded-full overflow-hidden backdrop-blur-md border transition-all duration-300 hover:scale-105 ${
                language === 'cs' 
                  ? 'bg-fire-gold/30 border-fire-gold/60' 
                  : 'bg-wood-dark/40 border-wood-light/30 hover:border-fire-gold/60 hover:bg-wood-dark/50'
              }`}
              style={{ boxShadow: language === 'cs' 
                ? '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 20px rgba(255, 193, 7, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
                : '0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
              }}
            >
              <span className={`relative text-sm font-semibold transition-colors duration-300 ${
                language === 'cs' ? 'text-fire-gold' : 'text-white group-hover:text-fire-gold'
              }`}>
                Čeština
              </span>
              <div className={`absolute inset-0 bg-gradient-to-br from-fire-gold/25 to-transparent transition-opacity duration-300 ${
                language === 'cs' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`} />
            </button>
          </div>
        </div>
      </div>
      </main>
    );
  }

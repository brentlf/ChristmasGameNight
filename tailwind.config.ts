import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: '#DC2626',
          green: '#16A34A',
          gold: '#F59E0B',
          bronze: '#D97706',
        },
        // Cosy Christmas night palette - warm firelight and candlelight
        fire: {
          orange: '#FF8C00',      // Warm orange like fire embers
          gold: '#FFC107',         // Golden candlelight
          amber: '#FFA000',        // Amber glow
        },
        wood: {
          dark: '#3E2723',         // Dark wood paneling (like fireplace)
          medium: '#5D4037',       // Medium wood tone
          light: '#8D6E63',        // Light wood accents
        },
      },
      animation: {
        'snow': 'snow 20s linear infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out infinite 1.5s',
        'glow': 'glow 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.6s ease-out',
        'slide-up-delayed': 'slideUp 0.6s ease-out 0.2s both',
        'scale-in': 'scaleIn 0.5s ease-out',
        'shimmer': 'shimmer 2s linear infinite',
        'fire-flicker': 'fireFlicker 4s ease-in-out infinite',
        'fire-flicker-delayed': 'fireFlicker 4s ease-in-out infinite 1.5s',
        'candle-flicker': 'candleFlicker 3s ease-in-out infinite',
        'candle-flicker-delayed': 'candleFlicker 3s ease-in-out infinite 1s',
        'twinkle': 'twinkle 5s ease-in-out infinite',
        'twinkle-delayed': 'twinkle 5s ease-in-out infinite 2s',
      },
      keyframes: {
        snow: {
          '0%': { transform: 'translateY(-100vh) rotate(0deg)' },
          '100%': { transform: 'translateY(100vh) rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fireFlicker: {
          '0%, 100%': { opacity: '0.8', transform: 'scale(1)' },
          '25%': { opacity: '1', transform: 'scale(1.05)' },
          '50%': { opacity: '0.7', transform: 'scale(0.95)' },
          '75%': { opacity: '0.9', transform: 'scale(1.02)' },
        },
        candleFlicker: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1) translateY(0)' },
          '33%': { opacity: '0.8', transform: 'scale(1.02) translateY(-2px)' },
          '66%': { opacity: '0.5', transform: 'scale(0.98) translateY(2px)' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
export default config


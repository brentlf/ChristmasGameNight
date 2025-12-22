// @ts-nocheck
'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAudio } from '@/lib/contexts/AudioContext';

// Dynamically import entire 3D scene (client-side only, no SSR)
const BingoBallMachine3DScene = dynamic(() => import('./BingoBallMachine3DScene'), { 
  ssr: false,
  loading: () => null, // Don't show anything while loading - Canvas will handle it
});

interface BingoBallMachineProps {
  currentBall: string | null; // e.g., "B-12"
  isDrawing: boolean;
  lang: 'en' | 'cs';
}

// Animation timing constants - 10-second mechanical sequence
const RAMP_MS = 400; // 0.0s → 0.4s: Start + ramp (agitator starts, balls begin lifting)
const MIX_FAST_MS = 3100; // 0.4s → 3.5s: Full mixing (agitator at full speed, balls swirl strongly)
const MIX_SLOW_MS = 1700; // 3.5s → 5.2s: Slow-down (agitator slows, balls fall back)
const LOCK_MS = 800; // 5.2s → 6.0s: Selection lock (still hidden, subtle motion)
const EJECT_MS = 1200; // 6.0s → 7.2s: Ejection begins (ball appears at tube, starts rolling)
const LAND_MS = 1000; // 7.2s → 8.2s: Ball lands in tray (bounce + settle)
const REVEAL_MS = 800; // 8.2s → 9.0s: Reveal (ding sound, number text appears)
const COOLDOWN_MS = 1000; // 9.0s → 10.0s: Return to idle (agitator stops, balls settle)
const TOTAL_ANIMATION_MS = 10000; // Total 10-second sequence

// Derived timing for ball transit (ejection + landing)
const BALL_TRANSIT_MS = EJECT_MS + LAND_MS; // 6.0s → 8.2s (2200ms total)
const BALL_EJECTION_START_MS = RAMP_MS + MIX_FAST_MS + MIX_SLOW_MS + LOCK_MS; // 6.0s
const REVEAL_DELAY_MS = BALL_EJECTION_START_MS + BALL_TRANSIT_MS; // 8.2s
const SPIN_STOP_MS = REVEAL_DELAY_MS + REVEAL_MS; // 9.0s (stop after reveal begins)

export default function BingoBallMachine({ currentBall, isDrawing, lang }: BingoBallMachineProps) {
  const { playSound } = useAudio();
  const [displayBall, setDisplayBall] = useState<string | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [spinPhase, setSpinPhase] = useState<'fast' | 'slow' | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [ballInTransit, setBallInTransit] = useState<string | null>(null);
  const [transitProgress, setTransitProgress] = useState(0);
  const [sceneError, setSceneError] = useState(false);
  const prevBallRef = useRef<string | null>(null);
  const scheduledBallRef = useRef<string | null>(null); // StrictMode-safe "already scheduled" guard
  const queuedBallRef = useRef<string | null>(null); // latest ball received while animating
  const isAnimatingRef = useRef(false); // prevents overlaps
  const drawStartMsRef = useRef<number | null>(null);
  const prevPhaseRef = useRef<string | null>(null);
  const transitAnimationRef = useRef<number | null>(null);
  const animationTimeoutsRef = useRef<{ slowMix: NodeJS.Timeout | null; ejection: NodeJS.Timeout | null; stop: NodeJS.Timeout | null }>({
    slowMix: null,
    ejection: null,
    stop: null
  });

  // Centralized bingo audio events (cooldowns handled in AudioContext)
  const playBingoSoundRef = useRef((event: 'spin' | 'ball_pop' | 'success') => {
    switch (event) {
      case 'spin':
        playSound('bingo.spin', 0.15);
        break;
      case 'ball_pop':
        playSound('bingo.ball_pop', 0.2);
        break;
      case 'success':
        playSound('game.reveal', 0.28);
        break;
    }
  });
  
  // Update ref when playSound changes (should be stable from context)
  useEffect(() => {
    playBingoSoundRef.current = (event: 'spin' | 'ball_pop' | 'success') => {
      switch (event) {
        case 'spin':
          playSound('bingo.spin', 0.15);
          break;
        case 'ball_pop':
          playSound('bingo.ball_pop', 0.2);
          break;
        case 'success':
          playSound('game.reveal', 0.28);
          break;
      }
    };
  }, [playSound]);

  const clearAnimationTimeouts = () => {
    if (animationTimeoutsRef.current.slowMix) {
      clearTimeout(animationTimeoutsRef.current.slowMix);
      animationTimeoutsRef.current.slowMix = null;
    }
    if (animationTimeoutsRef.current.ejection) {
      clearTimeout(animationTimeoutsRef.current.ejection);
      animationTimeoutsRef.current.ejection = null;
    }
    if (animationTimeoutsRef.current.stop) {
      clearTimeout(animationTimeoutsRef.current.stop);
      animationTimeoutsRef.current.stop = null;
    }
  };

  // Cleanup on unmount only (StrictMode will still run this, but that's correct)
  useEffect(() => {
    return () => {
      clearAnimationTimeouts();
      if (transitAnimationRef.current) cancelAnimationFrame(transitAnimationRef.current);
    };
  }, []);

  const startDrawAnimation = (ballValue: string) => {
    // mark as in-flight to prevent overlaps
    isAnimatingRef.current = true;
    drawStartMsRef.current = Date.now();

    // Clear any leftover timers from a previous run (defensive)
    clearAnimationTimeouts();

    console.log('[BingoBallMachine] 🎱 Draw ball animation started:', ballValue);
    console.log('[BingoBallMachine] ⏱️ Setting up timeouts:', {
      slowMix: RAMP_MS + MIX_FAST_MS,
      ejection: BALL_EJECTION_START_MS,
      stop: SPIN_STOP_MS,
    });

    // 0.0s: start spinning
    console.log('[BingoBallMachine] 0.0s: Starting spin, setting phase to "fast"');
    setSpinning(true);
    setSpinPhase('fast');
    playBingoSoundRef.current('spin');

    // 3.5s: slow-down
    animationTimeoutsRef.current.slowMix = setTimeout(() => {
      console.log('[BingoBallMachine] 3.5s: Transitioning to "slow" phase');
      setSpinPhase('slow');
      animationTimeoutsRef.current.slowMix = null;
    }, RAMP_MS + MIX_FAST_MS);

    // 6.0s: ejection start
    animationTimeoutsRef.current.ejection = setTimeout(() => {
      console.log('[BingoBallMachine] 6.0s: Ball ejection started, ball in transit:', ballValue);
      setBallInTransit(ballValue);
      animationTimeoutsRef.current.ejection = null;
    }, BALL_EJECTION_START_MS);

    // 9.0s: stop and mark animation done (then optionally start queued ball)
    animationTimeoutsRef.current.stop = setTimeout(() => {
      console.log('[BingoBallMachine] 9.0s: Stopping spin, returning to idle');
      setSpinning(false);
      setSpinPhase(null);
      setRevealing(false);
      animationTimeoutsRef.current.stop = null;
      isAnimatingRef.current = false;

      // If a newer ball arrived mid-animation, start it now (no overlap)
      if (queuedBallRef.current && queuedBallRef.current !== prevBallRef.current) {
        const next = queuedBallRef.current;
        queuedBallRef.current = null;
        scheduledBallRef.current = next;
        prevBallRef.current = next;
        // Slight defer so state updates above commit first
        setTimeout(() => startDrawAnimation(next), 0);
      }
    }, SPIN_STOP_MS);

    console.log('[BingoBallMachine] ⏰ Timeout IDs set:', {
      slowMix: animationTimeoutsRef.current.slowMix,
      ejection: animationTimeoutsRef.current.ejection,
      stop: animationTimeoutsRef.current.stop,
    });
  };

  // Derived "phase" label for debugging / verification.
  // This matches the intent:
  // idle -> ramp_up (implicit) -> fast_mix -> slow_down -> transit -> reveal -> return_to_idle
  const nowMs = Date.now();
  const sinceDrawMs = drawStartMsRef.current != null ? nowMs - drawStartMsRef.current : null;
  const phase =
    !spinning && !spinPhase && !ballInTransit && !displayBall && !revealing
      ? 'idle'
      : ballInTransit
        ? 'ball_transit'
        : displayBall && revealing
          ? 'reveal'
          : spinning && spinPhase === 'fast' && sinceDrawMs != null && sinceDrawMs < RAMP_MS
            ? 'ramp_up'
            : spinning && spinPhase === 'fast'
              ? 'fast_mix'
              : spinning && spinPhase === 'slow'
                ? 'slow_down'
                : !spinning && !spinPhase
                  ? 'return_to_idle'
                  : 'unknown';

  // Log phase transitions once (including initial idle on load).
  useEffect(() => {
    if (prevPhaseRef.current !== phase) {
      prevPhaseRef.current = phase;
      console.log('[BingoBallMachine] 🧭 Phase →', phase, {
        spinning,
        spinPhase,
        ballInTransit,
        transitProgress,
        displayBall,
        revealing,
        sinceDrawMs,
      });
    }
  }, [phase, spinning, spinPhase, ballInTransit, transitProgress, displayBall, revealing, sinceDrawMs]);

  // Animate ball transit
  useEffect(() => {
    if (ballInTransit) {
      console.log('[BingoBallMachine] 🎯 Ball transit animation started:', ballInTransit);
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / BALL_TRANSIT_MS);
        setTransitProgress(progress);
        
        if (progress < 1) {
          transitAnimationRef.current = requestAnimationFrame(animate);
        } else {
          // Transit complete - ball has landed in tray
          console.log('[BingoBallMachine] ✅ Ball transit complete, landing in tray:', ballInTransit);
          setDisplayBall(ballInTransit);
          setBallInTransit(null);
          setTransitProgress(0);
          setRevealing(true);
          playBingoSoundRef.current('ball_pop');
          console.log('[BingoBallMachine] 🎉 Reveal started, display ball set:', ballInTransit);
          // Note: Spinning stops after settle period (handled in main effect)
        }
      };
      transitAnimationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (transitAnimationRef.current) {
          cancelAnimationFrame(transitAnimationRef.current);
        }
      };
    } else {
      setTransitProgress(0);
    }
  }, [ballInTransit]);

  // Handle new ball draw animation
  useEffect(() => {
    // Only start animation if we have a new ball
    if (!currentBall) return;
    if (currentBall === scheduledBallRef.current) return; // StrictMode double-effect guard
    if (currentBall === prevBallRef.current) return;

    // If we're mid-animation, queue the latest ball and exit (prevents overlap)
    if (isAnimatingRef.current) {
      queuedBallRef.current = currentBall;
      console.log('[BingoBallMachine] 🧵 Queued ball (animation in progress):', currentBall);
      return;
    }

    // Start immediately (no overlap)
    scheduledBallRef.current = currentBall;
    prevBallRef.current = currentBall;
    startDrawAnimation(currentBall);
  }, [currentBall]); // Only depend on currentBall
  
  // Separate effect for resetting when currentBall becomes null
  useEffect(() => {
    if (currentBall === null && displayBall !== null) {
      // Reset when ball becomes null
      console.log('[BingoBallMachine] Resetting machine state');
      setDisplayBall(null);
      setSpinning(false);
      setSpinPhase(null);
      setRevealing(false);
      setBallInTransit(null);
      setTransitProgress(0);
      drawStartMsRef.current = null;
      scheduledBallRef.current = null;
      queuedBallRef.current = null;
      isAnimatingRef.current = false;
    }
  }, [currentBall, displayBall]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* 3D Canvas */}
      <div className="w-[400px] h-[500px] md:w-[500px] md:h-[600px] relative rounded-lg overflow-hidden">
        {!sceneError ? (
          <BingoBallMachine3DScene
            spinning={spinning}
            spinPhase={spinPhase}
            ballInTransit={ballInTransit}
            transitProgress={transitProgress}
            displayBall={displayBall}
            revealing={revealing}
            onError={() => setSceneError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
            3D scene unavailable
          </div>
        )}
      </div>
      
      {!displayBall && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200px] md:w-[260px] h-[140px] md:h-[180px] flex items-center justify-center pointer-events-none">
          <div className="text-2xl text-white/40 font-semibold">
            {lang === 'cs' ? 'Připraveno' : 'Ready'}
          </div>
        </div>
      )}
      
      {/* Machine Label / Ball Display */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-center pointer-events-none">
        {displayBall ? (
          <div className="flex items-center justify-center gap-3 md:gap-4">
            {/* Letter */}
            <div className="text-5xl md:text-6xl font-black text-white drop-shadow-lg leading-none">
              {displayBall.split('-')[0]}
            </div>
            {/* Number */}
            <div className="text-6xl md:text-7xl font-black text-white drop-shadow-lg leading-none">
              {displayBall.split('-')[1]}
            </div>
          </div>
        ) : (
          <>
            <div className="text-xl md:text-2xl font-black text-yellow-400 mb-1" style={{ textShadow: '0 0 10px rgba(234, 179, 8, 0.8)' }}>
              🎄 BINGO 🎄
            </div>
            <div className="text-xs md:text-sm text-white/60">
              {lang === 'cs' ? 'Vánoční Bingo' : 'Christmas Bingo'}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

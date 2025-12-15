'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayer } from '@/lib/hooks/usePlayer';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { getLanguage, t } from '@/lib/i18n';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  initializePictionaryGame, 
  startPictionaryRound, 
  updatePictionaryDrawing, 
  submitPictionaryGuess, 
  endPictionaryRound 
} from '@/lib/miniGameEngine';
import { getPictionaryItemById } from '@/lib/miniGameContent';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PictionaryPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { room } = useRoom(roomId);
  const { players } = usePlayers(roomId);
  const [playerUid, setPlayerUid] = useState<string | null>(null);
  const { player } = usePlayer(roomId, playerUid);
  const lang = getLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setPlayerUid(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  // Important: the "host" is whoever created the room (controllerUid).
  // The controller may be on the TV device and might NOT have a player doc.
  const isControllerAuthed = !!playerUid && room.controllerUid === playerUid;

  // If you don't have a player doc, you can't participate as a drawer/guesser.
  // But the controller should still be able to start/advance the game.
  if (!player) {
    if (isControllerAuthed) {
      return <PictionaryHostControls roomId={roomId} room={room} players={players} lang={lang} />;
    }

    return (
      <main className="min-h-screen px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <h1 className="text-2xl font-bold mb-4">🎨 Pictionary</h1>
            <p className="text-white/70 mb-6">You need to join the room as a player to play.</p>
            <Link href={`/room/${roomId}/play`} className="btn-primary inline-block">
              Join as player
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const gameState = room.pictionaryGameState;
  const myTotalScore = gameState?.totalScores?.[player.uid] ?? player.miniGameProgress?.pictionary?.score ?? 0;

  // Initialize game if not started - only show to controller if enough players
  if (!gameState) {
    if (players.length >= 2) {
      return <PictionaryInitialization roomId={roomId} room={room} player={player} lang={lang} />;
    } else {
      const isController = isControllerAuthed || room.controllerUid === player.uid;
      return (
        <main className="min-h-screen px-4 py-10">
          <div className="max-w-xl mx-auto">
            <div className="card text-center">
              <h1 className="text-2xl font-bold mb-4">🎨 Pictionary</h1>
              <p className="text-white/70 mb-2">Waiting for more players (need at least 2)</p>
              <p className="text-sm text-white/60">
                Current players: {players.length}
                {isController && ' - You are the host'}
              </p>
            </div>
          </div>
        </main>
      );
    }
  }


  // Game completed
  if (gameState.status === 'completed') {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="game-show-title mb-3">Game Complete!</h1>
            <p className="text-white/80 mb-6">
              Your Score: <span className="font-bold text-christmas-gold text-3xl">{myTotalScore}</span>
            </p>
            <Link href={`/room/${roomId}/play`} className="btn-primary text-center inline-block">
              {t('common.back', lang)}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Waiting to start - only show waiting screen if status is 'waiting' AND round is 0
  // Once round starts (currentRound > 0), everyone should see the game
  if (gameState.status === 'waiting' && gameState.currentRound === 0) {
    const isController = isControllerAuthed || room.controllerUid === player.uid;
    return <PictionaryWaiting roomId={roomId} room={room} player={player} gameState={gameState} lang={lang} isController={isController} />;
  }

  // Round ended - show results
  if (gameState.status === 'round_end') {
    return <PictionaryRoundEnd roomId={roomId} room={room} player={player} gameState={gameState} players={players} lang={lang} />;
  }

  // Active round - show drawer or guesser view
  const isDrawer = gameState.currentDrawerUid === player.uid;

  if (isDrawer) {
    return (
      <PictionaryDrawer
        roomId={roomId}
        player={player}
        gameState={gameState}
        lang={lang}
      />
    );
  }

  return (
    <PictionaryGuesser
      roomId={roomId}
      player={player}
      gameState={gameState}
      players={players}
      lang={lang}
    />
  );
}

function PictionaryInitialization({ roomId, room, player, lang }: { roomId: string; room: any; player: any; lang: 'en' | 'cs' }) {
  const isController = room.controllerUid === player.uid;
  const [initializing, setInitializing] = useState(false);

  const handleStart = async () => {
    if (!isController || initializing) return;
    setInitializing(true);
    try {
      // Initialize game first (this is safe to call even if already initialized)
      await initializePictionaryGame(roomId);
      // Then start the first round
      await startPictionaryRound(roomId);
      toast.success('Game started!');
    } catch (error: any) {
      console.error('Failed to start game:', error);
      toast.error(error.message || 'Failed to start game');
    } finally {
      setInitializing(false);
    }
  };

  if (!isController) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <h1 className="text-2xl font-bold mb-4">🎨 Pictionary</h1>
            <p className="text-white/70">Waiting for host to start the game...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-4">🎨 Pictionary</h1>
          <p className="text-white/70 mb-6">Ready to start the game!</p>
          <button
            onClick={handleStart}
            disabled={initializing}
            className="btn-primary w-full"
          >
            {initializing ? t('common.loading', lang) : 'Start Game'}
          </button>
        </div>
      </div>
    </main>
  );
}

function PictionaryWaiting({ 
  roomId, 
  room, 
  player, 
  gameState, 
  lang,
  isController
}: { 
  roomId: string; 
  room: any;
  player: any;
  gameState: any; 
  lang: 'en' | 'cs';
  isController: boolean;
}) {
  const [starting, setStarting] = useState(false);
  
  const handleStartRound = async () => {
    if (!isController || starting) return;
    setStarting(true);
    try {
      await startPictionaryRound(roomId);
      toast.success('Game started!');
    } catch (error: any) {
      console.error('Failed to start round:', error);
      toast.error(error.message || 'Failed to start round');
    } finally {
      setStarting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-4">🎨 Pictionary</h1>
          {isController ? (
            <>
              <p className="text-white/70 mb-6">Ready to start the game!</p>
              <button 
                onClick={handleStartRound} 
                disabled={starting}
                className="btn-primary w-full"
              >
                {starting ? t('common.loading', lang) : 'Start Game'}
              </button>
              {gameState && (
                <p className="text-xs text-white/50 mt-4">
                  Players: {gameState.drawerOrder?.length || 0} | Total rounds: {gameState.totalRounds || 0}
                </p>
              )}
            </>
          ) : (
            <>
              <p className="text-white/70 mb-4">Waiting for host to start the game...</p>
              <p className="text-xs text-white/50">
                The host will start the game from their device.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function PictionaryRoundEnd({ 
  roomId, 
  room,
  player,
  gameState, 
  players, 
  lang 
}: { 
  roomId: string; 
  room: any;
  player: any;
  gameState: any; 
  players: any[]; 
  lang: 'en' | 'cs' 
}) {
  const isController = room.controllerUid === player.uid;
  const handleNextRound = async () => {
    if (!isController) return;
    try {
      await startPictionaryRound(roomId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to start next round');
    }
  };

  const drawer = players.find((p) => p.uid === gameState.currentDrawerUid);
  const prompt = gameState.currentPromptId ? getPictionaryItemById(gameState.currentPromptId) : null;
  const drawerScore =
    (drawer ? (gameState.totalScores?.[drawer.uid] ?? drawer.miniGameProgress?.pictionary?.score ?? 0) : 0);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-4">Round {gameState.currentRound} Complete!</h1>
          
          {drawer && (
            <div className="mb-4">
              <p className="text-white/70 mb-2">Drawer: {drawer.name}</p>
              {prompt && (
                <p className="text-christmas-gold font-bold text-xl mb-2">{prompt.prompt[lang]}</p>
              )}
              <p className="text-white/70">Score: {drawerScore}</p>
            </div>
          )}

          {gameState.correctGuessers && gameState.correctGuessers.length > 0 && (
            <div className="mb-6">
              <p className="text-white/70 mb-2">Correct guessers:</p>
              {gameState.correctGuessers.map((uid: string) => {
                const guesser = players.find((p) => p.uid === uid);
                return guesser ? <p key={uid} className="text-christmas-gold">{guesser.name}</p> : null;
              })}
            </div>
          )}

          {isController ? (
            <button 
              onClick={handleNextRound} 
              className="btn-primary w-full"
              disabled={gameState.currentRound >= gameState.totalRounds}
            >
              {gameState.currentRound >= gameState.totalRounds ? 'Game Complete!' : 'Next Round'}
            </button>
          ) : (
            <p className="text-white/70">Waiting for host to start next round...</p>
          )}
        </div>
      </div>
    </main>
  );
}

function PictionaryDrawer({
  roomId,
  player,
  gameState,
  lang,
}: {
  roomId: string;
  player: any;
  gameState: any;
  lang: 'en' | 'cs';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prompt = gameState.currentPromptId ? getPictionaryItemById(gameState.currentPromptId) : null;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const roundStartTime = gameState.roundStartTime || now;
  const elapsed = Math.floor((now - roundStartTime) / 1000);
  const remaining = Math.max(0, (gameState.timeLimit || 60) - elapsed);

  // Auto-end round when time runs out
  useEffect(() => {
    if (remaining === 0 && gameState.status === 'drawing') {
      endPictionaryRound(roomId).catch(console.error);
    }
  }, [remaining, gameState.status, roomId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = isFullscreen ? 4 : 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    setCanvasSize();
    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isFullscreen]);

  // Sync drawing to Firestore (throttled)
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const syncDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      const dataUrl = canvas.toDataURL('image/png');
      updatePictionaryDrawing(roomId, dataUrl).catch(console.error);
    }, 200); // Throttle to every 200ms
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
    syncDrawing();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    syncDrawing();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    syncDrawing();
  };

  const handleEndRound = async () => {
    try {
      await endPictionaryRound(roomId);
    } catch (error: any) {
      toast.error(error.message || 'Failed to end round');
    }
  };

  // Fullscreen view
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-between">
          <button
            onClick={() => setIsFullscreen(false)}
            onPointerDown={(e) => {
              // Some mobile browsers can be finicky with click synthesis when drawing;
              // handle pointer down explicitly so "minimize" always works.
              e.preventDefault();
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            onTouchStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsFullscreen(false);
            }}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            type="button"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex-1 text-center px-4">
            <p className="text-white/90 font-semibold text-sm">{prompt?.prompt[lang]}</p>
            <p className="text-white/60 text-xs mt-1">Time: {remaining}s</p>
          </div>
          {/* intentionally no "end round" button in fullscreen */}
          <div className="w-12 h-12" />
        </div>

        <div className="absolute inset-0 pt-20 pb-24">
          <canvas
            ref={canvasRef}
            className="w-full h-full bg-white/5 touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm p-4">
          <button className="btn-secondary w-full" onClick={clearCanvas} type="button">
            Clear
          </button>
        </div>
      </div>
    );
  }

  // Normal view
  return (
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto">
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">🎨 You're Drawing!</h1>
            <Link href={`/room/${roomId}/play`} className="btn-secondary text-sm">
              {t('common.back', lang)}
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-sm text-white/70">
              Round {gameState.currentRound} / {gameState.totalRounds}
            </p>
            <p className="text-2xl font-bold text-christmas-gold mt-2">Time: {remaining}s</p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Draw: <span className="text-christmas-gold">{prompt?.prompt[lang]}</span>
          </h2>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4 relative">
            <canvas
              ref={canvasRef}
              className="w-full h-64 bg-white/5 rounded-lg touch-none"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            
            <button
              onClick={() => setIsFullscreen(true)}
              className="absolute top-6 right-6 flex items-center justify-center w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 transition-colors backdrop-blur-sm"
              type="button"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>

          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={clearCanvas} type="button">
              Clear
            </button>
            <button className="btn-primary flex-1" onClick={handleEndRound}>
              End Round
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function PictionaryGuesser({
  roomId,
  player,
  gameState,
  players,
  lang,
}: {
  roomId: string;
  player: any;
  gameState: any;
  players: any[];
  lang: 'en' | 'cs';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [guess, setGuess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hasGuessed, setHasGuessed] = useState(false);
  const drawer = players.find((p) => p.uid === gameState.currentDrawerUid);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const roundStartTime = gameState.roundStartTime || now;
  const elapsed = Math.floor((now - roundStartTime) / 1000);
  const remaining = Math.max(0, (gameState.timeLimit || 60) - elapsed);

  // Load drawing from gameState
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState.drawingData) return;
    
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = gameState.drawingData;
  }, [gameState.drawingData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    setCanvasSize();
    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Check if player has already guessed correctly
  useEffect(() => {
    if (gameState.correctGuessers?.includes(player.uid)) {
      setHasGuessed(true);
    }
  }, [gameState.correctGuessers, player.uid]);

  const handleSubmitGuess = async () => {
    if (!guess.trim() || submitting || hasGuessed) return;
    
    setSubmitting(true);
    try {
      const result = await submitPictionaryGuess(roomId, player.uid, guess);
      if (result.correct) {
        toast.success('Correct! 🎉');
        setHasGuessed(true);
        if (result.drawerScored) {
          toast.success('Drawer scored a point!');
        }
      } else {
        toast.error('Incorrect, keep trying!');
      }
      setGuess('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit guess');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto">
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">🎨 Guess the Drawing!</h1>
            <Link href={`/room/${roomId}/play`} className="btn-secondary text-sm">
              {t('common.back', lang)}
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-sm text-white/70">
              Round {gameState.currentRound} / {gameState.totalRounds}
            </p>
            <p className="text-2xl font-bold text-christmas-gold mt-2">Time: {remaining}s</p>
            {drawer && (
              <p className="text-white/70 text-sm mt-2">Drawing by: {drawer.name}</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
            <canvas
              ref={canvasRef}
              className="w-full h-64 bg-white/5 rounded-lg"
            />
          </div>

          {hasGuessed ? (
            <div className="text-center p-4 bg-christmas-gold/20 rounded-lg mb-4">
              <p className="text-christmas-gold font-bold">✓ You guessed correctly!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitGuess()}
                placeholder="Enter your guess..."
                className="input-field"
                disabled={submitting}
              />
              <button
                onClick={handleSubmitGuess}
                disabled={!guess.trim() || submitting}
                className="btn-primary w-full"
              >
                {submitting ? 'Submitting...' : 'Submit Guess'}
              </button>
            </div>
          )}

          {gameState.correctGuessers && gameState.correctGuessers.length > 0 && (
            <div className="mt-4 p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-white/70 mb-2">Correct guessers:</p>
              <div className="flex flex-wrap gap-2">
                {gameState.correctGuessers.map((uid: string) => {
                  const guesser = players.find((p) => p.uid === uid);
                  return guesser ? (
                    <span key={uid} className="text-xs px-2 py-1 bg-christmas-gold/20 rounded">
                      {guesser.name}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function PictionaryHostControls({
  roomId,
  room,
  players,
  lang,
}: {
  roomId: string;
  room: any;
  players: any[];
  lang: 'en' | 'cs';
}) {
  const [busy, setBusy] = useState(false);
  const gameState = room.pictionaryGameState;

  const handleInitAndStart = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await initializePictionaryGame(roomId);
      await startPictionaryRound(roomId);
      toast.success('Game started!');
    } catch (e: any) {
      console.error('Host init/start failed:', e);
      toast.error(e?.message || 'Failed to start game');
    } finally {
      setBusy(false);
    }
  };

  const handleStartRound = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await startPictionaryRound(roomId);
      toast.success('Round started!');
    } catch (e: any) {
      console.error('Host start round failed:', e);
      toast.error(e?.message || 'Failed to start round');
    } finally {
      setBusy(false);
    }
  };

  const handleEndRound = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await endPictionaryRound(roomId);
      toast.success('Round ended!');
    } catch (e: any) {
      console.error('Host end round failed:', e);
      toast.error(e?.message || 'Failed to end round');
    } finally {
      setBusy(false);
    }
  };

  const drawer = gameState?.currentDrawerUid ? players.find((p) => p.uid === gameState.currentDrawerUid) : null;

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-xl mx-auto">
        <div className="card text-center">
          <h1 className="text-2xl font-bold mb-2">🎨 Pictionary (Host)</h1>
          <p className="text-sm text-white/60 mb-6">
            You are the room host on this device. Join from a phone to play; use this screen to start/advance rounds.
          </p>

          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
            <p className="text-white/80 text-sm">
              Players joined: <span className="font-bold">{players.length}</span>
            </p>
            <p className="text-white/80 text-sm">
              Game state: <span className="font-bold">{gameState?.status ?? 'not initialized'}</span>
            </p>
            {gameState && (
              <>
                <p className="text-white/80 text-sm">
                  Round: <span className="font-bold">{gameState.currentRound}</span> /{' '}
                  <span className="font-bold">{gameState.totalRounds}</span>
                </p>
                {drawer && (
                  <p className="text-white/80 text-sm">
                    Current drawer: <span className="font-bold">{drawer.name}</span>
                  </p>
                )}
              </>
            )}
          </div>

          {players.length < 2 ? (
            <p className="text-white/70">Waiting for more players (need at least 2)…</p>
          ) : !gameState ? (
            <button onClick={handleInitAndStart} disabled={busy} className="btn-primary w-full">
              {busy ? t('common.loading', lang) : 'Initialize & Start'}
            </button>
          ) : gameState.status === 'waiting' && gameState.currentRound === 0 ? (
            <button onClick={handleStartRound} disabled={busy} className="btn-primary w-full">
              {busy ? t('common.loading', lang) : 'Start Game'}
            </button>
          ) : gameState.status === 'drawing' ? (
            <button onClick={handleEndRound} disabled={busy} className="btn-secondary w-full">
              {busy ? t('common.loading', lang) : 'End Round'}
            </button>
          ) : gameState.status === 'round_end' ? (
            <button onClick={handleStartRound} disabled={busy} className="btn-primary w-full">
              {busy ? t('common.loading', lang) : 'Next Round'}
            </button>
          ) : (
            <Link href={`/room/${roomId}/tv`} className="btn-secondary inline-block">
              📺 Back to TV
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

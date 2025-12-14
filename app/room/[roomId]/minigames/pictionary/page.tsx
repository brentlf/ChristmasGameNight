'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayer } from '@/lib/hooks/usePlayer';
import { getLanguage, t } from '@/lib/i18n';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { submitPictionaryDrawing } from '@/lib/miniGameEngine';
import { getPictionaryItemById } from '@/lib/miniGameContent';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function PictionaryPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const { room } = useRoom(roomId);
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

  if (!room || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  const selectedIds = room.miniGames?.pictionary?.selectedIds ?? [];
  const progress = player.miniGameProgress?.pictionary;
  const currentIndex = progress?.drawings.length ?? 0;
  const isCompleted = progress?.completedAt !== undefined;

  if (isCompleted) {
    return (
      <main className="min-h-screen px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="game-show-title mb-3">{t('pictionary.completed', lang)}</h1>
            <p className="text-white/80 mb-6">
              {t('pictionary.finalScore', lang)}: <span className="font-bold text-christmas-gold text-3xl">{progress?.score ?? 0}</span> {t('pictionary.points', lang)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/room/${roomId}/play`} className="btn-secondary text-center">
                {t('common.back', lang)}
              </Link>
              <Link href={`/room/${roomId}/results`} className="btn-primary text-center">
                {t('pictionary.viewLeaderboard', lang)}
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (currentIndex >= selectedIds.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  const promptId = selectedIds[currentIndex];
  const item = getPictionaryItemById(promptId);

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">{t('common.error', lang)}</div>
      </div>
    );
  }

  return (
    <PictionaryDrawing
      roomId={roomId}
      uid={player.uid}
      item={item}
      questionIndex={currentIndex}
      totalQuestions={selectedIds.length}
      lang={lang}
    />
  );
}

function PictionaryDrawing({
  roomId,
  uid,
  item,
  questionIndex,
  totalQuestions,
  lang,
}: {
  roomId: string;
  uid: string;
  item: ReturnType<typeof getPictionaryItemById>;
  questionIndex: number;
  totalQuestions: number;
  lang: 'en' | 'cs';
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!item) return null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size - use a fixed size for consistency
    // Mobile-friendly: 800x600 works well for most devices
    const setCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = rect.width;
      const displayHeight = rect.height;
      
      // Set actual size in memory (scaled for device pixel ratio)
      canvas.width = displayWidth * dpr;
      canvas.height = displayHeight * dpr;
      
      // Scale the drawing context to match
      ctx.scale(dpr, dpr);
      
      // Set drawing style
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    };

    setCanvasSize();
    
    // Recalculate on resize
    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    // Since we scaled the context by dpr, we use display coordinates directly
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    // Since we scaled the context by dpr, we use display coordinates directly
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSubmit = async () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Canvas not available');
      return;
    }

    // Check if canvas has any content (not just blank)
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Canvas context not available');
      return;
    }

    // Sample pixels to check if there's any drawing (more efficient than checking all pixels)
    const sampleSize = 50; // Sample every 50th pixel
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let hasContent = false;
    
    for (let i = 0; i < imageData.data.length; i += sampleSize * 4) {
      const alpha = imageData.data[i + 3]; // Alpha channel
      if (alpha > 10) { // Allow some threshold for anti-aliasing
        hasContent = true;
        break;
      }
    }

    if (!hasContent) {
      toast.error(t('pictionary.drawSomething', lang) || 'Please draw something before submitting');
      return;
    }

    let dataUrl: string;
    try {
      dataUrl = canvas.toDataURL('image/png');
      if (!dataUrl || dataUrl.length < 100) {
        toast.error('Failed to generate image. Please try again.');
        return;
      }
    } catch (error) {
      console.error('Error generating data URL:', error);
      toast.error('Failed to generate image. Please try again.');
      return;
    }
    
    // Check if dataUrl is too large (Firestore has 1MB limit per field)
    // A typical canvas dataUrl is around 50-200KB, but we'll check for safety
    const sizeInBytes = (dataUrl.length * 3) / 4; // Approximate size
    if (sizeInBytes > 900000) { // 900KB safety margin
      toast.error(t('pictionary.imageTooLarge', lang) || 'Image is too large. Please try a simpler drawing.');
      return;
    }

    setBusy(true);
    try {
      await submitPictionaryDrawing({
        roomId,
        uid,
        questionIndex,
        dataUrl,
      });
      toast.success(t('common.submit', lang) || 'Drawing submitted!');
      setTimeout(() => {
        if (questionIndex + 1 >= totalQuestions) {
          router.refresh();
        } else {
          clearCanvas();
          router.refresh();
        }
      }, 500);
    } catch (error: any) {
      console.error('Error submitting pictionary drawing:', error);
      toast.error(error.message || t('common.error', lang) || 'Failed to submit drawing');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto">
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t('pictionary.title', lang)}</h1>
            <Link href={`/room/${roomId}/play`} className="btn-secondary text-sm">
              {t('common.back', lang)}
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-sm text-white/70">
              {t('pictionary.questionNumber', lang)} {questionIndex + 1} {t('pictionary.of', lang)} {totalQuestions}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            {t('pictionary.drawPrompt', lang)}: <span className="text-christmas-gold">{item.prompt[lang]}</span>
          </h2>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 mb-4">
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
          </div>

          <div className="flex gap-3">
            <button
              className="btn-secondary flex-1"
              onClick={clearCanvas}
              disabled={busy}
              type="button"
            >
              {t('pictionary.clear', lang)}
            </button>
            <button
              className="btn-primary flex-1"
              onClick={handleSubmit}
              disabled={busy}
            >
              {busy ? t('common.loading', lang) : t('pictionary.submit', lang)}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

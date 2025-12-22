'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayer } from '@/lib/hooks/usePlayer';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { getLanguage, t } from '@/lib/i18n';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { submitTriviaAnswer } from '@/lib/miniGameEngine';
import { useTriviaItem } from '@/lib/hooks/useGameContentItem';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { MiniGameAdvanceGate } from '../_components/MiniGameAdvanceGate';
import { useAudio } from '@/lib/contexts/AudioContext';

export default function TriviaPage() {
  const params = useParams();
  const router = useRouter();
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

  if (!room || !player) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  const selectedIds = room.miniGames?.trivia?.selectedIds ?? [];
  const progress = player.miniGameProgress?.trivia;
  
  const isCompleted = progress?.completedAt !== undefined;
  
  // Find the first unanswered question (answer is -1, null, or undefined)
  let currentIndex = 0;
  if (!isCompleted && progress?.answers && progress.answers.length > 0) {
    const firstUnanswered = progress.answers.findIndex((a, idx) => 
      idx < selectedIds.length && (a === undefined || a === null || a === -1)
    );
    currentIndex = firstUnanswered >= 0 ? firstUnanswered : Math.min(progress.answers.length, selectedIds.length);
  }

  if (isCompleted) {
    return (
      <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <div className="text-5xl md:text-6xl mb-3 md:mb-4">🎉</div>
            <h1 className="game-show-title mb-2 md:mb-3 break-words">{t('trivia.completed', lang)}</h1>
            <p className="text-white/80 mb-4 md:mb-6 text-sm md:text-base break-words">
              {t('trivia.finalScore', lang)}: <span className="font-bold text-christmas-gold text-2xl md:text-3xl">{progress?.score ?? 0}</span> {t('trivia.points', lang)}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 md:gap-3 justify-center">
              <Link href={`/room/${roomId}/play`} className="btn-secondary text-center text-sm md:text-base break-words">
                {t('common.back', lang)}
              </Link>
              <Link href={`/room/${roomId}/results`} className="btn-primary text-center text-sm md:text-base break-words">
                {t('trivia.viewLeaderboard', lang)}
              </Link>
            </div>

            <MiniGameAdvanceGate roomId={roomId} room={room} players={players} lang={lang} currentGame="trivia" />
          </div>
        </div>
      </main>
    );
  }

  if (currentIndex >= selectedIds.length) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  const questionId = selectedIds[currentIndex];
  const { item: question, loading } = useTriviaItem(questionId, roomId);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl">{t('common.error', lang)}</div>
      </div>
    );
  }

  return (
    <TriviaQuestion
      roomId={roomId}
      uid={player.uid}
      question={question}
      questionIndex={currentIndex}
      totalQuestions={selectedIds.length}
      lang={lang}
    />
  );
}

function TriviaQuestion({
  roomId,
  uid,
  question,
  questionIndex,
  totalQuestions,
  lang,
}: {
  roomId: string;
  uid: string;
  question: NonNullable<ReturnType<typeof useTriviaItem>['item']>;
  questionIndex: number;
  totalQuestions: number;
  lang: 'en' | 'cs';
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(false);
  const router = useRouter();
  const { playSound, vibrate, device } = useAudio();

  if (!question) return null;

  const handleSubmit = async () => {
    if (selected === null) return;
    playSound('ui.lock_in', { device: 'phone' });
    vibrate(10, { device: 'phone' });
    setBusy(true);
    setLocked(true);
    try {
      const result = await submitTriviaAnswer({
        roomId,
        uid,
        questionIndex,
        selectedIndex: selected,
        lang,
      });
      if (result.correct) {
        toast.success(t('trivia.correct', lang));
        playSound('game.correct', { device: 'phone' });
        vibrate([10, 20, 10], { device: 'phone' });
      } else {
        toast.error(t('trivia.incorrect', lang));
        playSound('game.wrong', { device: 'phone' });
        vibrate([25, 30, 25], { device: 'phone' });
      }
      // Reset selection - the component will automatically update via Firestore listener
      setSelected(null);
    } catch (error: any) {
      toast.error(error.message || t('common.error', lang));
      playSound('ui.error', { device: 'phone' });
      vibrate(20, { device: 'phone' });
    } finally {
      setBusy(false);
      setLocked(false);
    }
  };

  return (
    <main className="min-h-dvh px-3 md:px-4 py-4 md:py-6">
      <div className="max-w-xl mx-auto">
        <div className="card mb-3 md:mb-4 cgn-animate-in">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg md:text-xl font-bold break-words truncate flex-1">{t('trivia.title', lang)}</h1>
            <Link href={`/room/${roomId}/play`} className="btn-secondary text-xs md:text-sm shrink-0 break-words">
              {t('common.back', lang)}
            </Link>
          </div>
          <div className="mt-3 md:mt-4">
            <p className="text-xs md:text-sm text-white/70 break-words">
              {t('trivia.questionNumber', lang)} {questionIndex + 1} {t('trivia.of', lang)} {totalQuestions}
            </p>
          </div>
        </div>

        <div className="card cgn-animate-in">
          <h2 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 break-words">{question.question[lang]}</h2>

          <div className="space-y-2 md:space-y-3">
            {question.options[lang].map((opt: string, idx: number) => (
              <button
                key={idx}
                className={`w-full rounded-xl md:rounded-2xl border p-3 md:p-4 text-left transition disabled:opacity-50 text-xs md:text-sm break-words active:scale-[0.99] ${
                  selected === idx
                    ? 'bg-christmas-gold/25 border-christmas-gold/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                disabled={busy}
                onClick={() => setSelected(idx)}
                type="button"
              >
                <span className="text-white/70 mr-2 shrink-0">{String.fromCharCode(65 + idx)}.</span> <span className="break-words">{opt}</span>
              </button>
            ))}
          </div>

          <button
            className="btn-primary w-full mt-4 md:mt-6 text-sm md:text-base break-words"
            disabled={busy || selected === null}
            onClick={handleSubmit}
          >
            <span className="inline-flex items-center justify-center gap-2">
              {locked && <span className="cgn-pop" aria-hidden="true">✅</span>}
              {busy ? t('common.loading', lang) : locked ? (lang === 'cs' ? 'Zamčeno' : 'Locked') : t('common.submit', lang)}
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}

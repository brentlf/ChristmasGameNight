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
import { getTriviaItemById } from '@/lib/miniGameContent';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { MiniGameAdvanceGate } from '../_components/MiniGameAdvanceGate';

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
      <div className="min-h-screen flex items-center justify-center">
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
      <main className="min-h-screen px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="game-show-title mb-3">{t('trivia.completed', lang)}</h1>
            <p className="text-white/80 mb-6">
              {t('trivia.finalScore', lang)}: <span className="font-bold text-christmas-gold text-3xl">{progress?.score ?? 0}</span> {t('trivia.points', lang)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/room/${roomId}/play`} className="btn-secondary text-center">
                {t('common.back', lang)}
              </Link>
              <Link href={`/room/${roomId}/results`} className="btn-primary text-center">
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">{t('common.loading', lang)}</div>
      </div>
    );
  }

  const questionId = selectedIds[currentIndex];
  const question = getTriviaItemById(questionId);

  if (!question) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
  question: ReturnType<typeof getTriviaItemById>;
  questionIndex: number;
  totalQuestions: number;
  lang: 'en' | 'cs';
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!question) return null;

  const handleSubmit = async () => {
    if (selected === null) return;
    setBusy(true);
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
      } else {
        toast.error(t('trivia.incorrect', lang));
      }
      // Reset selection - the component will automatically update via Firestore listener
      setSelected(null);
    } catch (error: any) {
      toast.error(error.message || t('common.error', lang));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto">
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t('trivia.title', lang)}</h1>
            <Link href={`/room/${roomId}/play`} className="btn-secondary text-sm">
              {t('common.back', lang)}
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-sm text-white/70">
              {t('trivia.questionNumber', lang)} {questionIndex + 1} {t('trivia.of', lang)} {totalQuestions}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-6">{question.question[lang]}</h2>

          <div className="space-y-3">
            {question.options[lang].map((opt, idx) => (
              <button
                key={idx}
                className={`w-full rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
                  selected === idx
                    ? 'bg-christmas-gold/25 border-christmas-gold/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                disabled={busy}
                onClick={() => setSelected(idx)}
                type="button"
              >
                <span className="text-white/70 mr-2">{String.fromCharCode(65 + idx)}.</span> {opt}
              </button>
            ))}
          </div>

          <button
            className="btn-primary w-full mt-6"
            disabled={busy || selected === null}
            onClick={handleSubmit}
          >
            {busy ? t('common.loading', lang) : t('common.submit', lang)}
          </button>
        </div>
      </div>
    </main>
  );
}

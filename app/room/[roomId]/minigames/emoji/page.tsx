'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayer } from '@/lib/hooks/usePlayer';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { getLanguage, t } from '@/lib/i18n';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { submitEmojiAnswer } from '@/lib/miniGameEngine';
import { getEmojiItemById } from '@/lib/miniGameContent';
import { shuffleSeeded, generateSeed } from '@/lib/utils/seededRandom';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { MiniGameAdvanceGate } from '../_components/MiniGameAdvanceGate';

export default function EmojiPage() {
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

  const selectedIds = room.miniGames?.emoji?.selectedIds ?? [];
  const progress = player.miniGameProgress?.emoji;
  
  const isCompleted = progress?.completedAt !== undefined;
  
  // Find the first unanswered question (empty string, null, or undefined)
  let currentIndex = 0;
  if (!isCompleted && progress?.answers && progress.answers.length > 0) {
    const firstUnanswered = progress.answers.findIndex((a, idx) => 
      idx < selectedIds.length && (!a || a.trim() === '')
    );
    currentIndex = firstUnanswered >= 0 ? firstUnanswered : Math.min(progress.answers.length, selectedIds.length);
  }

  if (isCompleted) {
    return (
      <main className="min-h-dvh px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="game-show-title mb-3">{t('emoji.completed', lang)}</h1>
            <p className="text-white/80 mb-6">
              {t('emoji.finalScore', lang)}: <span className="font-bold text-christmas-gold text-3xl">{progress?.score ?? 0}</span> {t('emoji.points', lang)}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/room/${roomId}/play`} className="btn-secondary text-center">
                {t('common.back', lang)}
              </Link>
              <Link href={`/room/${roomId}/results`} className="btn-primary text-center">
                {t('emoji.viewLeaderboard', lang)}
              </Link>
            </div>

            <MiniGameAdvanceGate roomId={roomId} room={room} players={players} lang={lang} currentGame="emoji" />
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
  const item = getEmojiItemById(questionId);

  if (!item) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl">{t('common.error', lang)}</div>
      </div>
    );
  }

  return (
    <EmojiQuestion
      roomId={roomId}
      uid={player.uid}
      item={item}
      questionIndex={currentIndex}
      totalQuestions={selectedIds.length}
      lang={lang}
    />
  );
}

function EmojiQuestion({
  roomId,
  uid,
  item,
  questionIndex,
  totalQuestions,
  lang,
}: {
  roomId: string;
  uid: string;
  item: ReturnType<typeof getEmojiItemById>;
  questionIndex: number;
  totalQuestions: number;
  lang: 'en' | 'cs';
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!item) return null;

  // Combine correct answer with decoy options and shuffle deterministically
  // Use roomId and questionIndex as seed to ensure same order for all players
  const seed = generateSeed(roomId, questionIndex);
  const allOptions = shuffleSeeded([item.correct[lang], ...item.decoyOptions[lang]], seed);

  const handleSubmit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const result = await submitEmojiAnswer({
        roomId,
        uid,
        questionIndex,
        answerText: selected,
        lang,
      });
      if (result.correct) {
        toast.success(t('emoji.correct', lang));
      } else {
        toast.error(t('emoji.incorrect', lang));
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
    <main className="min-h-dvh px-4 py-6 md:py-10">
      <div className="max-w-xl mx-auto">
        <div className="card mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">{t('emoji.title', lang)}</h1>
            <Link href={`/room/${roomId}/play`} className="btn-secondary text-sm">
              {t('common.back', lang)}
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-sm text-white/70">
              {t('emoji.questionNumber', lang)} {questionIndex + 1} {t('emoji.of', lang)} {totalQuestions}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="text-center mb-6">
            <div className="text-8xl mb-4">{item.emoji}</div>
            <p className="text-lg text-white/80">{t('emoji.guess', lang)}</p>
          </div>

          <div className="space-y-3">
            {allOptions.map((opt, idx) => (
              <button
                key={idx}
                className={`w-full rounded-2xl border p-4 text-left transition disabled:opacity-50 ${
                  selected === opt
                    ? 'bg-christmas-gold/25 border-christmas-gold/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                disabled={busy}
                onClick={() => setSelected(opt)}
                type="button"
              >
                {opt}
              </button>
            ))}
          </div>

          <button
            className="btn-primary w-full mt-6"
            disabled={busy || !selected}
            onClick={handleSubmit}
          >
            {busy ? t('common.loading', lang) : t('common.submit', lang)}
          </button>
        </div>
      </div>
    </main>
  );
}

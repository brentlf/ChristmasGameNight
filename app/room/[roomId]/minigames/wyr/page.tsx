'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRoom } from '@/lib/hooks/useRoom';
import { usePlayer } from '@/lib/hooks/usePlayer';
import { usePlayers } from '@/lib/hooks/usePlayers';
import { getLanguage, t } from '@/lib/i18n';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { submitWYRChoice } from '@/lib/miniGameEngine';
import { getWYRItemById } from '@/lib/miniGameContent';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { MiniGameAdvanceGate } from '../_components/MiniGameAdvanceGate';

export default function WYRPage() {
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

  const selectedIds = room.miniGames?.wyr?.selectedIds ?? [];
  const progress = player.miniGameProgress?.wyr;
  
  const isCompleted = progress?.completedAt !== undefined;
  
  // Find the first unanswered question (choice is not 'A' or 'B')
  let currentIndex = 0;
  if (!isCompleted && progress?.choices && progress.choices.length > 0) {
    const firstUnanswered = progress.choices.findIndex((c, idx) => 
      idx < selectedIds.length && (c !== 'A' && c !== 'B')
    );
    currentIndex = firstUnanswered >= 0 ? firstUnanswered : Math.min(progress.choices.length, selectedIds.length);
  }

  if (isCompleted) {
    return (
      <main className="min-h-dvh px-4 py-10">
        <div className="max-w-xl mx-auto">
          <div className="card text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="game-show-title mb-3">{t('wyr.completed', lang)}</h1>
            <p className="text-white/80 mb-6">
              {t('wyr.completedDescription', lang) || 'Thanks for sharing your choices! Check the TV screen to see how everyone answered.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/room/${roomId}/play`} className="btn-secondary text-center">
                {t('common.back', lang)}
              </Link>
              <Link href={`/room/${roomId}/tv`} className="btn-primary text-center">
                📺 {t('race.tv', lang) || 'View TV'}
              </Link>
            </div>

            <MiniGameAdvanceGate roomId={roomId} room={room} players={players} lang={lang} currentGame="wyr" />
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
  const item = getWYRItemById(questionId);

  if (!item) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-2xl">{t('common.error', lang)}</div>
      </div>
    );
  }

  return (
    <WYRQuestion
      roomId={roomId}
      uid={player.uid}
      item={item}
      questionIndex={currentIndex}
      totalQuestions={selectedIds.length}
      lang={lang}
    />
  );
}

function WYRQuestion({
  roomId,
  uid,
  item,
  questionIndex,
  totalQuestions,
  lang,
}: {
  roomId: string;
  uid: string;
  item: ReturnType<typeof getWYRItemById>;
  questionIndex: number;
  totalQuestions: number;
  lang: 'en' | 'cs';
}) {
  const [selected, setSelected] = useState<'A' | 'B' | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  if (!item) return null;

  const handleSubmit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await submitWYRChoice({
        roomId,
        uid,
        questionIndex,
        choice: selected,
      });
      toast.success(t('common.submit', lang));
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
            <h1 className="text-xl font-bold">{t('wyr.title', lang)}</h1>
            <Link href={`/room/${roomId}/play`} className="btn-secondary text-sm">
              {t('common.back', lang)}
            </Link>
          </div>
          <div className="mt-4">
            <p className="text-sm text-white/70">
              {t('wyr.questionNumber', lang)} {questionIndex + 1} {t('wyr.of', lang)} {totalQuestions}
            </p>
          </div>
        </div>

        <div className="card">
          <h2 className="text-2xl font-semibold mb-8 text-center">{item.prompt[lang]}</h2>

          <div className="space-y-4">
            <button
              className={`w-full rounded-2xl border p-6 text-left transition disabled:opacity-50 ${
                selected === 'A'
                  ? 'bg-christmas-gold/25 border-christmas-gold/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              disabled={busy}
              onClick={() => setSelected('A')}
              type="button"
            >
              <div className="text-2xl font-bold mb-2">A</div>
              <div className="text-xl">{item.optionA[lang]}</div>
            </button>

            <button
              className={`w-full rounded-2xl border p-6 text-left transition disabled:opacity-50 ${
                selected === 'B'
                  ? 'bg-christmas-gold/25 border-christmas-gold/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
              disabled={busy}
              onClick={() => setSelected('B')}
              type="button"
            >
              <div className="text-2xl font-bold mb-2">B</div>
              <div className="text-xl">{item.optionB[lang]}</div>
            </button>
          </div>

          <button
            className="btn-primary w-full mt-6"
            disabled={busy || !selected}
            onClick={handleSubmit}
          >
            {busy ? t('common.loading', lang) : t('common.next', lang)}
          </button>
        </div>
      </div>
    </main>
  );
}

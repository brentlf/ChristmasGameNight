import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export type PictionaryGuessDoc = {
  uid: string;
  name: string;
  round: number;
  guess: string;
  createdAt: number;
};

export function usePictionaryGuesses(roomId: string | null, sessionId: string | null) {
  const [guesses, setGuesses] = useState<(PictionaryGuessDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !sessionId) {
      setGuesses([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, 'rooms', roomId, 'sessions', sessionId, 'pictionary', 'live', 'guesses');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(30));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: (PictionaryGuessDoc & { id: string })[] = [];
        snap.forEach((d) => items.push({ id: d.id, ...(d.data() as any) }));
        setGuesses(items);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [roomId, sessionId]);

  return { guesses, loading };
}



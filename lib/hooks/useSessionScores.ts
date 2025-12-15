import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SessionScoreDoc } from '@/lib/sessions/sessionEngine';

export function useSessionScores(roomId: string | null, sessionId: string | null) {
  const [scores, setScores] = useState<SessionScoreDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !sessionId) {
      setScores([]);
      setLoading(false);
      return;
    }

    const ref = collection(db, 'rooms', roomId, 'sessions', sessionId, 'scores');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const items: SessionScoreDoc[] = [];
        snap.forEach((d) => items.push({ ...(d.data() as any), uid: d.id } as SessionScoreDoc));
        setScores(items);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [roomId, sessionId]);

  return { scores, loading };
}



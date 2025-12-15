import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PictionaryLiveDoc } from '@/lib/sessions/pictionaryClient';

export function usePictionaryLive(roomId: string | null, sessionId: string | null) {
  const [live, setLive] = useState<PictionaryLiveDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !sessionId) {
      setLive(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, 'rooms', roomId, 'sessions', sessionId, 'pictionary', 'live');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setLive(snap.exists() ? (snap.data() as any as PictionaryLiveDoc) : null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [roomId, sessionId]);

  return { live, loading };
}



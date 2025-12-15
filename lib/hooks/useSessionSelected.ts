import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SessionGameId } from '@/types';
import type { SessionSelectedDoc } from '@/lib/sessions/sessionEngine';

export function useSessionSelected(roomId: string | null, sessionId: string | null) {
  const [selected, setSelected] = useState<SessionSelectedDoc | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !sessionId) {
      setSelected(null);
      setLoading(false);
      return;
    }

    const ref = doc(db, 'rooms', roomId, 'sessions', sessionId, 'selected', 'selected');
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setSelected(snap.data() as SessionSelectedDoc);
        } else {
          setSelected(null);
        }
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [roomId, sessionId]);

  const gameId: SessionGameId | null = (selected?.gameId as SessionGameId) ?? null;
  const selectedIds = selected?.selectedIds ?? [];

  return { selected, selectedIds, gameId, loading };
}



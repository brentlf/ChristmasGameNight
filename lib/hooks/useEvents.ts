import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { RoomEvent } from '@/types';

export function useEvents(roomId: string | null, max = 20) {
  const [events, setEvents] = useState<RoomEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const ref = collection(db, 'rooms', roomId, 'events');
    const q = query(ref, orderBy('createdAt', 'desc'), limit(max));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: RoomEvent[] = [];
        snap.forEach((d) => list.push({ id: d.id, ...(d.data() as any) }));
        setEvents(list);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [roomId, max]);

  return { events, loading };
}


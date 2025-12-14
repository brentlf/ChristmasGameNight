import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Player } from '@/types';

export function usePlayer(roomId: string | null, playerUid: string | null) {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !playerUid) {
      setLoading(false);
      return;
    }

    const playerRef = doc(db, 'rooms', roomId, 'players', playerUid);
    const unsubscribe = onSnapshot(
      playerRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setPlayer({ uid: snapshot.id, ...snapshot.data() } as Player);
        } else {
          setPlayer(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching player:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId, playerUid]);

  const updatePlayer = async (updates: Partial<Player>) => {
    if (!roomId || !playerUid) return;
    const playerRef = doc(db, 'rooms', roomId, 'players', playerUid);
    await updateDoc(playerRef, updates);
  };

  return { player, loading, updatePlayer };
}


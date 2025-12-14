import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room } from '@/types';

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const roomRef = doc(db, 'rooms', roomId);
    const unsubscribe = onSnapshot(
      roomRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setRoom({ id: snapshot.id, ...snapshot.data() } as Room);
          setError(null);
        } else {
          setError('Room not found');
          setRoom(null);
        }
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  const updateRoom = async (updates: Partial<Room>) => {
    if (!roomId) return;
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, updates);
  };

  return { room, loading, error, updateRoom };
}


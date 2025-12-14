import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Player } from '@/types';

export function usePlayers(roomId: string | null) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    const playersRef = collection(db, 'rooms', roomId, 'players');
    // Avoid requiring a composite Firestore index by only ordering on one field here.
    // We'll do any secondary sorting (like joinedAt) client-side.
    const q = query(playersRef, orderBy('stageIndex', 'desc'));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const playersList: Player[] = [];
        snapshot.forEach((doc) => {
          playersList.push({ uid: doc.id, ...doc.data() } as Player);
        });

        // Stable-ish sorting: stageIndex desc already handled by query; break ties by finishedAt asc, then score desc.
        playersList.sort((a, b) => {
          const aStage = (a as any).stageIndex ?? 0;
          const bStage = (b as any).stageIndex ?? 0;
          if (bStage !== aStage) return bStage - aStage;

          const aFinished = (a as any).finishedAt ?? Number.POSITIVE_INFINITY;
          const bFinished = (b as any).finishedAt ?? Number.POSITIVE_INFINITY;
          if (aFinished !== bFinished) return aFinished - bFinished;

          const aScore = (a as any).score ?? 0;
          const bScore = (b as any).score ?? 0;
          if (bScore !== aScore) return bScore - aScore;

          const aJoined = (a as any).joinedAt ?? 0;
          const bJoined = (b as any).joinedAt ?? 0;
          return aJoined - bJoined;
        });

        setPlayers(playersList);
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching players:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  return { players, loading };
}


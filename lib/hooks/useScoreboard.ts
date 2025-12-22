import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room, ScoreboardPlayer } from '@/types';
import { getPlayerDisplayName } from '@/lib/utils/scoreboard';

export interface ScoreboardPlayerDisplay extends ScoreboardPlayer {
  displayNameWithTag: string;
}

export function useScoreboard(roomId: string | null) {
  const [scoreboard, setScoreboard] = useState<Room['scoreboard'] | null>(null);
  const [loading, setLoading] = useState(true);

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
          const room = { id: snapshot.id, ...(snapshot.data() as any) } as Room;
          setScoreboard(room.scoreboard || null);
        } else {
          setScoreboard(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching scoreboard:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId]);

  // Get sorted players from scoreboard
  const getSortedPlayers = (): ScoreboardPlayerDisplay[] => {
    if (!scoreboard || !scoreboard.players) return [];

    return Object.values(scoreboard.players)
      // RULE: only show players who have scored > 0 points in this scope
      .filter((player) => Number(player.totalPoints ?? 0) > 0)
      .map((player) => ({
        ...player,
        displayNameWithTag: getPlayerDisplayName({
          displayName: player.displayName,
          displayTag: player.displayTag,
        }),
      }))
      .sort((a, b) => {
        // Sort by totalPoints desc, then wins desc, then gamesPlayed desc
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.gamesPlayed - a.gamesPlayed;
      });
  };

  return { scoreboard, loading, getSortedPlayers };
}


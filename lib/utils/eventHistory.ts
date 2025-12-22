import { doc, getDoc, setDoc, getDocs, collection, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Event, EventGroup, GroupHistory, PlayerHistory, EventScoreboard } from '@/types';

/**
 * End an event and record history
 */
export async function endEvent(eventId: string): Promise<void> {
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, {
    status: 'ended',
  } as any);
  
  // Record history
  await recordEventHistory(eventId);
}

/**
 * Record event history when event ends
 */
export async function recordEventHistory(eventId: string): Promise<void> {
  // Get event
  const eventRef = doc(db, 'events', eventId);
  const eventSnap = await getDoc(eventRef);
  if (!eventSnap.exists()) throw new Error('Event not found');
  const event = { id: eventSnap.id, ...(eventSnap.data() as any) } as Event;
  
  if (event.status !== 'ended') {
    throw new Error('Event must be ended before recording history');
  }
  
  // Get final scoreboard
  const eventScoreboardRef = doc(db, 'events', eventId, 'scoreboard', 'main');
  const eventScoreboardSnap = await getDoc(eventScoreboardRef);
  if (!eventScoreboardSnap.exists()) {
    console.warn('Event scoreboard not found, skipping history recording');
    return;
  }
  
  const eventScoreboard = eventScoreboardSnap.data() as EventScoreboard;
  // Convert to array with document IDs as keys
  const familiesArray = Object.entries(eventScoreboard.families).map(([docId, family]) => ({
    ...family,
    groupId: docId, // Document ID is the groupId
  }));
  
  // Sort families by rank
  familiesArray.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.wins - a.wins;
  });
  
  // Get all groups in the event
  const groupsRef = collection(db, 'events', eventId, 'groups');
  const groupsSnapshot = await getDocs(groupsRef);
  
  const dateIso = new Date(event.createdAt).toISOString().split('T')[0];
  
  // Record history for each group
  for (const groupDoc of groupsSnapshot.docs) {
    const groupId = groupDoc.id; // Document ID
    const group = { id: groupId, ...(groupDoc.data() as any) } as EventGroup;
    
    const familyScore = eventScoreboard.families[groupId];
    if (!familyScore) continue; // Skip if no score
    
    // Find rank
    const rank = familiesArray.findIndex((f) => f.groupId === groupId) + 1;
    
    // Calculate breakdown by game from room scoreboard
    const breakdownByGame: Record<string, number> = {};
    
    if (group.currentRoomId) {
      const roomRef = doc(db, 'rooms', group.currentRoomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const room = roomSnap.data() as any;
        const roomScoreboard = room.scoreboard;
        if (roomScoreboard && roomScoreboard.players) {
          // Sum breakdown across all players in the room
          for (const player of Object.values(roomScoreboard.players)) {
            if (player.breakdown) {
              for (const [gameId, points] of Object.entries(player.breakdown)) {
                breakdownByGame[gameId] = (breakdownByGame[gameId] || 0) + points;
              }
            }
          }
        }
      }
    }
    
    // Write group history
    const groupHistoryRef = doc(db, 'groups', groupId, 'history', eventId);
    const groupHistory: GroupHistory = {
      eventId,
      title: event.title,
      dateIso,
      totalPoints: familyScore.totalPoints,
      rank,
      breakdownByGame,
      createdAt: Date.now(),
    };
    await setDoc(groupHistoryRef, groupHistory);
    
    // Record player history for each identity in the group
    const identitiesRef = collection(db, 'groups', groupId, 'identities');
    const identitiesSnapshot = await getDocs(identitiesRef);
    
    for (const identityDoc of identitiesSnapshot.docs) {
      const identityId = identityDoc.id;
      
      // Get player's stats from room scoreboard
      let playerTotalPoints = 0;
      let playerWins = 0;
      let playerGamesPlayed = 0;
      let playerBreakdownByGame: Record<string, number> = {};
      
      if (group.currentRoomId) {
        const roomRef = doc(db, 'rooms', group.currentRoomId);
        const roomSnap = await getDoc(roomRef);
        if (roomSnap.exists()) {
          const room = roomSnap.data() as any;
          const roomScoreboard = room.scoreboard;
          if (roomScoreboard && roomScoreboard.players) {
            const player = roomScoreboard.players[identityId];
            if (player) {
              playerTotalPoints = player.totalPoints;
              playerWins = player.wins;
              playerGamesPlayed = player.gamesPlayed;
              playerBreakdownByGame = { ...player.breakdown };
            }
          }
        }
      }

      // RULE: only persist per-night player history if totalPoints > 0
      // (prevents "joined but inactive" or 0-point players from appearing in past/all-time leaderboards)
      if (Number(playerTotalPoints ?? 0) <= 0) {
        continue;
      }

      // Write player history
      const playerHistoryRef = doc(db, 'groups', groupId, 'identities', identityId, 'history', eventId);
      const playerHistory: PlayerHistory = {
        eventId,
        totalPoints: playerTotalPoints,
        wins: playerWins,
        gamesPlayed: playerGamesPlayed,
        breakdownByGame: playerBreakdownByGame,
        createdAt: Date.now(),
      };
      await setDoc(playerHistoryRef, playerHistory);
    }
  }
}

/**
 * Get group history (all previous events)
 */
export async function getGroupHistory(groupId: string): Promise<GroupHistory[]> {
  const historyRef = collection(db, 'groups', groupId, 'history');
  const historySnapshot = await getDocs(query(historyRef, orderBy('createdAt', 'desc')));
  
  return historySnapshot.docs.map((doc) => ({
    ...(doc.data() as GroupHistory),
  }));
}

/**
 * Get player history (all previous events for a player)
 */
export async function getPlayerHistory(
  groupId: string,
  identityId: string
): Promise<PlayerHistory[]> {
  const historyRef = collection(db, 'groups', groupId, 'identities', identityId, 'history');
  const historySnapshot = await getDocs(query(historyRef, orderBy('createdAt', 'desc')));
  
  return historySnapshot.docs.map((doc) => ({
    ...(doc.data() as PlayerHistory),
  }));
}


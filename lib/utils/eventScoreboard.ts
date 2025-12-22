import { doc, getDoc, runTransaction, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room, RoomScoreboard, EventScoreboard, EventScoreboardFamily } from '@/types';

/**
 * Publish room session scores to event scoreboard (idempotent)
 */
export async function publishRoomSessionToEvent(
  roomId: string,
  sessionId: string
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
  
  if (!room.eventId || !room.groupId) {
    // Room not part of an event, skip
    return;
  }
  
  const eventId = room.eventId;
  const groupId = room.groupId;
  const scoreboard = room.scoreboard;
  
  if (!scoreboard) {
    // No scoreboard data, skip
    return;
  }
  
  const roomSessionKey = `${roomId}_${sessionId}`;
  const eventScoreboardRef = doc(db, 'events', eventId, 'scoreboard', 'main');
  
  return runTransaction(db, async (tx) => {
    const eventScoreboardSnap = await tx.get(eventScoreboardRef);
    
    if (!eventScoreboardSnap.exists()) {
      // Initialize event scoreboard
      const initialScoreboard: EventScoreboard = {
        updatedAt: Date.now(),
        families: {},
        processedRoomSessions: {},
      };
      tx.set(eventScoreboardRef, initialScoreboard);
    }
    
    const eventScoreboard = eventScoreboardSnap.exists()
      ? (eventScoreboardSnap.data() as EventScoreboard)
      : {
          updatedAt: Date.now(),
          families: {},
          processedRoomSessions: {},
        };
    
    // Idempotency check
    if (eventScoreboard.processedRoomSessions[roomSessionKey]) {
      console.log(`Room session ${roomSessionKey} already processed`);
      return;
    }
    
    // Find the session in room scoreboard
    const session = scoreboard.sessionHistory.find((s) => s.sessionId === sessionId);
    if (!session) {
      console.warn(`Session ${sessionId} not found in room scoreboard`);
      return;
    }
    
    // Calculate group totals from session
    let groupTotalPointsDelta = 0;
    let groupWinsDelta = 0;
    let groupGamesPlayedDelta = 0;
    
    // Sum points from all players in the session
    for (const [identityId, points] of Object.entries(session.pointsAwarded)) {
      groupTotalPointsDelta += points;
    }
    
    // Count unique winners
    const uniqueWinners = new Set(session.winners);
    groupWinsDelta = uniqueWinners.size;
    
    // Count participants (one game played per participant)
    groupGamesPlayedDelta = session.pointsAwarded ? Object.keys(session.pointsAwarded).length : 0;
    
    // Update or create family entry
    const families = { ...eventScoreboard.families };
    if (!families[groupId]) {
      // Get group display name (groupId is the document ID)
      const groupRef = doc(db, 'events', eventId, 'groups', groupId);
      const groupSnap = await tx.get(groupRef);
      const groupData = groupSnap.exists() ? (groupSnap.data() as any) : null;
      const groupName = groupData?.displayName || 'Unknown Family';
      
      families[groupId] = {
        groupId,
        displayName: groupName,
        totalPoints: 0,
        wins: 0,
        gamesPlayed: 0,
        lastUpdatedAt: Date.now(),
      };
    }
    
    const family = families[groupId];
    family.totalPoints += groupTotalPointsDelta;
    family.wins += groupWinsDelta;
    family.gamesPlayed += groupGamesPlayedDelta;
    family.lastUpdatedAt = Date.now();
    
    // Mark as processed
    const processedRoomSessions = {
      ...eventScoreboard.processedRoomSessions,
      [roomSessionKey]: true,
    };
    
    // Update event scoreboard
    tx.update(eventScoreboardRef, {
      families,
      processedRoomSessions,
      updatedAt: Date.now(),
    } as any);
  });
}

/**
 * Get event scoreboard with sorted families
 */
export async function getEventScoreboard(eventId: string): Promise<{
  families: Array<EventScoreboardFamily & { rank: number }>;
  individuals?: Array<any>;
}> {
  const eventScoreboardRef = doc(db, 'events', eventId, 'scoreboard', 'main');
  const eventScoreboardSnap = await getDoc(eventScoreboardRef);
  
  if (!eventScoreboardSnap.exists()) {
    return { families: [] };
  }
  
  const eventScoreboard = eventScoreboardSnap.data() as EventScoreboard;
  // Convert object to array, preserving document ID as groupId
  const families = Object.entries(eventScoreboard.families).map(([docId, family]) => ({
    ...family,
    groupId: docId, // Use document ID as groupId
  }));
  
  // Sort by totalPoints desc, then wins desc
  families.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    return b.wins - a.wins;
  });
  
  // Add ranks
  const familiesWithRanks = families.map((family, index) => ({
    ...family,
    rank: index + 1,
  }));
  
  return {
    families: familiesWithRanks,
    individuals: eventScoreboard.individuals
      ? Object.values(eventScoreboard.individuals).sort((a, b) => b.totalPoints - a.totalPoints)
      : undefined,
  };
}


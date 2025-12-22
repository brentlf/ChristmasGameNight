import { doc, getDoc, runTransaction, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Room, RoomScoreboard, ScoreboardPlayer, SessionFinalization, MiniGameType, SessionGameId } from '@/types';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Compute session results from session scores and determine participants
 */
export async function computeSessionResults(params: {
  roomId: string;
  sessionId: string;
  gameId: string;
  activePlayerUids: string[];
}): Promise<SessionFinalization> {
  const { roomId, sessionId, gameId, activePlayerUids } = params;

  // Get room to access identityMap
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
  const identityMap = room.identityMap || {};

  // Get session scores
  const scoresRef = collection(db, 'rooms', roomId, 'sessions', sessionId, 'scores');
  const scoresSnap = await getDocs(scoresRef);
  
  const pointsByIdentityId: Record<string, number> = {};
  const participants: Set<string> = new Set();

  // Convert uid -> playerIdentityId and aggregate points
  scoresSnap.forEach((scoreDoc) => {
    const uid = scoreDoc.id;
    const score = Number((scoreDoc.data() as any)?.score ?? 0);
    const playerIdentityId = identityMap[uid] || uid; // Default to uid if no mapping

    if (score > 0 || activePlayerUids.includes(uid)) {
      // Participant if they have points OR were in activePlayerUids
      participants.add(playerIdentityId);
    }

    pointsByIdentityId[playerIdentityId] = (pointsByIdentityId[playerIdentityId] || 0) + score;
  });

  // Determine winners (highest score)
  const maxPoints = Math.max(...Object.values(pointsByIdentityId), 0);
  const winners = Object.entries(pointsByIdentityId)
    .filter(([_, points]) => points === maxPoints && points > 0)
    .map(([identityId]) => identityId);

  return {
    sessionId,
    gameId,
    endedAt: Date.now(),
    pointsAwarded: pointsByIdentityId,
    winners,
    participants: Array.from(participants),
  };
}

/**
 * Apply session finalization to room scoreboard (idempotent)
 */
export async function applySessionToScoreboard(
  roomId: string,
  finalization: SessionFinalization
): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);

  // Get players outside transaction (can't use getDocs in transaction)
  const playersRef = collection(db, 'rooms', roomId, 'players');
  const playersSnap = await getDocs(playersRef);
  const playersMap = new Map<string, any>();
  playersSnap.forEach((pDoc) => {
    playersMap.set(pDoc.id, { uid: pDoc.id, ...(pDoc.data() as any) });
  });

  return runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;

    // Initialize scoreboard if missing
    // Note: Firestore doesn't support Sets, so we store processedSessions as an array
    const existingProcessed = room.scoreboard?.processedSessions;
    const processedSessions = Array.isArray(existingProcessed) 
      ? existingProcessed 
      : (existingProcessed ? Array.from(existingProcessed as any) : []);
    
    let scoreboard: RoomScoreboard = room.scoreboard || {
      players: {},
      sessionHistory: [],
    };

    // Idempotency check
    if (processedSessions.includes(finalization.sessionId)) {
      console.log(`Session ${finalization.sessionId} already processed, skipping`);
      return;
    }

    // Get identityMap
    const identityMap = room.identityMap || {};

    // Update scoreboard for each participant
    for (const [playerIdentityId, points] of Object.entries(finalization.pointsAwarded)) {
      // Find the current uid for this identity (may have reconnected)
      let currentUid = playerIdentityId;
      for (const [uid, identityId] of Object.entries(identityMap)) {
        if (identityId === playerIdentityId) {
          currentUid = uid;
          break;
        }
      }

      const playerData = playersMap.get(currentUid);
      if (!playerData) {
        console.warn(`Player ${currentUid} not found for identity ${playerIdentityId}`);
        continue;
      }

      // Initialize or update scoreboard entry
      if (!scoreboard.players[playerIdentityId]) {
        const baseEntry: any = {
          playerIdentityId,
          uid: currentUid,
          displayName: playerData.displayName || playerData.name || 'Unknown',
          avatar: playerData.avatar || '🎮',
          totalPoints: 0,
          gamesPlayed: 0,
          wins: 0,
          lastUpdatedAt: Date.now(),
          breakdown: {},
        };
        // Firestore does not allow `undefined` values; only include displayTag when it exists.
        if (typeof playerData.displayTag === 'string' && playerData.displayTag.length > 0) {
          baseEntry.displayTag = playerData.displayTag;
        }
        scoreboard.players[playerIdentityId] = baseEntry as any;
      }

      const entry = scoreboard.players[playerIdentityId];

      // Update entry
      entry.totalPoints += points;
      entry.lastUpdatedAt = Date.now();
      entry.uid = currentUid; // Update to latest uid

      // Only increment gamesPlayed if they participated
      if (finalization.participants.includes(playerIdentityId)) {
        entry.gamesPlayed += 1;
      }

      // Update breakdown
      const gameId = finalization.gameId as SessionGameId;
      if (gameId && gameId !== 'race') {
        entry.breakdown[gameId] = (entry.breakdown[gameId] || 0) + points;
      } else if (gameId === 'race') {
        entry.breakdown.amazing_race = (entry.breakdown.amazing_race || 0) + points;
      }

      // Update wins
      if (finalization.winners.includes(playerIdentityId)) {
        entry.wins += 1;
      }
    }

    // Add to session history
    scoreboard.sessionHistory.push({
      sessionId: finalization.sessionId,
      gameId: finalization.gameId,
      endedAt: finalization.endedAt,
      winners: finalization.winners,
      pointsAwarded: finalization.pointsAwarded,
    });

    // Mark as processed
    processedSessions.push(finalization.sessionId);

    // Update room with new scoreboard (processedSessions stored as array for Firestore)
    // Firestore doesn't allow `undefined` anywhere in the payload (even deep/nested).
    const stripUndefinedDeep = (value: any): any => {
      if (Array.isArray(value)) return value.map(stripUndefinedDeep);
      if (value && typeof value === 'object') {
        const out: any = {};
        for (const [k, v] of Object.entries(value)) {
          if (v === undefined) continue;
          out[k] = stripUndefinedDeep(v);
        }
        return out;
      }
      return value;
    };

    const scoreboardUpdate: any = stripUndefinedDeep({
      scoreboard: {
        players: scoreboard.players,
        sessionHistory: scoreboard.sessionHistory,
        processedSessions: processedSessions, // Already an array
      },
    });

    tx.update(roomRef, scoreboardUpdate);
  });
}

/**
 * Get player identity ID for a given uid (handles reconnect mapping)
 */
export function getPlayerIdentityId(room: Room, uid: string): string {
  return room.identityMap?.[uid] || uid;
}

/**
 * Get display name with tag for rendering
 */
export function getPlayerDisplayName(player: {
  displayName?: string;
  displayTag?: string;
  name?: string; // legacy fallback
}): string {
  const name = player.displayName || player.name || 'Unknown';
  const tag = player.displayTag || '';
  return `${name}${tag}`.trim();
}


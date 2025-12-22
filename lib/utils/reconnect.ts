import { collection, doc, getDoc, getDocs, query, runTransaction, updateDoc, where } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Room, Player } from '@/types';

// Emoji pool for reconnect codes (3 emojis)
const EMOJI_POOL = ['🎄', '🎅', '❄️', '🎁', '🎀', '🎊', '🎉', '🌟', '⭐', '✨', '🔥', '💫', '🎯', '🏆', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎵', '🎶', '🎸', '🎹', '🎺', '🎷', '🥁', '🎲', '🎮', '🕹️'];

/**
 * Generate a unique 4-digit PIN for reconnect code
 */
export async function generateReconnectPin(roomId: string): Promise<string> {
  const playersRef = collection(db, 'rooms', roomId, 'players');
  const playersSnap = await getDocs(playersRef);
  const usedPins = new Set<string>();

  playersSnap.forEach((doc) => {
    const player = doc.data() as Player;
    if (player.playerKey && player.playerKeyType === 'pin') {
      usedPins.add(player.playerKey);
    }
  });

  // Generate unique 4-digit PIN
  let pin: string;
  do {
    pin = Math.floor(1000 + Math.random() * 9000).toString();
  } while (usedPins.has(pin));

  return pin;
}

/**
 * Generate a unique 3-emoji code for reconnect
 */
export async function generateReconnectEmoji(roomId: string): Promise<string> {
  const playersRef = collection(db, 'rooms', roomId, 'players');
  const playersSnap = await getDocs(playersRef);
  const usedCodes = new Set<string>();

  playersSnap.forEach((doc) => {
    const player = doc.data() as Player;
    if (player.playerKey && player.playerKeyType === 'emoji') {
      usedCodes.add(player.playerKey);
    }
  });

  // Generate unique 3-emoji code
  let code: string;
  do {
    const emojis = Array.from({ length: 3 }, () => EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]);
    code = emojis.join('');
  } while (usedCodes.has(code));

  return code;
}

/**
 * Assign reconnect code to a player
 */
export async function assignReconnectCode(
  roomId: string,
  uid: string,
  type: 'pin' | 'emoji' = 'pin'
): Promise<string> {
  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const code = type === 'pin' 
    ? await generateReconnectPin(roomId)
    : await generateReconnectEmoji(roomId);

  await updateDoc(playerRef, {
    playerKey: code,
    playerKeyType: type,
  } as any);

  return code;
}

/**
 * Find player by reconnect code
 */
export async function findPlayerByReconnectCode(
  roomId: string,
  code: string
): Promise<{ uid: string; playerIdentityId: string } | null> {
  const playersRef = collection(db, 'rooms', roomId, 'players');
  const playersSnap = await getDocs(playersRef);

  for (const playerDoc of playersSnap.docs) {
    const player = { uid: playerDoc.id, ...(playerDoc.data() as any) } as Player;
    if (player.playerKey === code) {
      // Get playerIdentityId (defaults to uid if not set)
      const playerIdentityId = player.playerIdentityId || player.uid;
      return { uid: player.uid, playerIdentityId };
    }
  }

  return null;
}

/**
 * Reconnect a player: link new uid to existing playerIdentityId
 */
export async function reconnectPlayer(
  roomId: string,
  reconnectCode: string,
  newUid: string
): Promise<{ success: boolean; playerIdentityId: string }> {
  return runTransaction(db, async (tx) => {
    // Find player with this reconnect code
    const playersRef = collection(db, 'rooms', roomId, 'players');
    const playersSnap = await getDocs(playersRef);
    
    let foundPlayer: { uid: string; playerIdentityId: string } | null = null;
    for (const playerDoc of playersSnap.docs) {
      const player = { uid: playerDoc.id, ...(playerDoc.data() as any) } as Player;
      if (player.playerKey === reconnectCode) {
        const playerIdentityId = player.playerIdentityId || player.uid;
        foundPlayer = { uid: player.uid, playerIdentityId };
        break;
      }
    }

    if (!foundPlayer) {
      throw new Error('Invalid reconnect code');
    }

    // Check if newUid already exists
    const newPlayerRef = doc(db, 'rooms', roomId, 'players', newUid);
    const newPlayerSnap = await tx.get(newPlayerRef);
    
    if (newPlayerSnap.exists()) {
      // Update existing player doc to link to identity
      const newPlayerData = newPlayerSnap.data() as any;
      tx.update(newPlayerRef, {
        playerIdentityId: foundPlayer.playerIdentityId,
        lastSeenAt: Date.now(),
      } as any);
    } else {
      // Create new player doc linked to identity
      // Copy display info from original player
      const originalPlayerRef = doc(db, 'rooms', roomId, 'players', foundPlayer.uid);
      const originalPlayerSnap = await tx.get(originalPlayerRef);
      const originalPlayer = originalPlayerSnap.exists() 
        ? (originalPlayerSnap.data() as any)
        : null;

      const displayName = (originalPlayer?.displayName || originalPlayer?.name || 'Player') as string;
      const displayNameNormalized =
        (originalPlayer?.displayNameNormalized as string | undefined) ?? displayName.trim().toLowerCase();

      // Firestore does not allow `undefined` values; only include optional fields when present.
      const newPlayerData: any = {
        uid: newUid,
        playerIdentityId: foundPlayer.playerIdentityId,
        displayName,
        displayNameNormalized,
        avatar: originalPlayer?.avatar || '🎮',
        score: 0,
        joinedAt: originalPlayer?.joinedAt || Date.now(),
        lastSeenAt: Date.now(),
        stageIndex: 0,
        stageState: {},
        ready: false,
      };

      if (typeof originalPlayer?.displayTag === 'string' && originalPlayer.displayTag.length > 0) {
        newPlayerData.displayTag = originalPlayer.displayTag;
      }

      tx.set(newPlayerRef, newPlayerData);
    }

    // Update identityMap in room
    const roomRef = doc(db, 'rooms', roomId);
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
    
    const identityMap = room.identityMap || {};
    identityMap[newUid] = foundPlayer.playerIdentityId;

    tx.update(roomRef, {
      identityMap,
    } as any);

    return { success: true, playerIdentityId: foundPlayer.playerIdentityId };
  });
}


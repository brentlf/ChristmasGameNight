import { collection, addDoc, query, where, getDocs, doc, setDoc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import type { Player, Room, RoomMode, MiniGameType } from '@/types';
import { sha256Hex } from '@/lib/utils/crypto';
import { initializeMiniGameSets } from '@/lib/miniGameEngine';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

async function ensureAuthed() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  if (!auth.currentUser) {
    throw new Error('Unable to authenticate')
  }
  return auth.currentUser
}

export function generateRoomCode(): string {
  return Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
}

export async function createRoom(data: {
  roomMode: RoomMode;
  name: string;
  maxPlayers: number;
  pinEnabled: boolean;
  pin?: string;
  settings?: Partial<Room['settings']>;
  eventsEnabled?: boolean;
  overallScoringEnabled?: boolean;
  overallScoringMode?: 'placements' | 'sumMiniGameScores' | 'hybrid';
  miniGamesEnabled?: MiniGameType[];
}): Promise<string> {
  const user = await ensureAuthed();

  if (data.pinEnabled) {
    if (!data.pin || data.pin.length !== 4 || !/^\d{4}$/.test(data.pin)) {
      throw new Error('PIN must be 4 digits');
    }
  }
  
  let code = generateRoomCode();
  let codeExists = true;
  
  // Ensure unique code
  while (codeExists) {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('code', '==', code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      codeExists = false;
    } else {
      code = generateRoomCode();
    }
  }

  const pinHash = data.pinEnabled && data.pin ? await sha256Hex(data.pin) : undefined;

  const defaultMiniGames: MiniGameType[] = ['trivia', 'emoji', 'wyr', 'pictionary'];
  const effectiveMiniGamesEnabled =
    data.roomMode === 'mini_games' ? (data.miniGamesEnabled && data.miniGamesEnabled.length > 0 ? data.miniGamesEnabled : defaultMiniGames) : undefined;

  const roomData: Omit<Room, 'id'> = {
    code,
    name: data.name,
    pinEnabled: data.pinEnabled,
    ...(data.pinEnabled ? { pinHash } : {}),
    maxPlayers: data.maxPlayers,
    createdAt: Date.now(),
    controllerUid: user.uid,
    status: 'lobby',
    roomMode: data.roomMode,
    raceTrackId: 'christmas_race_v1', // Only used for amazing_race mode
    ...(data.roomMode === 'mini_games' && effectiveMiniGamesEnabled ? { miniGamesEnabled: effectiveMiniGamesEnabled } : {}),
    settings: {
      difficulty: data.settings?.difficulty ?? 'easy',
      allowSkips: data.settings?.allowSkips ?? false,
    },
    eventsEnabled: data.eventsEnabled ?? true,
    overallScoringEnabled: data.overallScoringEnabled ?? false,
    overallScoringMode: data.overallScoringMode ?? 'hybrid',
  };

  const docRef = await addDoc(collection(db, 'rooms'), roomData);
  const roomId = docRef.id;
  
  // Initialize mini game sets only if mini_games mode and games are enabled
  if (data.roomMode === 'mini_games' && effectiveMiniGamesEnabled && effectiveMiniGamesEnabled.length > 0) {
    try {
      await initializeMiniGameSets(roomId, effectiveMiniGamesEnabled);
    } catch (error) {
      console.error('Failed to initialize mini game sets:', error);
      // Continue anyway - mini games can be initialized later
    }
  }
  
  return roomId;
}

export async function findRoomByCode(code: string): Promise<string | null> {
  // Room lookups require auth under our rules.
  await ensureAuthed();
  const roomsRef = collection(db, 'rooms');
  const q = query(roomsRef, where('code', '==', code.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  return snapshot.docs[0].id;
}

export async function joinRoom(roomId: string, playerName: string, avatar: string): Promise<string> {
  const user = await ensureAuthed();
  const playerRef = doc(db, 'rooms', roomId, 'players', user.uid);
  const roomRef = doc(db, 'rooms', roomId);

  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) {
    throw new Error('Room not found');
  }
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
  
  // Check if name is taken
  const playersRef = collection(db, 'rooms', roomId, 'players');
  const snapshot = await getDocs(playersRef);
  let finalName = playerName;
  let counter = 2;
  
  while (snapshot.docs.some(doc => doc.data().name === finalName)) {
    finalName = `${playerName} (${counter})`;
    counter++;
  }

  const playerData: Omit<Player, 'uid'> = {
    name: finalName,
    avatar,
    score: 0,
    joinedAt: Date.now(),
    stageIndex: 0,
    stageState: {},
    lastActiveAt: Date.now(),
    ready: false,
    photoUploaded: false,
  };

  await setDoc(playerRef, playerData);

  // Save name to user profile for future use
  try {
    await saveNameToUserProfile(finalName);
  } catch (error) {
    // Non-critical - continue even if profile save fails
    console.warn('Failed to save name to user profile:', error);
  }

  if (room.status === 'lobby') {
    // Keep room in lobby; player can start their race later.
  }

  // Optional event feed
  if (room.eventsEnabled) {
    try {
      await addDoc(collection(db, 'rooms', roomId, 'events'), {
        type: 'joined',
        playerName: finalName,
        createdAt: Date.now(),
      });
    } catch {
      // ignore
    }
  }

  return user.uid;
}

export async function startRace(roomId: string): Promise<void> {
  await ensureAuthed();
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error('Room not found');
  const room = snap.data() as Room;
  if (room.status !== 'lobby') return;
  await updateDoc(roomRef, { status: 'running', raceStartedAt: Date.now() } as any);
}

export async function validateRoomPin(roomId: string, pin: string): Promise<boolean> {
  await ensureAuthed();
  const roomRef = doc(db, 'rooms', roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error('Room not found');
  const room = snap.data() as Room;
  if (!room.pinEnabled) return true;
  const hash = await sha256Hex(pin);
  return Boolean(room.pinHash && room.pinHash === hash);
}

export async function rolloverRoomWithSamePlayers(oldRoomId: string): Promise<string> {
  const user = await ensureAuthed();
  const oldRoomRef = doc(db, 'rooms', oldRoomId);
  const oldSnap = await getDoc(oldRoomRef);
  if (!oldSnap.exists()) throw new Error('Room not found');
  const oldRoom = { id: oldSnap.id, ...(oldSnap.data() as any) } as Room;

  if (oldRoom.controllerUid !== user.uid) {
    throw new Error('Only the host can start a new night');
  }

  // Create a new room doc with a new join code, but copy settings/pinHash.
  let code = generateRoomCode();
  let codeExists = true;
  while (codeExists) {
    const roomsRef = collection(db, 'rooms');
    const q = query(roomsRef, where('code', '==', code));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      codeExists = false;
    } else {
      code = generateRoomCode();
    }
  }

  const newRoomRef = await addDoc(collection(db, 'rooms'), {
    code,
    name: oldRoom.name,
    pinEnabled: oldRoom.pinEnabled,
    ...(oldRoom.pinHash ? { pinHash: oldRoom.pinHash } : {}),
    maxPlayers: oldRoom.maxPlayers,
    createdAt: Date.now(),
    controllerUid: oldRoom.controllerUid,
    status: 'lobby',
    roomMode: oldRoom.roomMode,
    raceTrackId: oldRoom.raceTrackId ?? 'christmas_race_v1',
    miniGamesEnabled: oldRoom.miniGamesEnabled ?? undefined,
    settings: oldRoom.settings ?? { difficulty: 'easy', allowSkips: false },
    eventsEnabled: oldRoom.eventsEnabled ?? true,
    overallScoringEnabled: oldRoom.overallScoringEnabled ?? false,
    overallScoringMode: oldRoom.overallScoringMode ?? 'hybrid',
  } as any);

  const newRoomId = newRoomRef.id;

  // Copy players to new room (same uid/name/avatar), reset state.
  const playersSnap = await getDocs(collection(db, 'rooms', oldRoomId, 'players'));
  const batch = writeBatch(db);
  playersSnap.docs.forEach((p) => {
    const data = p.data() as any;
    batch.set(doc(db, 'rooms', newRoomId, 'players', p.id), {
      name: data.name,
      avatar: data.avatar,
      score: 0,
      joinedAt: Date.now(),
      stageIndex: 0,
      stageState: {},
      finishedAt: null,
      lastActiveAt: Date.now(),
      ready: false,
      photoUploaded: false,
    } as any);
  });
  await batch.commit();

  // Initialize mini game sets in the new room if needed.
  if (oldRoom.roomMode === 'mini_games' && oldRoom.miniGamesEnabled && oldRoom.miniGamesEnabled.length > 0) {
    try {
      await initializeMiniGameSets(newRoomId, oldRoom.miniGamesEnabled);
    } catch {
      // ignore
    }
  }

  // Mark old room with redirect so clients can auto-hop.
  await updateDoc(oldRoomRef, { redirectRoomId: newRoomId } as any);

  return newRoomId;
}

// User profile functions to track previous names
export interface UserProfile {
  previousNames: string[];
  lastUsedAt?: number;
}

export async function saveNameToUserProfile(name: string): Promise<void> {
  const user = await ensureAuthed();
  const userProfileRef = doc(db, 'users', user.uid);
  const profileSnap = await getDoc(userProfileRef);
  
  const trimmedName = name.trim();
  if (!trimmedName) return;
  
  if (profileSnap.exists()) {
    const currentProfile = profileSnap.data() as UserProfile;
    const previousNames = currentProfile.previousNames || [];
    
    // Add name if it's not already in the list (case-insensitive)
    const nameLower = trimmedName.toLowerCase();
    if (!previousNames.some(n => n.toLowerCase() === nameLower)) {
      // Add to beginning and limit to last 10 names
      const updatedNames = [trimmedName, ...previousNames].slice(0, 10);
      await updateDoc(userProfileRef, {
        previousNames: updatedNames,
        lastUsedAt: Date.now(),
      });
    } else {
      // Just update lastUsedAt
      await updateDoc(userProfileRef, {
        lastUsedAt: Date.now(),
      });
    }
  } else {
    // Create new profile
    const newProfile: UserProfile = {
      previousNames: [trimmedName],
      lastUsedAt: Date.now(),
    };
    await setDoc(userProfileRef, newProfile);
  }
}

export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const user = await ensureAuthed();
    const userProfileRef = doc(db, 'users', user.uid);
    const profileSnap = await getDoc(userProfileRef);
    
    if (profileSnap.exists()) {
      return profileSnap.data() as UserProfile;
    }
    return null;
  } catch {
    return null;
  }
}


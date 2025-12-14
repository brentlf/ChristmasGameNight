import { collection, addDoc, query, where, getDocs, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
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
    ...(data.roomMode === 'mini_games' && data.miniGamesEnabled ? { miniGamesEnabled: data.miniGamesEnabled } : {}),
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
  if (data.roomMode === 'mini_games' && data.miniGamesEnabled && data.miniGamesEnabled.length > 0) {
    try {
      await initializeMiniGameSets(roomId, data.miniGamesEnabled);
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
    photoUploaded: false,
  };

  await setDoc(playerRef, playerData);

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


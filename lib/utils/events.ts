import { collection, addDoc, doc, getDoc, getDocs, query, where, setDoc, updateDoc, runTransaction } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import type { Event, EventGroup, EventMembership, PlayerIdentity, Room } from '@/types';
import { createRoom } from './room';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a device ID and store in localStorage
 */
export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    // Server-side: generate a temporary ID
    return `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  const key = 'christmas_game_device_id';
  let deviceId = localStorage.getItem(key);
  
  if (!deviceId) {
    deviceId = `dev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, deviceId);
  }
  
  return deviceId;
}

/**
 * Generate a human-friendly event code (e.g., "XMAS-7H2K")
 */
function generateEventCode(): string {
  const prefix = 'XMAS';
  const suffix = Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
  return `${prefix}-${suffix}`;
}

/**
 * Generate a group code (e.g., "GRP-A1B2")
 */
function generateGroupCode(): string {
  const prefix = 'GRP';
  const suffix = Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
  return `${prefix}-${suffix}`;
}

/**
 * Ensure user is authenticated (anonymous auth)
 */
async function ensureAuthed() {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
  if (!auth.currentUser) {
    throw new Error('Unable to authenticate');
  }
  return auth.currentUser;
}

/**
 * Create a new event
 */
export async function createEvent(data: {
  title: string;
  defaultLang?: 'en' | 'cs';
  timezone?: string;
  individualLeaderboardEnabled?: boolean;
  autoCreateGroup?: boolean; // If true, automatically create a group and room
  groupName?: string; // Name for auto-created group
}): Promise<{ eventId: string; groupId?: string; roomId?: string }> {
  const deviceId = getOrCreateDeviceId();
  const user = await ensureAuthed();
  
  let eventCode = generateEventCode();
  let codeExists = true;
  
  // Ensure unique event code
  while (codeExists) {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('eventId', '==', eventCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      codeExists = false;
    } else {
      eventCode = generateEventCode();
    }
  }

  const eventData: Omit<Event, 'eventId'> = {
    title: data.title,
    createdAt: Date.now(),
    status: 'lobby',
    defaultLang: data.defaultLang || 'en',
    timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    createdByDeviceId: deviceId,
    individualLeaderboardEnabled: data.individualLeaderboardEnabled || false,
  };

  const docRef = await addDoc(collection(db, 'events'), {
    eventId: eventCode,
    ...eventData,
  });
  const eventDocId = docRef.id;

  // Initialize event scoreboard
  await setDoc(doc(db, 'events', eventDocId, 'scoreboard', 'main'), {
    updatedAt: Date.now(),
    families: {},
    processedRoomSessions: {},
    ...(data.individualLeaderboardEnabled ? { individuals: {} } : {}),
  });

  // Auto-create group and room if requested
  if (data.autoCreateGroup) {
    const groupName = data.groupName || 'My Family';
    const { groupId, roomId } = await createGroup(eventDocId, {
      displayName: groupName,
    });
    return { eventId: eventDocId, groupId, roomId };
  }

  return { eventId: eventDocId };
}

/**
 * Create an event automatically for a hosted session room.
 * This keeps the user-facing flow "Room-first" while still providing a unique eventId
 * for night-scoped scoring/history.
 */
export async function createAutoEventForRoom(params: {
  roomId: string;
  title: string;
  defaultLang?: 'en' | 'cs';
  timezone?: string;
  individualLeaderboardEnabled?: boolean;
}): Promise<{ eventDocId: string; eventCode: string }> {
  const deviceId = getOrCreateDeviceId();
  await ensureAuthed();

  let eventCode = generateEventCode();
  let codeExists = true;
  while (codeExists) {
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('eventId', '==', eventCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      codeExists = false;
    } else {
      eventCode = generateEventCode();
    }
  }

  const eventData: Event = {
    eventId: eventCode,
    title: params.title,
    createdAt: Date.now(),
    status: 'live',
    defaultLang: params.defaultLang || 'en',
    timezone: params.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    createdByDeviceId: deviceId,
    individualLeaderboardEnabled: params.individualLeaderboardEnabled || false,
    primaryRoomId: params.roomId,
  };

  const docRef = await addDoc(collection(db, 'events'), eventData);
  const eventDocId = docRef.id;

  // Initialize event scoreboard doc (optional for future use)
  await setDoc(doc(db, 'events', eventDocId, 'scoreboard', 'main'), {
    updatedAt: Date.now(),
    families: {},
    processedRoomSessions: {},
    ...(params.individualLeaderboardEnabled ? { individuals: {} } : {}),
  });

  // Bind the room to this event (groupId intentionally left null so join-by-room-code stays unchanged)
  await updateDoc(doc(db, 'rooms', params.roomId), { eventId: eventDocId } as any);

  return { eventDocId, eventCode };
}

/**
 * Find event by eventId (join code)
 */
export async function findEventByCode(eventCode: string): Promise<string | null> {
  await ensureAuthed();
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('eventId', '==', eventCode.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  return snapshot.docs[0].id; // Return document ID
}

/**
 * Create a family group within an event
 */
export async function createGroup(
  eventId: string,
  data: {
    displayName: string;
    joinCode?: string;
  }
): Promise<{ groupId: string; roomId: string }> {
  // Ensure user is authenticated
  const user = await ensureAuthed();
  if (!user || !user.uid) {
    throw new Error('User not authenticated');
  }
  const deviceId = getOrCreateDeviceId();
  
  // Generate joinCode if not provided
  let joinCode = data.joinCode;
  if (!joinCode) {
    let codeExists = true;
    while (codeExists) {
      joinCode = generateGroupCode();
      const groupsRef = collection(db, 'events', eventId, 'groups');
      const q = query(groupsRef, where('joinCode', '==', joinCode));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        codeExists = false;
      }
    }
  }

  // Create group document - groupId is the document ID, we don't need to store it as a field
  const groupData: Omit<EventGroup, 'groupId'> = {
    displayName: data.displayName,
    createdAt: Date.now(),
    joinCode: joinCode, // Now always defined
    createdByDeviceId: deviceId,
  };

  let groupRef;
  try {
    console.log('Creating group in event:', eventId, 'User:', user.uid);
    groupRef = await addDoc(collection(db, 'events', eventId, 'groups'), groupData);
    console.log('Group created successfully:', groupRef.id);
  } catch (error: any) {
    console.error('Failed to create group:', error);
    console.error('Error code:', error?.code, 'Error message:', error?.message);
    throw new Error(`Failed to create group: ${error?.message || 'Unknown error'}`);
  }
  const groupId = groupRef.id; // Document ID is the groupId

  // Create membership FIRST (before room operations that require it)
  try {
    console.log('Creating membership for user:', user.uid, 'in group:', groupId);
    await setDoc(doc(db, 'events', eventId, 'memberships', user.uid), {
      uid: user.uid,
      eventId,
      groupId,
      joinedAt: Date.now(),
    });
    console.log('Membership created successfully');
  } catch (error: any) {
    console.error('Failed to create membership:', error);
    console.error('Error code:', error?.code, 'Error message:', error?.message);
    // If membership already exists, that's okay - just continue
    if (error?.code !== 'permission-denied') {
      console.warn('Failed to create membership (may already exist):', error);
    } else {
      throw new Error(`Permission denied creating membership: ${error?.message}`);
    }
  }

  // Create a room for this group
  console.log('Creating room for group:', groupId);
  let roomId: string;
  try {
    roomId = await createRoom({
      roomMode: 'mini_games',
      name: `${data.displayName} Room`,
      maxPlayers: 20,
      pinEnabled: false,
      miniGamesEnabled: ['trivia', 'emoji', 'wyr', 'pictionary', 'guess_the_song', 'family_feud', 'bingo'],
      // Create the room already bound to this event/group (private from the start)
      eventId,
      groupId,
    });
    console.log('Room created successfully:', roomId);
  } catch (error: any) {
    console.error('Failed to create room:', error);
    console.error('Error code:', error?.code, 'Error message:', error?.message);
    throw new Error(`Failed to create room: ${error?.message || 'Unknown error'}`);
  }

  // Room is already bound at creation time (eventId/groupId on the room doc)

  // Update group with currentRoomId
  console.log('Updating group with currentRoomId:', roomId);
  try {
    await updateDoc(groupRef, {
      currentRoomId: roomId,
    });
    console.log('Group updated with currentRoomId successfully');
  } catch (error: any) {
    console.error('Failed to update group with currentRoomId:', error);
    console.error('Error code:', error?.code, 'Error message:', error?.message);
    // This is also critical
    throw new Error(`Failed to update group: ${error?.message || 'Unknown error'}`);
  }

  return { groupId, roomId };
}

/**
 * Find group by join code within an event
 */
export async function findGroupByCode(
  eventId: string,
  groupJoinCode: string
): Promise<string | null> {
  await ensureAuthed();
  const groupsRef = collection(db, 'events', eventId, 'groups');
  const q = query(groupsRef, where('joinCode', '==', groupJoinCode.toUpperCase()));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return null;
  return snapshot.docs[0].id; // Return document ID
}

/**
 * Join a group (add membership)
 */
export async function joinGroup(eventId: string, groupId: string): Promise<void> {
  const user = await ensureAuthed();
  
  await setDoc(doc(db, 'events', eventId, 'memberships', user.uid), {
    uid: user.uid,
    eventId,
    groupId,
    joinedAt: Date.now(),
  });
}

/**
 * Get user's group membership for an event
 */
export async function getUserMembership(eventId: string): Promise<EventMembership | null> {
  const user = await ensureAuthed();
  const membershipRef = doc(db, 'events', eventId, 'memberships', user.uid);
  const membershipSnap = await getDoc(membershipRef);
  
  if (!membershipSnap.exists()) return null;
  return { uid: user.uid, ...(membershipSnap.data() as any) } as EventMembership;
}

/**
 * Create or get player identity within a group
 */
export async function createOrGetPlayerIdentity(
  groupId: string,
  data: {
    displayName: string;
    avatar: string;
    reconnectCode?: string;
  }
): Promise<string> {
  const user = await ensureAuthed();
  
  // Check if identity already exists for this user in this group
  const identitiesRef = collection(db, 'groups', groupId, 'identities');
  const q = query(identitiesRef, where('reconnectCode', '==', data.reconnectCode));
  const snapshot = await getDocs(q);
  
  if (snapshot.empty && data.reconnectCode) {
    // Reconnect code provided but not found - invalid
    throw new Error('Invalid reconnect code');
  }
  
  if (!snapshot.empty) {
    // Reconnect: return existing identityId
    return snapshot.docs[0].id;
  }
  
  // Create new identity
  // Check for duplicate names within group
  const allIdentitiesSnap = await getDocs(identitiesRef);
  const displayNameNormalized = data.displayName.trim().toLowerCase();
  const matchingNames = allIdentitiesSnap.docs.filter((doc) => {
    const identity = doc.data() as PlayerIdentity;
    return (identity.displayName || '').trim().toLowerCase() === displayNameNormalized;
  });
  
  let displayName = data.displayName.trim();
  if (matchingNames.length > 0) {
    const existingNumbers = matchingNames
      .map((doc) => {
        const name = doc.data().displayName || '';
        const match = name.match(/^(.+?)\s*\((\d+)\)$/);
        return match ? parseInt(match[2], 10) : 0;
      })
      .filter((n) => n > 0);
    
    const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 2;
    displayName = `${data.displayName.trim()} (${nextNumber})`;
  }
  
  // Generate reconnect code if not provided
  let reconnectCode = data.reconnectCode;
  if (!reconnectCode) {
    // Generate 4-digit PIN
    reconnectCode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Ensure uniqueness within group
    const existingCodes = new Set<string>();
    allIdentitiesSnap.forEach((doc) => {
      const code = doc.data().reconnectCode;
      if (code) existingCodes.add(code);
    });
    
    while (existingCodes.has(reconnectCode)) {
      reconnectCode = Math.floor(1000 + Math.random() * 9000).toString();
    }
  }
  
  const identityData: Omit<PlayerIdentity, 'identityId'> = {
    groupId,
    displayName,
    avatar: data.avatar,
    createdAt: Date.now(),
    lastSeenAt: Date.now(),
    reconnectCode,
  };
  
  const identityRef = await addDoc(identitiesRef, identityData);
  return identityRef.id; // Return identityId (document ID)
}

/**
 * Get group's current room (requires eventId)
 */
export async function getGroupRoom(eventId: string, groupId: string): Promise<string | null> {
  await ensureAuthed();
  const groupRef = doc(db, 'events', eventId, 'groups', groupId);
  const groupSnap = await getDoc(groupRef);
  
  if (!groupSnap.exists()) return null;
  const group = groupSnap.data() as EventGroup;
  return group.currentRoomId || null;
}


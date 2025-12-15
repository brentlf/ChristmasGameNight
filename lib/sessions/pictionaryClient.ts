import { addDoc, collection, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';

export type PictionarySegment = {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  w: number;
  c: string;
};

export type PictionaryLiveDoc = {
  round: number;
  seq: number;
  events: PictionarySegment[];
  checkpoint?: any[];
  updatedAt: number;
};

async function ensureAuthed() {
  // Pictionary runs on phones; if the user reloads or auth isn't ready yet,
  // Firestore writes will fail with "Missing or insufficient permissions".
  if (!auth?.currentUser) {
    await signInAnonymously(auth);
  }
  if (!auth?.currentUser) {
    throw new Error('Not signed in (enable Anonymous Auth in Firebase)');
  }
  return auth.currentUser;
}

export async function writePictionaryLive(params: {
  roomId: string;
  sessionId: string;
  round: number;
  seq: number;
  events: PictionarySegment[];
}): Promise<void> {
  const { roomId, sessionId, round, seq, events } = params;
  await ensureAuthed();
  await setDoc(
    doc(db, 'rooms', roomId, 'sessions', sessionId, 'pictionary', 'live'),
    {
      round,
      seq,
      events,
      checkpoint: [],
      updatedAt: Date.now(),
    } satisfies PictionaryLiveDoc,
    { merge: true }
  );
}

export async function submitPictionaryGuess(params: {
  roomId: string;
  sessionId: string;
  uid: string;
  name: string;
  round: number;
  guess: string;
}): Promise<void> {
  const { roomId, sessionId, uid, name, round, guess } = params;
  await ensureAuthed();
  await addDoc(collection(db, 'rooms', roomId, 'sessions', sessionId, 'pictionary', 'live', 'guesses'), {
    uid,
    name,
    round,
    guess: guess.trim().slice(0, 64),
    createdAt: Date.now(),
  });
  // Keep presence-ish info fresh (so the host can drop truly idle players).
  try {
    await updateDoc(doc(db, 'rooms', roomId, 'players', uid), { lastActiveAt: Date.now() } as any);
  } catch {
    // Best-effort: if rules/environment block presence updates, don't fail the guess send.
  }
}



import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MiniGameType, Room, SessionGameId, SessionStatus } from '@/types';
import { selectRandomItems } from '@/lib/miniGameEngine';
import { triviaChristmasPool } from '@/content/trivia_christmas';
import { emojiMoviesChristmasPool } from '@/content/emoji_movies_christmas';
import { wouldYouRatherChristmasPool } from '@/content/would_you_rather_christmas';
import { pictionaryChristmasPool } from '@/content/pictionary_christmas';
import { fuzzyMatchGuess } from '@/lib/utils/guessing';

export type SessionSelectedDoc = {
  gameId: SessionGameId;
  selectedIds: string[];
  createdAt: number;
};

export type SessionAnswerDoc = {
  uid: string;
  questionIndex: number;
  answer: string | number | null;
  skipped?: boolean;
  submittedAt: number;
};

export type SessionScoreDoc = {
  uid: string;
  score: number;
  // Optional per-question breakdown (kept small; UI may compute client-side instead)
  breakdown?: Record<string, any>;
  updatedAt: number;
};

function getIdPoolForGame(gameId: SessionGameId): string[] {
  if (gameId === 'trivia') return triviaChristmasPool.map((q) => q.id);
  if (gameId === 'emoji') return emojiMoviesChristmasPool.map((q) => q.id);
  if (gameId === 'wyr') return wouldYouRatherChristmasPool.map((q) => q.id);
  if (gameId === 'pictionary') return pictionaryChristmasPool.map((q) => q.id);
  // Pictionary + race are handled elsewhere (pictionary has its own live stream; race has a separate engine)
  return [];
}

export async function startMiniGameSession(params: {
  roomId: string;
  gameId: MiniGameType;
  questionCount?: number;
  secondsPerQuestion?: number;
}): Promise<string> {
  const { roomId, gameId, questionCount = 10, secondsPerQuestion = 45 } = params;

  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;

  // Host Session rooms intentionally allow starting any session game from the TV hub.

  const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
  const allPlayerUids = playersSnap.docs.map((d) => d.id);
  const readyUids = playersSnap.docs.filter((d) => Boolean((d.data() as any)?.ready)).map((d) => d.id);
  const activePlayerUids = (readyUids.length ? readyUids : allPlayerUids).slice(0, 64);

  const poolIds = getIdPoolForGame(gameId);
  if (poolIds.length < questionCount) {
    throw new Error(`Not enough content for ${gameId} (${poolIds.length} available)`);
  }
  const selectedIds = selectRandomItems(poolIds, questionCount);

  const sessionDocRef = await addDoc(collection(db, 'rooms', roomId, 'sessions'), {
    createdAt: Date.now(),
    gameId,
    status: 'intro' satisfies SessionStatus,
    secondsPerQuestion,
  } as any);
  const sessionId = sessionDocRef.id;

  const selectedRef = doc(db, 'rooms', roomId, 'sessions', sessionId, 'selected', 'selected');
  const selectedDoc: SessionSelectedDoc = { gameId, selectedIds, createdAt: Date.now() };
  await setDoc(selectedRef, selectedDoc);

  await updateDoc(roomRef, {
    roomMode: 'mini_games',
    status: 'session_intro',
    currentSession: {
      sessionId,
      status: 'intro',
      gameId,
      questionIndex: 0,
      activePlayerUids,
      answeredUids: [],
      revealData: null,
      questionStartedAt: null,
      questionEndsAt: null,
    },
  } as any);

  return sessionId;
}

export async function controllerStartQuestion(params: {
  roomId: string;
  sessionId: string;
  questionIndex: number;
  secondsPerQuestion?: number;
}): Promise<void> {
  const { roomId, sessionId, questionIndex, secondsPerQuestion = 45 } = params;
  const roomRef = doc(db, 'rooms', roomId);

  const startedAt = Date.now();
  const endsAt = startedAt + Math.max(10, secondsPerQuestion) * 1000;

  await updateDoc(roomRef, {
    status: 'session_in_game',
    'currentSession.sessionId': sessionId,
    'currentSession.status': 'in_game',
    'currentSession.questionIndex': questionIndex,
    'currentSession.questionStartedAt': startedAt,
    'currentSession.questionEndsAt': endsAt,
    'currentSession.answeredUids': [],
    'currentSession.revealData': null,
  } as any);
}

async function ensureSkippedAnswers(params: {
  roomId: string;
  sessionId: string;
  questionIndex: number;
  activePlayerUids: string[];
}): Promise<SessionAnswerDoc[]> {
  const { roomId, sessionId, questionIndex, activePlayerUids } = params;
  const answersRef = collection(db, 'rooms', roomId, 'sessions', sessionId, 'answers');
  const answersSnap = await getDocs(answersRef);
  const answers = answersSnap.docs
    .map((d) => ({ ...(d.data() as any), uid: d.id } as SessionAnswerDoc))
    .filter((a) => a.questionIndex === questionIndex);

  const answeredSet = new Set(answers.map((a) => a.uid));
  const missing = activePlayerUids.filter((uid) => !answeredSet.has(uid));

  if (missing.length) {
    const batch = writeBatch(db);
    const now = Date.now();
    for (const uid of missing) {
      batch.set(doc(db, 'rooms', roomId, 'sessions', sessionId, 'answers', uid), {
        uid,
        questionIndex,
        answer: null,
        skipped: true,
        submittedAt: now,
      } satisfies SessionAnswerDoc);
      answers.push({ uid, questionIndex, answer: null, skipped: true, submittedAt: now });
    }
    await batch.commit();
  }

  return answers;
}

export async function controllerStartPictionaryRound(params: {
  roomId: string;
  sessionId: string;
  roundIndex: number;
  secondsPerRound?: number;
}): Promise<void> {
  const { roomId, sessionId, roundIndex, secondsPerRound = 60 } = params;
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;

  const active = room.currentSession?.activePlayerUids ?? [];
  const drawerUid = active.length ? active[roundIndex % active.length] : null;

  const startedAt = Date.now();
  const endsAt = startedAt + Math.max(10, secondsPerRound) * 1000;

  // Reset live drawing doc for this round.
  await setDoc(doc(db, 'rooms', roomId, 'sessions', sessionId, 'pictionary', 'live'), {
    round: roundIndex,
    seq: 0,
    events: [],
    checkpoint: [],
    updatedAt: Date.now(),
  } as any);

  await updateDoc(roomRef, {
    status: 'session_in_game',
    'currentSession.sessionId': sessionId,
    'currentSession.status': 'in_game',
    'currentSession.gameId': 'pictionary',
    'currentSession.questionIndex': roundIndex,
    'currentSession.drawerUid': drawerUid,
    'currentSession.questionStartedAt': startedAt,
    'currentSession.questionEndsAt': endsAt,
    'currentSession.revealData': null,
    'currentSession.answeredUids': [],
  } as any);
}

export async function controllerPictionaryReveal(params: {
  roomId: string;
  sessionId: string;
  roundIndex: number;
  drawerUid: string | null;
  correctUid?: string | null;
  correctName?: string | null;
  timedOut?: boolean;
}): Promise<void> {
  const { roomId, sessionId, roundIndex, drawerUid, correctUid, correctName, timedOut = false } = params;

  const scoresBaseRef = collection(db, 'rooms', roomId, 'sessions', sessionId, 'scores');
  const scoreBatch = writeBatch(db);
  const now = Date.now();

  // Scoring:
  // - First correct guesser: +15
  // - Drawer: +10 if someone guessed correctly
  if (correctUid) {
    scoreBatch.set(doc(scoresBaseRef, correctUid), { uid: correctUid, score: increment(15), updatedAt: now }, { merge: true });
    if (drawerUid) {
      scoreBatch.set(doc(scoresBaseRef, drawerUid), { uid: drawerUid, score: increment(10), updatedAt: now }, { merge: true });
    }
  }
  await scoreBatch.commit();

  await updateDoc(doc(db, 'rooms', roomId), {
    status: 'session_reveal',
    'currentSession.sessionId': sessionId,
    'currentSession.status': 'reveal',
    'currentSession.gameId': 'pictionary',
    'currentSession.questionIndex': roundIndex,
    'currentSession.drawerUid': drawerUid ?? null,
    'currentSession.revealData': {
      correctUid: correctUid ?? null,
      correctName: correctName ?? null,
      timedOut,
    },
  } as any);
}

export async function isPictionaryGuessCorrect(params: { promptId: string; guess: string }): Promise<boolean> {
  const { promptId, guess } = params;
  const prompt = pictionaryChristmasPool.find((p) => p.id === promptId);
  if (!prompt) return false;
  return fuzzyMatchGuess(guess, prompt.prompt.en) || fuzzyMatchGuess(guess, prompt.prompt.cs);
}

export async function controllerRevealAndScore(params: {
  roomId: string;
  sessionId: string;
  gameId: MiniGameType;
  questionIndex: number;
}): Promise<void> {
  const { roomId, sessionId, gameId, questionIndex } = params;
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
  const active = room.currentSession?.activePlayerUids ?? [];

  const selectedSnap = await getDoc(doc(db, 'rooms', roomId, 'sessions', sessionId, 'selected', 'selected'));
  if (!selectedSnap.exists()) throw new Error('Session selected deck missing');
  const selected = selectedSnap.data() as SessionSelectedDoc;
  const selectedId = selected.selectedIds?.[questionIndex];
  if (!selectedId) throw new Error('Question not found');

  const answers = await ensureSkippedAnswers({ roomId, sessionId, questionIndex, activePlayerUids: active });
  const answeredUids = answers.map((a) => a.uid);

  const scoreBatch = writeBatch(db);
  const scoresBaseRef = collection(db, 'rooms', roomId, 'sessions', sessionId, 'scores');

  let revealData: Record<string, any> = {};

  if (gameId === 'trivia') {
    const q = triviaChristmasPool.find((x) => x.id === selectedId);
    if (!q) throw new Error('Trivia item missing');
    const correctIndex = q.correctIndex;
    const correctUids: string[] = [];
    for (const a of answers) {
      const ok = typeof a.answer === 'number' && a.answer === correctIndex;
      if (ok) correctUids.push(a.uid);
      scoreBatch.set(
        doc(scoresBaseRef, a.uid),
        {
          uid: a.uid,
          score: increment(ok ? 10 : 0),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }
    revealData = {
      correctIndex,
      correctUids,
      correctCount: correctUids.length,
      total: active.length,
    };
  }

  if (gameId === 'emoji') {
    const item = emojiMoviesChristmasPool.find((x) => x.id === selectedId);
    if (!item) throw new Error('Emoji item missing');
    // Accept both locales for correctness; players may answer in either language.
    const accepted = new Set([
      item.correct.en.toLowerCase().trim(),
      item.correct.cs.toLowerCase().trim(),
      ...item.acceptedAliases.en.map((s) => s.toLowerCase().trim()),
      ...item.acceptedAliases.cs.map((s) => s.toLowerCase().trim()),
    ]);

    const correctUids: string[] = [];
    for (const a of answers) {
      const s = typeof a.answer === 'string' ? a.answer.toLowerCase().trim() : '';
      const ok = s ? accepted.has(s) : false;
      if (ok) correctUids.push(a.uid);
      scoreBatch.set(
        doc(scoresBaseRef, a.uid),
        {
          uid: a.uid,
          score: increment(ok ? 10 : 0),
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    }
    revealData = {
      correct: item.correct,
      correctUids,
      correctCount: correctUids.length,
      total: active.length,
    };
  }

  if (gameId === 'wyr') {
    let aCount = 0;
    let bCount = 0;
    for (const ans of answers) {
      if (ans.answer === 'A') aCount++;
      if (ans.answer === 'B') bCount++;
      // No points.
      scoreBatch.set(
        doc(scoresBaseRef, ans.uid),
        { uid: ans.uid, score: increment(0), updatedAt: Date.now() },
        { merge: true }
      );
    }
    const total = aCount + bCount;
    const aPct = total ? Math.round((aCount / total) * 100) : 0;
    const bPct = total ? Math.round((bCount / total) * 100) : 0;
    const close = total > 0 && Math.abs(aPct - bPct) <= 10;
    const dominant = total > 0 && (aPct >= 70 || bPct >= 70);
    revealData = {
      aCount,
      bCount,
      aPct,
      bPct,
      commentary: {
        en: close ? 'Split decision.' : dominant ? 'Unexpectedly unanimous.' : 'Chaos is brewing.',
        cs: close ? 'Rozhodnutí na vážkách.' : dominant ? 'Nečekaně jednotné.' : 'Nastává chaos.',
      },
    };
  }

  await scoreBatch.commit();

  await updateDoc(roomRef, {
    status: 'session_reveal',
    'currentSession.sessionId': sessionId,
    'currentSession.status': 'reveal',
    'currentSession.questionIndex': questionIndex,
    'currentSession.answeredUids': answeredUids,
    'currentSession.revealData': revealData,
  } as any);
}

export async function controllerFinishSession(params: { roomId: string; sessionId: string }): Promise<void> {
  const { roomId, sessionId } = params;
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    roomMode: 'mini_games',
    status: 'between_sessions',
    'currentSession.sessionId': sessionId,
    'currentSession.status': 'finished',
    'currentSession.revealData': null,
  } as any);
}

export async function submitSessionAnswer(params: {
  roomId: string;
  sessionId: string;
  uid: string;
  questionIndex: number;
  answer: string | number | null;
}): Promise<void> {
  const { roomId, sessionId, uid, questionIndex, answer } = params;
  await setDoc(
    doc(db, 'rooms', roomId, 'sessions', sessionId, 'answers', uid),
    {
      uid,
      questionIndex,
      answer,
      submittedAt: Date.now(),
    } satisfies SessionAnswerDoc,
    { merge: true }
  );
  // Keep presence-ish info fresh.
  await updateDoc(doc(db, 'rooms', roomId, 'players', uid), { lastActiveAt: Date.now() } as any);
}



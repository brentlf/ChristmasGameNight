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
import { guessTheSongChristmasPool } from '@/content/guess_the_song_christmas';
import { familyFeudChristmasPool } from '@/content/family_feud_christmas';
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
  if (gameId === 'guess_the_song') return guessTheSongChristmasPool.map((q) => q.id);
  if (gameId === 'family_feud') return familyFeudChristmasPool.map((q) => q.id);
  // Pictionary + race are handled elsewhere (pictionary has its own live stream; race has a separate engine)
  return [];
}

export async function startMiniGameSession(params: {
  roomId: string;
  gameId: MiniGameType;
  questionCount?: number;
  secondsPerQuestion?: number;
  aiEnhanced?: boolean;
  aiTheme?: string;
}): Promise<string> {
  const { roomId, gameId, questionCount = 10, secondsPerQuestion = 45, aiEnhanced = false, aiTheme = 'Christmas' } = params;

  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;

  // Host Session rooms intentionally allow starting any session game from the TV hub.

  const playersSnap = await getDocs(collection(db, 'rooms', roomId, 'players'));
  const allPlayerUids = playersSnap.docs.map((d) => d.id);
  const readyUids = playersSnap.docs.filter((d) => Boolean((d.data() as any)?.ready)).map((d) => d.id);
  const activePlayerUids = (readyUids.length ? readyUids : allPlayerUids).slice(0, 64);
  
  // Pictionary rounds should scale with player count so everyone gets a fair turn:
  // - <3 players: each draws 3x
  // - 4-6 players: each draws 2x
  // - >6 players: each draws 1x
  // (3 players falls into the 4-6 bucket => 2x)
  const effectiveQuestionCount = (() => {
    if (gameId === 'pictionary') {
      const n = activePlayerUids.length;
      const drawsPerPlayer = n < 3 ? 3 : n <= 6 ? 2 : 1;
      return Math.max(1, n * drawsPerPlayer);
    }
    if (gameId === 'family_feud') return 4; // Always 4 rounds for Family Feud (2 per team)
    return questionCount;
  })();

  const sessionDocRef = await addDoc(collection(db, 'rooms', roomId, 'sessions'), {
    createdAt: Date.now(),
    gameId,
    status: 'intro' satisfies SessionStatus,
    secondsPerQuestion,
  } as any);
  const sessionId = sessionDocRef.id;

  let selectedIds: string[];

  if (aiEnhanced && gameId !== 'guess_the_song') {
    // Generate AI content and store in Firestore
    // Note: guess_the_song requires audio files, so skip AI generation for it
    try {
      const { generateAIContentForSession } = await import('@/lib/ai/sessionContentGenerator');
      selectedIds = await generateAIContentForSession(roomId, sessionId, gameId, effectiveQuestionCount, aiTheme);
    } catch (error) {
      console.error('Error generating AI content, falling back to static:', error);
      // Fallback to static content
      const poolIds = getIdPoolForGame(gameId);
      if (poolIds.length < effectiveQuestionCount) {
        throw new Error(`Not enough content for ${gameId} (${poolIds.length} available)`);
      }
      selectedIds = selectRandomItems(poolIds, effectiveQuestionCount);
    }
  } else {
    // Use static content
    const poolIds = getIdPoolForGame(gameId);
    if (poolIds.length < effectiveQuestionCount) {
      throw new Error(`Not enough content for ${gameId} (${poolIds.length} available)`);
    }
    selectedIds = selectRandomItems(poolIds, effectiveQuestionCount);
  }

  const selectedRef = doc(db, 'rooms', roomId, 'sessions', sessionId, 'selected', 'selected');
  const selectedDoc: SessionSelectedDoc = { gameId, selectedIds, createdAt: Date.now() };
  await setDoc(selectedRef, selectedDoc);

  // Family Feud starts with team setup
  const initialStatus = gameId === 'family_feud' ? 'team_setup' : 'intro';
  
  const currentSessionData: any = {
    sessionId,
    status: initialStatus,
    gameId,
    questionIndex: 0,
    activePlayerUids,
    answeredUids: [],
    revealData: null,
    questionStartedAt: null,
    questionEndsAt: null,
  };
  
  // Only add roundIndex for family_feud (Firestore doesn't allow undefined)
  if (gameId === 'family_feud') {
    currentSessionData.roundIndex = 0;
    currentSessionData.activeTeam = 'A';
    currentSessionData.strikes = 0;
    currentSessionData.revealedAnswerIds = [];
    currentSessionData.teamScores = { A: 0, B: 0 };
    currentSessionData.teamMapping = {};
  }
  
  await updateDoc(roomRef, {
    roomMode: 'mini_games',
    status: 'session_intro',
    currentSession: currentSessionData,
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

  if (gameId === 'guess_the_song') {
    const item = guessTheSongChristmasPool.find((x) => x.id === selectedId);
    if (!item) throw new Error('Song item missing');
    const correctIndex = item.correctIndex;
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
      correctAnswer: item.correctAnswer,
      variant: item.variant,
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

// Family Feud: Set team assignments
export async function setFamilyFeudTeams(params: {
  roomId: string;
  sessionId: string;
  teamMapping: Record<string, 'A' | 'B'>;
}): Promise<void> {
  const { roomId, sessionId, teamMapping } = params;
  const roomRef = doc(db, 'rooms', roomId);
  await updateDoc(roomRef, {
    'currentSession.teamMapping': teamMapping,
    'currentSession.status': 'intro',
  } as any);
}

// Family Feud: Start a round
export async function startFamilyFeudRound(params: {
  roomId: string;
  sessionId: string;
  roundIndex: number;
}): Promise<void> {
  const { roomId, sessionId, roundIndex } = params;
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
  
  const currentSession = room.currentSession;
  if (!currentSession || currentSession.gameId !== 'family_feud') throw new Error('Not a Family Feud session');
  
  const activeTeam = roundIndex % 2 === 0 ? 'A' : 'B';
  
  await updateDoc(roomRef, {
    status: 'session_in_game',
    'currentSession.status': 'in_round',
    'currentSession.roundIndex': roundIndex,
    'currentSession.activeTeam': activeTeam,
    'currentSession.strikes': 0,
    'currentSession.revealedAnswerIds': [],
    'currentSession.questionIndex': roundIndex,
    'currentSession.questionStartedAt': Date.now(),
    'currentSession.questionEndsAt': null, // No time limit for Family Feud rounds
  } as any);
}

// Family Feud: Submit an answer
export async function submitFamilyFeudAnswer(params: {
  roomId: string;
  sessionId: string;
  uid: string;
  roundIndex: number;
  answer: string;
}): Promise<{ correct: boolean; answerId?: string; points?: number }> {
  const { roomId, sessionId, uid, roundIndex, answer } = params;
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
  
  const currentSession = room.currentSession;
  if (!currentSession || currentSession.gameId !== 'family_feud') throw new Error('Not a Family Feud session');
  
  // Check if user is on the active team
  const teamMapping = currentSession.teamMapping || {};
  const userTeam = teamMapping[uid];
  const activeTeam = currentSession.activeTeam;
  
  if (userTeam !== activeTeam) {
    throw new Error('Not your team\'s turn');
  }
  
  // Get the question
  const selectedSnap = await getDoc(doc(db, 'rooms', roomId, 'sessions', sessionId, 'selected', 'selected'));
  if (!selectedSnap.exists()) throw new Error('Session selected deck missing');
  const selected = selectedSnap.data() as SessionSelectedDoc;
  const questionId = selected.selectedIds?.[roundIndex];
  if (!questionId) throw new Error('Question not found');
  
  const question = familyFeudChristmasPool.find((q) => q.id === questionId);
  if (!question) throw new Error('Question not found');
  
  // Validate answer directly
  const lang = 'en'; // Could be determined from user preference
  let matchedAnswer: { id: string; points: number } | null = null;
  
  for (const ans of question.answers) {
    const answerText = ans.text[lang] || ans.text.en;
    
    // Direct match
    if (fuzzyMatchGuess(answer, answerText)) {
      matchedAnswer = { id: ans.id, points: ans.points };
      break;
    }
    
    // Check aliases
    if (ans.aliases && ans.aliases.length > 0) {
      for (const alias of ans.aliases) {
        if (fuzzyMatchGuess(answer, alias)) {
          matchedAnswer = { id: ans.id, points: ans.points };
          break;
        }
      }
      if (matchedAnswer) break;
    }
  }
  
  if (matchedAnswer) {
    // Check if already revealed
    const revealedAnswerIds = currentSession.revealedAnswerIds || [];
    if (revealedAnswerIds.includes(matchedAnswer.id)) {
      return { correct: false }; // Already revealed
    }
    
    // Reveal the answer
    const newRevealed = [...revealedAnswerIds, matchedAnswer.id];
    const teamScores = currentSession.teamScores || { A: 0, B: 0 };
    const newTeamScores = {
      ...teamScores,
      [activeTeam]: teamScores[activeTeam] + matchedAnswer.points,
    };
    
    await updateDoc(roomRef, {
      'currentSession.revealedAnswerIds': newRevealed,
      'currentSession.teamScores': newTeamScores,
    } as any);
    
    return { correct: true, answerId: matchedAnswer.id, points: matchedAnswer.points };
  } else {
    // Wrong answer - add strike
    const strikes = (currentSession.strikes || 0) + 1;
    
    if (strikes >= 3) {
      // Three strikes - switch to steal mode
      await updateDoc(roomRef, {
        'currentSession.status': 'steal',
        'currentSession.strikes': strikes,
        'currentSession.activeTeam': activeTeam === 'A' ? 'B' : 'A',
      } as any);
    } else {
      await updateDoc(roomRef, {
        'currentSession.strikes': strikes,
      } as any);
    }
    
    return { correct: false };
  }
}

// Family Feud: Submit steal attempt
export async function submitFamilyFeudSteal(params: {
  roomId: string;
  sessionId: string;
  uid: string;
  roundIndex: number;
  answer: string;
}): Promise<{ correct: boolean; answerId?: string; points?: number; stole: boolean }> {
  const { roomId, sessionId, uid, roundIndex, answer } = params;
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
  
  const currentSession = room.currentSession;
  if (!currentSession || currentSession.gameId !== 'family_feud') throw new Error('Not a Family Feud session');
  
  if (currentSession.status !== 'steal') {
    throw new Error('Not in steal mode');
  }
  
  // Check if user is on the stealing team
  const teamMapping = currentSession.teamMapping || {};
  const userTeam = teamMapping[uid];
  const activeTeam = currentSession.activeTeam;
  
  if (userTeam !== activeTeam) {
    throw new Error('Not your team\'s turn');
  }
  
  // Get the question
  const selectedSnap = await getDoc(doc(db, 'rooms', roomId, 'sessions', sessionId, 'selected', 'selected'));
  if (!selectedSnap.exists()) throw new Error('Session selected deck missing');
  const selected = selectedSnap.data() as SessionSelectedDoc;
  const questionId = selected.selectedIds?.[roundIndex];
  if (!questionId) throw new Error('Question not found');
  
  const question = familyFeudChristmasPool.find((q) => q.id === questionId);
  if (!question) throw new Error('Question not found');
  
  // Validate answer directly
  const lang = 'en';
  const revealedAnswerIds = currentSession.revealedAnswerIds || [];
  let matchedAnswer: { id: string; points: number } | null = null;
  
  for (const ans of question.answers) {
    const answerText = ans.text[lang] || ans.text.en;
    
    // Direct match
    if (fuzzyMatchGuess(answer, answerText)) {
      matchedAnswer = { id: ans.id, points: ans.points };
      break;
    }
    
    // Check aliases
    if (ans.aliases && ans.aliases.length > 0) {
      for (const alias of ans.aliases) {
        if (fuzzyMatchGuess(answer, alias)) {
          matchedAnswer = { id: ans.id, points: ans.points };
          break;
        }
      }
      if (matchedAnswer) break;
    }
  }
  
  if (matchedAnswer && !revealedAnswerIds.includes(matchedAnswer.id)) {
    // Steal successful - give all round points to stealing team
    const roundPoints = question.answers
      .filter((a) => revealedAnswerIds.includes(a.id))
      .reduce((sum, a) => sum + a.points, 0) + matchedAnswer.points;
    
    const teamScores = currentSession.teamScores || { A: 0, B: 0 };
    const newTeamScores = {
      ...teamScores,
      [activeTeam]: teamScores[activeTeam] + roundPoints,
    };
    
    await updateDoc(roomRef, {
      'currentSession.status': 'round_reveal',
      'currentSession.teamScores': newTeamScores,
      'currentSession.revealedAnswerIds': [...revealedAnswerIds, matchedAnswer.id],
    } as any);
    
    return { correct: true, answerId: matchedAnswer.id, points: roundPoints, stole: true };
  } else {
    // Steal failed - original team keeps points
    const roundPoints = question.answers
      .filter((a) => revealedAnswerIds.includes(a.id))
      .reduce((sum, a) => sum + a.points, 0);
    
    const originalTeam = activeTeam === 'A' ? 'B' : 'A';
    const teamScores = currentSession.teamScores || { A: 0, B: 0 };
    const newTeamScores = {
      ...teamScores,
      [originalTeam]: teamScores[originalTeam] + roundPoints,
    };
    
    await updateDoc(roomRef, {
      'currentSession.status': 'round_reveal',
      'currentSession.teamScores': newTeamScores,
    } as any);
    
    return { correct: false, stole: false };
  }
}

// Family Feud: End round and advance
export async function endFamilyFeudRound(params: {
  roomId: string;
  sessionId: string;
  roundIndex: number;
}): Promise<void> {
  const { roomId, sessionId, roundIndex } = params;
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
  
  const currentSession = room.currentSession;
  if (!currentSession || currentSession.gameId !== 'family_feud') throw new Error('Not a Family Feud session');
  
  const selectedSnap = await getDoc(doc(db, 'rooms', roomId, 'sessions', sessionId, 'selected', 'selected'));
  if (!selectedSnap.exists()) throw new Error('Session selected deck missing');
  const selected = selectedSnap.data() as SessionSelectedDoc;
  const totalRounds = selected.selectedIds?.length || 0;
  
  if (roundIndex + 1 >= totalRounds) {
    // Game over
    await updateDoc(roomRef, {
      status: 'session_results',
      'currentSession.status': 'finished',
    } as any);
  } else {
    // Next round
    await startFamilyFeudRound({ roomId, sessionId, roundIndex: roundIndex + 1 });
  }
}



import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  runTransaction,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Firestore } from 'firebase/firestore';
import type { MiniGameType, Room, SessionGameId, SessionStatus } from '@/types';
import { selectRandomItems } from '@/lib/miniGameEngine';
import { triviaChristmasPool } from '@/content/trivia_christmas';
import { emojiMoviesChristmasPool } from '@/content/emoji_movies_christmas';
import { wouldYouRatherChristmasPool } from '@/content/would_you_rather_christmas';
import { pictionaryChristmasPool } from '@/content/pictionary_christmas';
import { guessTheSongChristmasPool } from '@/content/guess_the_song_christmas';
import { familyFeudChristmasPool } from '@/content/family_feud_christmas';
import { fuzzyMatchGuess } from '@/lib/utils/guessing';
import {
  getEmojiItemById,
  getFamilyFeudItemById,
  getPictionaryItemById,
  getTriviaItemById,
} from '@/lib/miniGameContent';
import { computeSessionResults, applySessionToScoreboard } from '@/lib/utils/scoreboard';
import { publishRoomSessionToEvent } from '@/lib/utils/eventScoreboard';

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
  if (gameId === 'bingo') return []; // Bingo doesn't use a content pool
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
  aiDifficulty?: 'easy' | 'medium' | 'hard';
}): Promise<string> {
  const { roomId, gameId, questionCount = 10, secondsPerQuestion = 45, aiEnhanced = false, aiTheme = 'Christmas', aiDifficulty = 'easy' } = params;

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
  let aiGenerated: null | {
    content: any[];
    generatedAt: number;
    theme: string;
    difficulty: 'easy' | 'medium' | 'hard';
  } = null;

  if (aiEnhanced && gameId !== 'guess_the_song') {
    // Generate AI content via server route (keeps OPENAI_API_KEY on server).
    try {
      const theme = (aiTheme || 'Christmas').trim() || 'Christmas';
      const difficulty = aiDifficulty || 'easy';

      const response = await fetch('/api/generate-session-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          sessionId,
          gameId,
          count: effectiveQuestionCount,
          theme,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = (await response.json()) as any;
      selectedIds = Array.isArray(data?.selectedIds) ? data.selectedIds : [];
      aiGenerated = {
        content: Array.isArray(data?.content) ? data.content : [],
        generatedAt: Number(data?.generatedAt ?? Date.now()),
        theme,
        difficulty,
      };

      // Store the full content in Firestore for later retrieval (phones + TV)
      // NOTE: Some deployments have stricter Firestore rules; cache writes may fail.
      // We treat caching as "best effort" so we don't fall back to Christmas content.
      try {
        const cacheKey = `rooms/${roomId}/sessions/${sessionId}/aiContent/${gameId}`;
        await setDoc(
          doc(db, cacheKey),
          {
            content: aiGenerated.content,
            generatedAt: aiGenerated.generatedAt,
            gameId,
            count: selectedIds.length,
            theme,
            difficulty,
          } as any,
          { merge: true }
        );
      } catch (cacheErr) {
        // Don't fail the whole session if caching is blocked by rules.
        console.warn('AI content generated but could not be cached in aiContent/*:', cacheErr);
      }
    } catch (error) {
      console.error('Error generating AI content, falling back to static:', error);
      // Fallback to static content
      if (gameId === 'bingo') {
        selectedIds = [];
      } else {
        const poolIds = getIdPoolForGame(gameId);
        if (poolIds.length < effectiveQuestionCount) {
          throw new Error(`Not enough content for ${gameId} (${poolIds.length} available)`);
        }
        selectedIds = selectRandomItems(poolIds, effectiveQuestionCount);
      }
    }
  } else {
    // Use static content (skip for bingo)
    if (gameId === 'bingo') {
      selectedIds = [];
    } else {
      const poolIds = getIdPoolForGame(gameId);
      if (poolIds.length < effectiveQuestionCount) {
        throw new Error(`Not enough content for ${gameId} (${poolIds.length} available)`);
      }
      selectedIds = selectRandomItems(poolIds, effectiveQuestionCount);
    }
  }

  const selectedRef = doc(db, 'rooms', roomId, 'sessions', sessionId, 'selected', 'selected');
  const selectedDoc: SessionSelectedDoc = { gameId, selectedIds, createdAt: Date.now() };
  await setDoc(selectedRef, selectedDoc);

  // Also store AI content alongside the selected deck as a fallback storage location.
  // This is useful if rules block /aiContent/* writes; clients can still read from selected/selected.
  if (aiGenerated && aiEnhanced) {
    await setDoc(
      selectedRef,
      {
        ai: {
          theme: aiGenerated.theme,
          difficulty: aiGenerated.difficulty,
          generatedAt: aiGenerated.generatedAt,
          content: aiGenerated.content,
        },
      } as any,
      { merge: true }
    );
  }

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
  
  // Bingo-specific initialization
  if (gameId === 'bingo') {
    currentSessionData.drawnBalls = [];
    currentSessionData.startedAt = Date.now();
    // Generate bingo cards for all active players
    await generateBingoCards(roomId, sessionId, activePlayerUids);
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

  // Ensure the drawer rotates each round; if we somehow re-trigger the same round index,
  // bump to the next player so we don't get stuck on the same drawer.
  let drawerIndex = active.length ? roundIndex % active.length : -1;
  const prevDrawerUid = room.currentSession?.drawerUid ?? null;
  if (drawerIndex >= 0 && active.length > 1 && prevDrawerUid) {
    const prevIndex = active.indexOf(prevDrawerUid);
    if (prevIndex >= 0 && drawerIndex === prevIndex) {
      drawerIndex = (prevIndex + 1) % active.length;
    }
  }

  const drawerUid = drawerIndex >= 0 ? active[drawerIndex] : null;

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

  // Scoring (normalized for fairness):
  // - First correct guesser: +12 (normalized from 15)
  // - Drawer: +8 if someone guessed correctly (normalized from 10)
  // Total: 20 points (average 10 per player, matching other games)
  if (correctUid) {
    scoreBatch.set(doc(scoresBaseRef, correctUid), { uid: correctUid, score: increment(12), updatedAt: now }, { merge: true });
    if (drawerUid) {
      scoreBatch.set(doc(scoresBaseRef, drawerUid), { uid: drawerUid, score: increment(8), updatedAt: now }, { merge: true });
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

export async function isPictionaryGuessCorrect(params: {
  promptId: string;
  guess: string;
  roomId?: string;
  sessionId?: string;
}): Promise<boolean> {
  const { promptId, guess, roomId, sessionId } = params;
  const staticPrompt = pictionaryChristmasPool.find((p) => p.id === promptId);
  const prompt =
    staticPrompt ||
    (promptId.startsWith('ai_') && roomId && sessionId
      ? await getPictionaryItemById(promptId, roomId, sessionId)
      : undefined);
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
    const staticQ = triviaChristmasPool.find((x) => x.id === selectedId);
    const q = staticQ || (selectedId.startsWith('ai_') ? await getTriviaItemById(selectedId, roomId, sessionId) : undefined);
    if (!q) throw new Error('Trivia item missing');
    const correctIndex = Number((q as any).correctIndex ?? 0);
    const correctUids: string[] = [];
    for (const a of answers) {
      const ok = typeof a.answer === 'number' && a.answer === correctIndex;
      if (ok) correctUids.push(a.uid);
      // Normalize scores for fairness (Trivia uses 10 points, multiplier = 1.0)
      const points = ok ? 10 : 0;
      scoreBatch.set(
        doc(scoresBaseRef, a.uid),
        {
          uid: a.uid,
          score: increment(points),
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
    const staticItem = emojiMoviesChristmasPool.find((x) => x.id === selectedId);
    const item =
      staticItem || (selectedId.startsWith('ai_') ? await getEmojiItemById(selectedId, roomId, sessionId) : undefined);
    if (!item) throw new Error('Emoji item missing');
    // Accept both locales for correctness; players may answer in either language.
    const aliasEn = Array.isArray((item as any).acceptedAliases?.en) ? (item as any).acceptedAliases.en : [];
    const aliasCs = Array.isArray((item as any).acceptedAliases?.cs) ? (item as any).acceptedAliases.cs : [];
    const accepted = new Set([
      item.correct.en.toLowerCase().trim(),
      item.correct.cs.toLowerCase().trim(),
      ...aliasEn.map((s: any) => String(s ?? '').toLowerCase().trim()).filter(Boolean),
      ...aliasCs.map((s: any) => String(s ?? '').toLowerCase().trim()).filter(Boolean),
    ]);

    const correctUids: string[] = [];
    for (const a of answers) {
      const s = typeof a.answer === 'string' ? a.answer.toLowerCase().trim() : '';
      const ok = s ? accepted.has(s) : false;
      if (ok) correctUids.push(a.uid);
      // Normalize scores for fairness (Trivia uses 10 points, multiplier = 1.0)
      const points = ok ? 10 : 0;
      scoreBatch.set(
        doc(scoresBaseRef, a.uid),
        {
          uid: a.uid,
          score: increment(points),
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
      // Normalize scores for fairness (Trivia uses 10 points, multiplier = 1.0)
      const points = ok ? 10 : 0;
      scoreBatch.set(
        doc(scoresBaseRef, a.uid),
        {
          uid: a.uid,
          score: increment(points),
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
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;

  const currentSession = room.currentSession;
  const gameId = (currentSession?.gameId as MiniGameType | undefined) ?? undefined;
  const activeUids = currentSession?.activePlayerUids ?? [];

  // Idempotency guard: avoid double-counting if the host clicks "Finish" twice
  // or refreshes while the session is finishing.
  if (currentSession?.sessionId === sessionId && (currentSession as any)?.rollupApplied) {
    await updateDoc(roomRef, {
      roomMode: 'mini_games',
      status: 'session_results',
      'currentSession.sessionId': sessionId,
      'currentSession.status': 'finished',
      'currentSession.revealData': null,
    } as any);
    return;
  }

  if (!gameId) {
    throw new Error('Game ID missing from session');
  }

  // Compute session results using new finalization system
  const finalization = await computeSessionResults({
    roomId,
    sessionId,
    gameId,
    activePlayerUids: activeUids,
  });

  // Apply to scoreboard (idempotent)
  await applySessionToScoreboard(roomId, finalization);

  // Publish to event scoreboard if room is part of an event
  try {
    await publishRoomSessionToEvent(roomId, sessionId);
  } catch (error) {
    console.warn('Failed to publish to event scoreboard:', error);
    // Non-critical - continue even if event publishing fails
  }

  // Also update legacy player doc fields for backward compatibility
  const scoresSnap = await getDocs(collection(db, 'rooms', roomId, 'sessions', sessionId, 'scores'));
  const scoreMap = new Map<string, number>();
  scoresSnap.forEach((d) => {
    const s = d.data() as any;
    scoreMap.set(d.id, Number(s?.score ?? 0));
  });

  const now = Date.now();
  const batch = writeBatch(db);

  // Roll up per-session scores into per-player "night total" fields so:
  // - TV sidebar totals update live
  // - /leaderboard (global) can aggregate from player docs (backward compatibility)
  for (const uid of activeUids) {
    const score = Number(scoreMap.get(uid) ?? 0);
    const playerRef = doc(db, 'rooms', roomId, 'players', uid);
    const update: any = {
      totalMiniGameScore: increment(score),
      lastActiveAt: now,
      lastSeenAt: now,
    };
    if (gameId) {
      update[`miniGameProgress.${gameId}.score`] = increment(score);
      update[`miniGameProgress.${gameId}.completedAt`] = now;
    }
    batch.update(playerRef, update);
  }

  // Transition room into a results state (TV + phones show the finale).
  batch.update(roomRef, {
    roomMode: 'mini_games',
    status: 'session_results',
    'currentSession.sessionId': sessionId,
    'currentSession.status': 'finished',
    'currentSession.revealData': null,
    'currentSession.rollupApplied': true,
    'currentSession.rollupAppliedAt': now,
  } as any);

  await batch.commit();
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

  const question =
    familyFeudChristmasPool.find((q) => q.id === questionId) ||
    (questionId.startsWith('ai_') ? await getFamilyFeudItemById(questionId, roomId, sessionId) : undefined);
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

  const question =
    familyFeudChristmasPool.find((q) => q.id === questionId) ||
    (questionId.startsWith('ai_') ? await getFamilyFeudItemById(questionId, roomId, sessionId) : undefined);
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
    // Game over - convert team scores to individual session scores
    const teamScores = currentSession.teamScores || { A: 0, B: 0 };
    const teamMapping = currentSession.teamMapping || {};
    
    // Get all players in the session
    const active = currentSession.activePlayerUids || [];
    
    // Write individual scores based on team scores
    // Each player on a team gets their team's total score
    const scoresBaseRef = collection(db, 'rooms', roomId, 'sessions', sessionId, 'scores');
    const scoreBatch = writeBatch(db);
    const now = Date.now();
    
    // Normalize Family Feud scores (multiply by 0.5 to prevent dominance)
    // Average team score per round is normalized to ~10 points per player
    for (const uid of active) {
      const team = teamMapping[uid];
      if (team === 'A' || team === 'B') {
        const teamScore = teamScores[team] || 0;
        // Normalize: Family Feud scores can be high (e.g., 100+ per round)
        // Scale down to match other games (~10 points per round average)
        const normalizedScore = Math.round(teamScore * 0.5);
        scoreBatch.set(
          doc(scoresBaseRef, uid),
          {
            uid,
            score: normalizedScore,
            updatedAt: now,
          },
          { merge: true }
        );
      } else {
        // Player not on a team - give 0 score
        scoreBatch.set(
          doc(scoresBaseRef, uid),
          {
            uid,
            score: 0,
            updatedAt: now,
          },
          { merge: true }
        );
      }
    }
    
    await scoreBatch.commit();
    
    await updateDoc(roomRef, {
      status: 'session_results',
      'currentSession.status': 'finished',
    } as any);
  } else {
    // Next round
    await startFamilyFeudRound({ roomId, sessionId, roundIndex: roundIndex + 1 });
  }
}

// Bingo: Generate a random bingo card (5x5 grid, center is FREE)
function generateBingoCard(seed: number): { grid: (string | 'FREE')[][]; marked: boolean[][] } {
  const letters = ['B', 'I', 'N', 'G', 'O'];
  const ranges = [
    [1, 15],   // B: 1-15
    [16, 30],  // I: 16-30
    [31, 45],  // N: 31-45
    [46, 60],  // G: 46-60
    [61, 75],  // O: 61-75
  ];
  
  const grid: (string | 'FREE')[][] = [];
  const marked: boolean[][] = [];
  
  // Simple seeded random (linear congruential generator)
  let rng = seed;
  const random = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };
  
  // For each column, create a pool of available numbers and shuffle them
  // This ensures no duplicates within a column
  const columnPools: number[][] = [];
  for (let col = 0; col < 5; col++) {
    const [min, max] = ranges[col];
    const pool: number[] = [];
    for (let num = min; num <= max; num++) {
      pool.push(num);
    }
    // Shuffle the pool using seeded random
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    columnPools[col] = pool;
  }
  
  // Track which number index we're using for each column
  const columnIndices = [0, 0, 0, 0, 0];
  
  for (let row = 0; row < 5; row++) {
    grid[row] = [];
    marked[row] = [];
    for (let col = 0; col < 5; col++) {
      if (row === 2 && col === 2) {
        // Center is FREE
        grid[row][col] = 'FREE';
        marked[row][col] = true; // Pre-marked
      } else {
        // Pick the next unique number from the shuffled pool for this column
        const num = columnPools[col][columnIndices[col]];
        columnIndices[col]++;
        grid[row][col] = `${letters[col]}-${num}`;
        marked[row][col] = false;
      }
    }
  }
  
  return { grid, marked };
}

function flatten5x5<T>(grid: T[][]): T[] {
  const out: T[] = [];
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) out.push(grid[r][c]);
  }
  return out;
}

function unflatten5x5<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let r = 0; r < 5; r++) {
    out[r] = [];
    for (let c = 0; c < 5; c++) out[r][c] = arr[r * 5 + c];
  }
  return out;
}

type BingoCardDoc =
  | {
      version: 2;
      size: 5;
      cells: Array<string | 'FREE'>; // length 25
      marked: boolean[]; // length 25
      createdAt?: number;
    }
  | {
      // legacy in-memory shape (not valid to store in Firestore as nested arrays, but kept for compatibility)
      grid: (string | 'FREE')[][];
      marked: boolean[][];
      createdAt?: number;
    };

function normalizeBingoCardDoc(data: any): { cells: Array<string | 'FREE'>; marked: boolean[] } {
  if (Array.isArray(data?.cells) && Array.isArray(data?.marked)) {
    return { cells: data.cells as Array<string | 'FREE'>, marked: data.marked as boolean[] };
  }
  if (Array.isArray(data?.grid) && Array.isArray(data?.marked)) {
    // best-effort legacy normalization
    const cells = flatten5x5<string | 'FREE'>(data.grid);
    const marked = flatten5x5<boolean>(data.marked);
    return { cells, marked };
  }
  return { cells: [], marked: [] };
}

// Bingo: Generate cards for all players
async function generateBingoCards(roomId: string, sessionId: string, playerUids: string[]): Promise<void> {
  const batch = writeBatch(db);
  const now = Date.now();
  
  for (let i = 0; i < playerUids.length; i++) {
    const uid = playerUids[i];
    // Use sessionId + uid + index as seed for deterministic but unique cards
    const seed = (sessionId + uid + i).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const card = generateBingoCard(seed);
    
    const cardRef = doc(db, 'rooms', roomId, 'sessions', sessionId, 'cards', uid);
    batch.set(cardRef, {
      version: 2,
      size: 5,
      // Firestore does NOT support nested arrays, so store as flat 25-length arrays.
      cells: flatten5x5(card.grid),
      marked: flatten5x5(card.marked),
      createdAt: now,
    } as any);
  }
  
  await batch.commit();
}

// Bingo: Draw next ball
export async function drawBingoBall(params: {
  roomId: string;
  sessionId: string;
}): Promise<{ ball: string; drawnCount: number }> {
  const { roomId, sessionId } = params;
  const roomRef = doc(db, 'rooms', roomId);
  
  return runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
    
    const currentSession = room.currentSession;
    if (!currentSession || currentSession.gameId !== 'bingo') throw new Error('Not a bingo session');
    
    const drawnBalls = currentSession.drawnBalls || [];
    if (drawnBalls.length >= 75) {
      throw new Error('All balls have been drawn');
    }
    
    // Generate all possible balls
    const letters = ['B', 'I', 'N', 'G', 'O'];
    const ranges = [
      [1, 15],   // B: 1-15
      [16, 30],  // I: 16-30
      [31, 45],  // N: 31-45
      [46, 60],  // G: 46-60
      [61, 75],  // O: 61-75
    ];
    
    const allBalls: string[] = [];
    for (let i = 0; i < 5; i++) {
      const [min, max] = ranges[i];
      for (let num = min; num <= max; num++) {
        allBalls.push(`${letters[i]}-${num}`);
      }
    }
    
    // Get available balls (not yet drawn)
    const availableBalls = allBalls.filter((ball) => !drawnBalls.includes(ball));
    
    // Randomly select one
    const randomIndex = Math.floor(Math.random() * availableBalls.length);
    const newBall = availableBalls[randomIndex];
    
    const newDrawnBalls = [...drawnBalls, newBall];
    
    tx.update(roomRef, {
      'currentSession.drawnBalls': newDrawnBalls,
    } as any);
    
    return { ball: newBall, drawnCount: newDrawnBalls.length };
  });
}

// Bingo: Validate a bingo pattern
export function validateBingoPattern(card: BingoCardDoc, drawnBalls: string[]): {
  valid: boolean;
  pattern?: 'horizontal' | 'vertical' | 'diagonal' | 'four_corners';
  winningCells?: Array<{ row: number; col: number }>;
} {
  const normalized = normalizeBingoCardDoc(card);
  const grid = unflatten5x5(normalized.cells);
  const marked = normalized.marked; // flat boolean array of length 25
  const drawnSet = new Set(drawnBalls);
  
  // Helper: check if a cell is marked by the player (using flat index)
  const isMarked = (row: number, col: number): boolean => {
    const idx = row * 5 + col;
    return Boolean(marked[idx]);
  };
  
  // Helper: check if a marked cell is valid (either FREE or in drawnBalls)
  const isValidMarked = (row: number, col: number): boolean => {
    if (!isMarked(row, col)) return true; // Unmarked cells are fine
    const value = grid[row][col];
    return value === 'FREE' || drawnSet.has(value);
  };
  
  // Check horizontal lines
  for (let row = 0; row < 5; row++) {
    let allMarked = true;
    const cells: Array<{ row: number; col: number }> = [];
    for (let col = 0; col < 5; col++) {
      cells.push({ row, col });
      if (!isMarked(row, col)) {
        allMarked = false;
        break;
      }
      // Also verify the marked cell is valid (FREE or in drawnBalls)
      if (!isValidMarked(row, col)) {
        return { valid: false }; // Invalid marking (cheating attempt)
      }
    }
    if (allMarked) {
      return { valid: true, pattern: 'horizontal', winningCells: cells };
    }
  }
  
  // Check vertical lines
  for (let col = 0; col < 5; col++) {
    let allMarked = true;
    const cells: Array<{ row: number; col: number }> = [];
    for (let row = 0; row < 5; row++) {
      cells.push({ row, col });
      if (!isMarked(row, col)) {
        allMarked = false;
        break;
      }
      // Also verify the marked cell is valid (FREE or in drawnBalls)
      if (!isValidMarked(row, col)) {
        return { valid: false }; // Invalid marking (cheating attempt)
      }
    }
    if (allMarked) {
      return { valid: true, pattern: 'vertical', winningCells: cells };
    }
  }
  
  // Check diagonal (top-left to bottom-right)
  let allMarked = true;
  const cells1: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < 5; i++) {
    cells1.push({ row: i, col: i });
    if (!isMarked(i, i)) {
      allMarked = false;
      break;
    }
    // Also verify the marked cell is valid (FREE or in drawnBalls)
    if (!isValidMarked(i, i)) {
      return { valid: false }; // Invalid marking (cheating attempt)
    }
  }
  if (allMarked) {
    return { valid: true, pattern: 'diagonal', winningCells: cells1 };
  }
  
  // Check diagonal (top-right to bottom-left)
  allMarked = true;
  const cells2: Array<{ row: number; col: number }> = [];
  for (let i = 0; i < 5; i++) {
    cells2.push({ row: i, col: 4 - i });
    if (!isMarked(i, 4 - i)) {
      allMarked = false;
      break;
    }
    // Also verify the marked cell is valid (FREE or in drawnBalls)
    if (!isValidMarked(i, 4 - i)) {
      return { valid: false }; // Invalid marking (cheating attempt)
    }
  }
  if (allMarked) {
    return { valid: true, pattern: 'diagonal', winningCells: cells2 };
  }
  
  // Check four corners
  const corners = [
    { row: 0, col: 0 },
    { row: 0, col: 4 },
    { row: 4, col: 0 },
    { row: 4, col: 4 },
  ];
  allMarked = true;
  for (const corner of corners) {
    if (!isMarked(corner.row, corner.col)) {
      allMarked = false;
      break;
    }
    // Also verify the marked cell is valid (FREE or in drawnBalls)
    if (!isValidMarked(corner.row, corner.col)) {
      return { valid: false }; // Invalid marking (cheating attempt)
    }
  }
  if (allMarked) {
    return { valid: true, pattern: 'four_corners', winningCells: corners };
  }
  
  return { valid: false };
}

// Bingo: Claim bingo
export async function claimBingo(params: {
  roomId: string;
  sessionId: string;
  uid: string;
  db?: Firestore; // Optional db instance for server-side use
}): Promise<{ valid: boolean; pattern?: string; error?: string }> {
  const { roomId, sessionId, uid, db: dbInstance } = params;
  const firestoreDb = dbInstance || db; // Use provided db or fall back to client db
  const roomRef = doc(firestoreDb, 'rooms', roomId);
  
  return runTransaction(firestoreDb, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = { id: roomSnap.id, ...(roomSnap.data() as any) } as Room;
    
    const currentSession = room.currentSession;
    if (!currentSession || currentSession.gameId !== 'bingo') throw new Error('Not a bingo session');
    
    // Disallow claims if the session is finished (results phase) or if a claim is currently being shown.
    if (currentSession.status === 'finished') {
      return { valid: false, error: 'Bingo already finished' };
    }
    if (currentSession.status === 'claiming') {
      return { valid: false, error: 'Another player is claiming bingo' };
    }
    
    // Get player's card
    const cardRef = doc(firestoreDb, 'rooms', roomId, 'sessions', sessionId, 'cards', uid);
    const cardSnap = await tx.get(cardRef);
    if (!cardSnap.exists()) throw new Error('Card not found');
    const card = cardSnap.data() as any;
    
    // Get drawn balls
    const drawnBalls = currentSession.drawnBalls || [];
    
    // Validate pattern
    const validation = validateBingoPattern(card as BingoCardDoc, drawnBalls);
    
    if (validation.valid) {
      const mode = (currentSession as any)?.bingoMode === 'top3' ? 'top3' : 'first';
      const existingWinners: string[] = Array.isArray((currentSession as any)?.bingoWinners)
        ? ((currentSession as any).bingoWinners as string[])
        : [];

      // Prevent duplicate claims by same player.
      if (existingWinners.includes(uid)) {
        return { valid: false, error: 'You already claimed bingo' };
      }

      // Determine placement and points.
      const nextWinners = [...existingWinners, uid].slice(0, 3);
      const placement = nextWinners.length; // 1..3
      const pointsByPlace = [100, 60, 40];
      const award = pointsByPlace[Math.max(0, Math.min(pointsByPlace.length - 1, placement - 1))];

      // Set status to claiming so TV can either end now or continue.
      // In top3 mode, TV can auto-resume; on 3rd place it can auto-finish.
      const updatedSession = {
        ...currentSession,
        status: 'claiming' as const,
        bingoMode: mode as 'first' | 'top3',
        bingoWinners: nextWinners,
        bingoLastWinnerUid: uid,
        // Keep legacy single-winner field set to the FIRST winner only (don't overwrite).
        bingoWinnerUid: (currentSession as any)?.bingoWinnerUid || uid,
        revealData: {
          pattern: validation.pattern,
          winningCells: validation.winningCells,
          placement,
          uid,
        },
      } as any;
      tx.update(roomRef, {
        currentSession: updatedSession,
      } as any);
      
      // Award points for this session (per-session scores doc)
      const scoresBaseRef = collection(firestoreDb, 'rooms', roomId, 'sessions', sessionId, 'scores');
      tx.set(doc(scoresBaseRef, uid), {
        uid,
        score: award,
        updatedAt: Date.now(),
      } as any, { merge: true });
      
      return { valid: true, pattern: validation.pattern };
    } else {
      return { valid: false, error: 'Invalid bingo pattern' };
    }
  });
}

// Bingo: Finish game (after winner is confirmed)
export async function finishBingoGame(params: {
  roomId: string;
  sessionId: string;
}): Promise<void> {
  const { roomId, sessionId } = params;
  await controllerFinishSession({ roomId, sessionId });
}



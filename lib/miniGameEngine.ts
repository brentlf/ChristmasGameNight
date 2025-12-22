import { doc, updateDoc, getDoc, collection, getDocs, runTransaction } from 'firebase/firestore';
import { db } from './firebase';
import type { Room, Player, MiniGameType } from '@/types';
import { triviaChristmasPool } from '@/content/trivia_christmas';
import { emojiMoviesChristmasPool } from '@/content/emoji_movies_christmas';
import { wouldYouRatherChristmasPool } from '@/content/would_you_rather_christmas';
import { pictionaryChristmasPool } from '@/content/pictionary_christmas';
import { guessTheSongChristmasPool } from '@/content/guess_the_song_christmas';
import { familyFeudChristmasPool } from '@/content/family_feud_christmas';
import { generateSeed, shuffleSeeded } from '@/lib/utils/seededRandom';

function normalizeForGuessing(input: unknown): string {
  const s = String(input ?? '');
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ') // drop punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeChristmasSynonyms(input: string): string {
  // Very small, intentionally-safe synonym map to make answers "close enough".
  // This is not a full AI solution, but it catches common variants like:
  // "Father Christmas" ~= "Santa", "St Nick" ~= "Santa", etc.
  let s = input;

  // English synonyms
  s = s.replace(/\bfather christmas\b/g, 'santa');
  s = s.replace(/\bsanta claus\b/g, 'santa');
  s = s.replace(/\bst\.?\s*nick\b/g, 'santa');
  s = s.replace(/\bsaint\s+nick\b/g, 'santa');
  s = s.replace(/\bxmas\b/g, 'christmas');

  // Czech-ish helpful mapping (kept minimal to avoid surprising matches)
  // Ježíšek is often used as "Santa" equivalent in Czech families.
  s = s.replace(/\bjez(is|isek|iseku|iskek)\b/g, 'santa'); // very rough after diacritic stripping

  return s;
}

function tokenizeForGuessing(input: string): string[] {
  const stop = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'for', 'in', 'on', 'with']);
  return input
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      // light plural normalization (trees -> tree)
      if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1);
      return t;
    })
    .filter((t) => !stop.has(t));
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 && B.size === 0) return 1;
  let intersection = 0;
  for (const x of A) if (B.has(x)) intersection++;
  const union = A.size + B.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cb = b.charCodeAt(j - 1);
      const cost = ca === cb ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

function fuzzyMatchGuess(guessRaw: unknown, answerRaw: unknown): boolean {
  const guess = canonicalizeChristmasSynonyms(normalizeForGuessing(guessRaw));
  const answer = canonicalizeChristmasSynonyms(normalizeForGuessing(answerRaw));

  if (!guess || !answer) return false;
  if (guess === answer) return true;

  // Substring match for multi-word answers (“gingerbread man” vs “gingerbread”)
  if (guess.length >= 3 && (answer.includes(guess) || guess.includes(answer))) return true;

  const gTokens = tokenizeForGuessing(guess);
  const aTokens = tokenizeForGuessing(answer);
  const tokenSim = jaccardSimilarity(gTokens, aTokens);
  if (tokenSim >= 0.7) return true;

  // Typo tolerance for shorter phrases
  const maxLen = Math.max(guess.length, answer.length);
  const dist = levenshteinDistance(guess, answer);
  const ratio = maxLen === 0 ? 0 : 1 - dist / maxLen;
  if (maxLen <= 25 && ratio >= 0.82) return true;

  return false;
}

// Generate random selection of 10 items from a pool
// Note: This is used during room initialization, so we can use Math.random() here
// as it's called once per room and stored in the room document
export function selectRandomItems<T>(pool: T[], count: number): T[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

// Initialize mini game sets for a room (called once when room is created)
export async function initializeMiniGameSets(roomId: string, enabledGames?: MiniGameType[]) {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  
  if (!roomSnap.exists()) {
    throw new Error('Room not found');
  }

  const room = roomSnap.data() as Room;
  
  // Only initialize if not already set
  if (room.miniGames) {
    return;
  }

  // If enabledGames is provided, only initialize those. Otherwise, initialize all.
  const gamesToInit = enabledGames || ['trivia', 'emoji', 'wyr', 'pictionary', 'guess_the_song', 'family_feud'];

  const miniGames: Partial<Room['miniGames']> = {};
  
  if (gamesToInit.includes('trivia')) {
    miniGames.trivia = { selectedIds: selectRandomItems(triviaChristmasPool, 10).map((item) => item.id) };
  }
  if (gamesToInit.includes('emoji')) {
    miniGames.emoji = { selectedIds: selectRandomItems(emojiMoviesChristmasPool, 10).map((item) => item.id) };
  }
  if (gamesToInit.includes('wyr')) {
    miniGames.wyr = { selectedIds: selectRandomItems(wouldYouRatherChristmasPool, 10).map((item) => item.id) };
  }
  if (gamesToInit.includes('pictionary')) {
    miniGames.pictionary = { selectedIds: selectRandomItems(pictionaryChristmasPool, 10).map((item) => item.id) };
  }
  if (gamesToInit.includes('guess_the_song')) {
    miniGames.guess_the_song = { selectedIds: selectRandomItems(guessTheSongChristmasPool, 10).map((item) => item.id) };
  }
  if (gamesToInit.includes('family_feud')) {
    miniGames.family_feud = { selectedIds: selectRandomItems(familyFeudChristmasPool, 5).map((item) => item.id) };
  }

  await updateDoc(roomRef, { miniGames });
}

// Trivia scoring: +10 per correct, 0 for wrong/skipped, max 100
export function calculateTriviaScore(answers: (number | null)[]): number {
  let score = 0;
  for (const answer of answers) {
    if (answer !== null && answer >= 0) {
      // We'll check correctness when submitting, but for now assume all non-null are correct
      // The actual check happens in submitTriviaAnswer
      score += 10;
    }
  }
  return Math.min(100, score);
}

// Emoji scoring: +10 per correct, 0 for wrong, max 100
export function calculateEmojiScore(answers: string[]): number {
  // Answers are checked for correctness when submitted
  // For now, assume all provided answers are correct (actual check in submitEmojiAnswer)
  return Math.min(100, answers.length * 10);
}

// WYR scoring: No points - just for fun/getting to know everyone
export function calculateWYRScore(choices: ('A' | 'B')[]): number {
  return 0;
}

// Pictionary scoring (old - no longer used, but kept for backward compatibility)
export function calculatePictionaryScore(drawings: Array<{ promptId: string; dataUrl?: string }>): number {
  const drawingCount = drawings.length;
  const baseScore = drawingCount * 2;
  const completionBonus = drawingCount === 10 ? 10 : 0;
  return Math.min(30, baseScore + completionBonus);
}

// Initialize pictionary game (round-based multiplayer)
export async function initializePictionaryGame(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  
  const room = roomSnap.data() as Room;
  
  // Ensure miniGames are initialized if pictionary is enabled
  if (!room.miniGames?.pictionary?.selectedIds || room.miniGames.pictionary.selectedIds.length === 0) {
    if (room.miniGamesEnabled?.includes('pictionary')) {
      await initializeMiniGameSets(roomId, ['pictionary']);
      // Refetch room after initialization
      const updatedSnap = await getDoc(roomRef);
      if (updatedSnap.exists()) {
        Object.assign(room, updatedSnap.data());
      }
    } else {
      throw new Error('Pictionary is not enabled for this room');
    }
  }
  
  const playersRef = collection(db, 'rooms', roomId, 'players');
  const playersSnapshot = await getDocs(playersRef);
  
  const playerUids: string[] = [];
  playersSnapshot.forEach((playerDoc) => {
    playerUids.push(playerDoc.id);
  });
  
  if (playerUids.length < 2) {
    throw new Error('Need at least 2 players to start pictionary');
  }
  
  // Shuffle drawer order deterministically based on roomId
  // This ensures the same order for all players
  const seed = generateSeed(roomId, 0);
  const drawerOrder = shuffleSeeded([...playerUids], seed);
  const totalRounds = drawerOrder.length * 2; // 2 rounds per player

  // Build a deterministic prompt deck (one prompt per round).
  // Prefer unique prompts across the whole game; if the pool is too small, repeat by reshuffling.
  const selectedIds = room.miniGames?.pictionary?.selectedIds ?? [];
  if (selectedIds.length === 0) throw new Error('No prompts available');
  const promptDeck: string[] = [];
  let deckSeedSalt = 1000;
  while (promptDeck.length < totalRounds) {
    const s = generateSeed(roomId, deckSeedSalt++);
    const shuffled = shuffleSeeded([...selectedIds], s);
    for (const id of shuffled) {
      promptDeck.push(id);
      if (promptDeck.length >= totalRounds) break;
    }
  }
  
  const gameState: Room['pictionaryGameState'] = {
    status: 'waiting',
    currentRound: 0,
    currentDrawerUid: null,
    currentPromptId: null,
    roundStartTime: null,
    timeLimit: 60, // 60 seconds per round
    // Firestore does not allow `undefined` values unless ignoreUndefinedProperties is enabled.
    // Use null to represent "no drawing yet".
    drawingData: null,
    guesses: [],
    correctGuessers: [],
    roundScores: {},
    totalScores: {},
    totalRounds,
    drawerOrder,
    promptDeck,
  };
  
  await updateDoc(roomRef, { pictionaryGameState: gameState });
}

// Start a new round
export async function startPictionaryRound(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');

    const room = roomSnap.data() as Room;
    const gameState = room.pictionaryGameState;
    if (!gameState) throw new Error('Game not initialized');

    // If a round is currently active, don't advance.
    if (gameState.status === 'drawing') return;

    const nextRound = gameState.currentRound + 1;
    if (nextRound > gameState.totalRounds) {
      const completedState: Room['pictionaryGameState'] = { ...gameState, status: 'completed' };
      tx.update(roomRef, { pictionaryGameState: completedState });
      return;
    }

    // Get drawer for this round
    // Rotate drawer each round; if something re-triggers the same round, force-advance
    // to the next player so we don't get stuck on one drawer.
    let drawerIndex = (nextRound - 1) % gameState.drawerOrder.length;
    const prevDrawerUid = gameState.currentDrawerUid;
    if (gameState.drawerOrder.length > 1 && prevDrawerUid) {
      const prevIndex = gameState.drawerOrder.indexOf(prevDrawerUid);
      if (prevIndex >= 0 && drawerIndex === prevIndex) {
        drawerIndex = (prevIndex + 1) % gameState.drawerOrder.length;
      }
    }
    const drawerUid = gameState.drawerOrder[drawerIndex];

    // Pick prompt for this round from the pre-generated deck.
    // Fallback to deterministic selection if deck is missing (backward compat).
    let promptId: string | undefined = gameState.promptDeck?.[nextRound - 1];
    if (!promptId) {
      const selectedIds = room.miniGames?.pictionary?.selectedIds ?? [];
      if (selectedIds.length === 0) throw new Error('No prompts available');
      const seed = generateSeed(roomId, nextRound);
      const promptIndex = Math.floor((seed % 1000000) / (1000000 / selectedIds.length)) % selectedIds.length;
      promptId = selectedIds[promptIndex];
    }

    const nextState: Room['pictionaryGameState'] = {
      ...gameState,
      status: 'drawing',
      currentRound: nextRound,
      currentDrawerUid: drawerUid,
      currentPromptId: promptId,
      roundStartTime: Date.now(),
      timeLimit: 60,
      drawingData: null,
      guesses: [],
      correctGuessers: [],
      roundScores: {},
    };

    tx.update(roomRef, { pictionaryGameState: nextState });
  });
}

// Update drawing data (real-time sync)
export async function updatePictionaryDrawing(roomId: string, drawingData: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = roomSnap.data() as Room;
    const gameState = room.pictionaryGameState;
    if (!gameState) throw new Error('Game not initialized');

    // Only update the drawing payload; preserve everything else (guesses/scores).
    const nextState: Room['pictionaryGameState'] = {
      ...gameState,
      drawingData,
    };

    tx.update(roomRef, { pictionaryGameState: nextState });
  });
}

// Submit a guess
export async function submitPictionaryGuess(roomId: string, uid: string, guess: string): Promise<{ correct: boolean; drawerScored: boolean }> {
  const roomRef = doc(db, 'rooms', roomId);
  let correct = false;
  let drawerScored = false;

  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');

    const room = roomSnap.data() as Room;
    const gameState = room.pictionaryGameState;
    if (!gameState || gameState.status !== 'drawing') throw new Error('Game not in drawing state');

    if (gameState.currentDrawerUid === uid) throw new Error('Drawer cannot guess');
    if (!gameState.currentPromptId) throw new Error('No prompt available');

    const prompt = pictionaryChristmasPool.find((p) => p.id === gameState.currentPromptId);
    if (!prompt) throw new Error('Prompt not found');

    correct = fuzzyMatchGuess(guess, prompt.prompt.en) || fuzzyMatchGuess(guess, prompt.prompt.cs);

    const newGuesses = [
      ...(gameState.guesses || []),
      { uid, guess: guess.trim(), timestamp: Date.now() },
    ];

    const newCorrectGuessers = [...(gameState.correctGuessers || [])];
    const nextRoundScores: Record<string, number> = { ...(gameState.roundScores || {}) };
    const nextTotalScores: Record<string, number> = { ...(gameState.totalScores || {}) };

    if (correct && !newCorrectGuessers.includes(uid)) {
      newCorrectGuessers.push(uid);
      nextRoundScores[uid] = (nextRoundScores[uid] || 0) + 1;
      nextTotalScores[uid] = (nextTotalScores[uid] || 0) + 1;

      if (gameState.currentDrawerUid && newCorrectGuessers.length === 1) {
        drawerScored = true;
        const drawerUid = gameState.currentDrawerUid;
        nextRoundScores[drawerUid] = (nextRoundScores[drawerUid] || 0) + 1;
        nextTotalScores[drawerUid] = (nextTotalScores[drawerUid] || 0) + 1;
      }
    }

    const nextState: Room['pictionaryGameState'] = {
      ...gameState,
      guesses: newGuesses,
      correctGuessers: newCorrectGuessers,
      roundScores: nextRoundScores,
      totalScores: nextTotalScores,
    };

    tx.update(roomRef, { pictionaryGameState: nextState });

    // Update guesser's own player doc (allowed by rules) for stats.
    if (correct) {
      const guesserPlayerRef = doc(db, 'rooms', roomId, 'players', uid);
      const guesserSnap = await tx.get(guesserPlayerRef);
      if (guesserSnap.exists()) {
        const guesserPlayer = guesserSnap.data() as Player;
        tx.update(guesserPlayerRef, {
          'miniGameProgress.pictionary.roundsGuessed': (guesserPlayer.miniGameProgress?.pictionary?.roundsGuessed ?? 0) + 1,
        });
      }
    }
  });

  return { correct, drawerScored };
}

// End current round
export async function endPictionaryRound(roomId: string): Promise<void> {
  const roomRef = doc(db, 'rooms', roomId);
  let shouldMarkComplete = false;
  await runTransaction(db, async (tx) => {
    const roomSnap = await tx.get(roomRef);
    if (!roomSnap.exists()) throw new Error('Room not found');
    const room = roomSnap.data() as Room;
    const gameState = room.pictionaryGameState;
    if (!gameState) throw new Error('Game not initialized');

    // If already ended/completed, don't do anything.
    if (gameState.status === 'round_end' || gameState.status === 'completed') return;

    const roundEndState: Room['pictionaryGameState'] = {
      ...gameState,
      status: 'round_end',
    };

    tx.update(roomRef, { pictionaryGameState: roundEndState });
    shouldMarkComplete = gameState.currentRound >= gameState.totalRounds;

    if (shouldMarkComplete) {
      const completedState: Room['pictionaryGameState'] = {
        ...roundEndState,
        status: 'completed',
      };
      tx.update(roomRef, { pictionaryGameState: completedState });
    }
  });

  if (shouldMarkComplete) {
    // Mark all players as completed (best-effort; keep scores on room doc as source of truth).
    const roomSnap = await getDoc(roomRef);
    const room = roomSnap.data() as Room;
    const totals = room?.pictionaryGameState?.totalScores ?? {};

    const playersRef = collection(db, 'rooms', roomId, 'players');
    const playersSnapshot = await getDocs(playersRef);
    await Promise.all(
      playersSnapshot.docs.map((playerDoc) => {
        const player = playerDoc.data() as Player;
        const score = Number(totals[playerDoc.id] ?? 0);
        return updateDoc(playerDoc.ref, {
          'miniGameProgress.pictionary.completedAt': Date.now(),
          'miniGameProgress.pictionary.score': score,
        });
      })
    );
  }
}

// Submit trivia answer
export async function submitTriviaAnswer(params: {
  roomId: string;
  uid: string;
  questionIndex: number;
  selectedIndex: number | null;
  lang: 'en' | 'cs';
}): Promise<{ correct: boolean; score: number }> {
  const { roomId, uid, questionIndex, selectedIndex, lang } = params;
  
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  
  const room = roomSnap.data() as Room;
  const selectedIds = room.miniGames?.trivia?.selectedIds ?? [];
  const questionId = selectedIds[questionIndex];
  
  if (!questionId) throw new Error('Question not found');
  
  const question = triviaChristmasPool.find((q) => q.id === questionId);
  if (!question) throw new Error('Question not found');
  
  const correct = selectedIndex === question.correctIndex;
  
  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) throw new Error('Player not found');
  
  const player = playerSnap.data() as Player;
  const currentProgress = player.miniGameProgress?.trivia ?? { answers: [], score: 0 };
  const newAnswers = [...currentProgress.answers];
  newAnswers[questionIndex] = selectedIndex ?? -1; // -1 for skipped
  
  // Recalculate score - check correctness for each answer
  let correctCount = 0;
  for (let i = 0; i < newAnswers.length; i++) {
    const answer = newAnswers[i];
    if (answer !== undefined && answer !== -1 && answer !== null) {
      const qId = selectedIds[i];
      const q = triviaChristmasPool.find((q) => q.id === qId);
      if (q && answer === q.correctIndex) {
        correctCount++;
      }
    }
  }
  const newScore = Math.min(100, correctCount * 10);
  
  // Ensure we have exactly 10 answers (fill with -1 if needed)
  while (newAnswers.length < 10) {
    newAnswers.push(-1);
  }
  const isCompleted = newAnswers.length === 10 && newAnswers.every((a) => a !== undefined && a !== -1 && a !== null);
  
  const triviaUpdate: any = {
    answers: newAnswers,
    score: newScore,
  };
  if (isCompleted) {
    triviaUpdate.completedAt = Date.now();
  }
  
  const updatedProgress = {
    ...(player.miniGameProgress || {}),
    trivia: triviaUpdate,
  };
  
  await updateDoc(playerRef, {
    miniGameProgress: updatedProgress,
    totalMiniGameScore: calculateTotalMiniGameScore(updatedProgress),
  });
  
  return { correct, score: newScore };
}

// Submit emoji answer
export async function submitEmojiAnswer(params: {
  roomId: string;
  uid: string;
  questionIndex: number;
  answerText: string;
  lang: 'en' | 'cs';
}): Promise<{ correct: boolean; score: number }> {
  const { roomId, uid, questionIndex, answerText, lang } = params;
  
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  
  const room = roomSnap.data() as Room;
  const selectedIds = room.miniGames?.emoji?.selectedIds ?? [];
  const questionId = selectedIds[questionIndex];
  
  if (!questionId) throw new Error('Question not found');
  
  const item = emojiMoviesChristmasPool.find((q) => q.id === questionId);
  if (!item) throw new Error('Item not found');
  
  // Check if answer matches correct or accepted aliases
  const normalizedAnswer = answerText.toLowerCase().trim();
  const correctNormalized = item.correct[lang].toLowerCase().trim();
  const rawAliases = Array.isArray((item as any).acceptedAliases?.[lang]) ? (item as any).acceptedAliases[lang] : [];
  const aliases = rawAliases.map((a: any) => String(a ?? '').toLowerCase().trim()).filter(Boolean);
  
  const correct = normalizedAnswer === correctNormalized || aliases.includes(normalizedAnswer);
  
  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) throw new Error('Player not found');
  
  const player = playerSnap.data() as Player;
  const currentProgress = player.miniGameProgress?.emoji ?? { answers: [], score: 0 };
  const newAnswers = [...currentProgress.answers];
  newAnswers[questionIndex] = answerText;
  
  // Only count correct answers for score
  const correctAnswers = newAnswers.filter((a, idx) => {
    const qId = selectedIds[idx];
    const qItem = emojiMoviesChristmasPool.find((q) => q.id === qId);
    if (!qItem) return false;
    const normalized = a.toLowerCase().trim();
    const correctNorm = qItem.correct[lang].toLowerCase().trim();
    const qRawAliases = Array.isArray((qItem as any).acceptedAliases?.[lang]) ? (qItem as any).acceptedAliases[lang] : [];
    const qAliases = qRawAliases.map((al: any) => String(al ?? '').toLowerCase().trim()).filter(Boolean);
    return normalized === correctNorm || qAliases.includes(normalized);
  });
  
  const newScore = Math.min(100, correctAnswers.length * 10);
  
  const isCompleted = newAnswers.length === 10 && newAnswers.every((a) => a && a.trim() !== '');
  
  const emojiUpdate: any = {
    answers: newAnswers,
    score: newScore,
  };
  if (isCompleted) {
    emojiUpdate.completedAt = Date.now();
  }
  
  const updatedProgress = {
    ...(player.miniGameProgress || {}),
    emoji: emojiUpdate,
  };
  
  await updateDoc(playerRef, {
    miniGameProgress: updatedProgress,
    totalMiniGameScore: calculateTotalMiniGameScore(updatedProgress),
  });
  
  return { correct, score: newScore };
}

// Submit WYR choice
export async function submitWYRChoice(params: {
  roomId: string;
  uid: string;
  questionIndex: number;
  choice: 'A' | 'B';
}): Promise<{ score: number }> {
  const { roomId, uid, questionIndex, choice } = params;
  
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  const room = roomSnap.data() as Room;
  const selectedIds = room.miniGames?.wyr?.selectedIds ?? [];
  
  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) throw new Error('Player not found');
  
  const player = playerSnap.data() as Player;
  const currentProgress = player.miniGameProgress?.wyr ?? { choices: [], score: 0 };
  const newChoices = [...currentProgress.choices];
  newChoices[questionIndex] = choice;
  
  // WYR doesn't count for points - always 0
  const newScore = 0;
  
  // Check completion based on actual number of questions
  const isCompleted = newChoices.length === selectedIds.length && newChoices.every((c, idx) => idx < selectedIds.length && (c === 'A' || c === 'B'));
  
  const wyrUpdate: any = {
    choices: newChoices,
    score: newScore,
  };
  if (isCompleted) {
    wyrUpdate.completedAt = Date.now();
  }
  
  const updatedProgress = {
    ...(player.miniGameProgress || {}),
    wyr: wyrUpdate,
  };
  
  await updateDoc(playerRef, {
    miniGameProgress: updatedProgress,
    totalMiniGameScore: calculateTotalMiniGameScore(updatedProgress),
  });
  
  return { score: newScore };
}

// Submit pictionary drawing
export async function submitPictionaryDrawing(params: {
  roomId: string;
  uid: string;
  questionIndex: number;
  dataUrl: string;
}): Promise<{ score: number }> {
  const { roomId, uid, questionIndex, dataUrl } = params;
  
  const roomRef = doc(db, 'rooms', roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) throw new Error('Room not found');
  
  const room = roomSnap.data() as Room;
  const selectedIds = room.miniGames?.pictionary?.selectedIds ?? [];
  const promptId = selectedIds[questionIndex];
  
  if (!promptId) throw new Error('Prompt not found');
  
  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) throw new Error('Player not found');
  
  const player = playerSnap.data() as Player;
  const currentProgress = player.miniGameProgress?.pictionary;
  const currentDrawings: any[] = Array.isArray((currentProgress as any)?.drawings) ? (currentProgress as any).drawings : [];
  
  // Ensure the drawings array is properly sized to match selectedIds length
  const newDrawings = Array(selectedIds.length).fill(null).map((_, idx) => 
    currentDrawings[idx] || null
  );
  newDrawings[questionIndex] = { promptId, dataUrl };
  
  const newScore = calculatePictionaryScore(newDrawings);
  
  // Check completion based on actual number of prompts, not hardcoded 10
  const isCompleted = newDrawings.length === selectedIds.length && newDrawings.every((d) => d && d.promptId);
  
  const pictionaryUpdate: any = {
    drawings: newDrawings,
    score: newScore,
  };
  if (isCompleted) {
    pictionaryUpdate.completedAt = Date.now();
  }
  
  const updatedProgress = {
    ...(player.miniGameProgress || {}),
    pictionary: pictionaryUpdate,
  };
  
  await updateDoc(playerRef, {
    miniGameProgress: updatedProgress,
    totalMiniGameScore: calculateTotalMiniGameScore(updatedProgress),
  });
  
  return { score: newScore };
}

// Calculate total mini game score
export function calculateTotalMiniGameScore(progress: Player['miniGameProgress']): number {
  if (!progress) return 0;
  let total = 0;
  if (progress.trivia) total += progress.trivia.score;
  if (progress.emoji) total += progress.emoji.score;
  // WYR doesn't count for points - it's just for fun/getting to know everyone
  // if (progress.wyr) total += progress.wyr.score;
  // Pictionary uses new multiplayer scoring
  if (progress.pictionary) {
    total += progress.pictionary.score || 0;
  }
  if (progress.guess_the_song) {
    total += progress.guess_the_song.score || 0;
  }
  return total;
}

import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Room, Player, MiniGameType } from '@/types';
import { triviaChristmasPool } from '@/content/trivia_christmas';
import { emojiMoviesChristmasPool } from '@/content/emoji_movies_christmas';
import { wouldYouRatherChristmasPool } from '@/content/would_you_rather_christmas';
import { pictionaryChristmasPool } from '@/content/pictionary_christmas';

// Generate random selection of 10 items from a pool
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
  const gamesToInit = enabledGames || ['trivia', 'emoji', 'wyr', 'pictionary'];

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

// WYR scoring: +2 per answered, +10 completion bonus, max 30
export function calculateWYRScore(choices: ('A' | 'B')[]): number {
  const answeredCount = choices.filter((c) => c === 'A' || c === 'B').length;
  const baseScore = answeredCount * 2;
  const completionBonus = answeredCount === 10 ? 10 : 0;
  return Math.min(30, baseScore + completionBonus);
}

// Pictionary scoring: +2 per drawing, +10 completion bonus, max 30
export function calculatePictionaryScore(drawings: Array<{ promptId: string; dataUrl?: string }>): number {
  const drawingCount = drawings.length;
  const baseScore = drawingCount * 2;
  const completionBonus = drawingCount === 10 ? 10 : 0;
  return Math.min(30, baseScore + completionBonus);
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
  const aliases = item.acceptedAliases[lang].map((a) => a.toLowerCase().trim());
  
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
    const qAliases = qItem.acceptedAliases[lang].map((al) => al.toLowerCase().trim());
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
  
  const playerRef = doc(db, 'rooms', roomId, 'players', uid);
  const playerSnap = await getDoc(playerRef);
  if (!playerSnap.exists()) throw new Error('Player not found');
  
  const player = playerSnap.data() as Player;
  const currentProgress = player.miniGameProgress?.wyr ?? { choices: [], score: 0 };
  const newChoices = [...currentProgress.choices];
  newChoices[questionIndex] = choice;
  
  const newScore = calculateWYRScore(newChoices);
  
  const isCompleted = newChoices.length === 10 && newChoices.every((c) => c === 'A' || c === 'B');
  
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
  const currentProgress = player.miniGameProgress?.pictionary ?? { drawings: [], score: 0 };
  
  // Ensure the drawings array is properly sized to match selectedIds length
  const newDrawings = Array(selectedIds.length).fill(null).map((_, idx) => 
    currentProgress.drawings[idx] || null
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
  if (progress.wyr) total += progress.wyr.score;
  if (progress.pictionary) total += progress.pictionary.score;
  return total;
}

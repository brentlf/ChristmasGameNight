import type { CodePuzzle, EmojiClue, PhotoPrompt, Riddle, TriviaQuestion, Room } from '@/types';
import {
  codePuzzles,
  emojiClues,
  finalRiddlePool,
  getTriviaPool,
  photoPrompts,
  riddleGatePool,
} from '@/content/raceTracks/christmas_race_v1';

export type RaceLang = 'en' | 'cs';

/**
 * Get riddle gate riddle by ID, checking AI-generated content if available
 */
export function getRiddleGateRiddleById(id: string, room?: Room, stageId?: string): Riddle | undefined {
  // Check AI-generated content first if room and stage provided
  if (room && stageId && room.raceAiEnhanced && room.raceStageQuestions?.[stageId]?.riddle) {
    return room.raceStageQuestions[stageId].riddle as Riddle;
  }
  // Fallback to static pool
  return riddleGatePool.find((r) => r.id === id);
}

/**
 * Get final riddle by ID, checking AI-generated content if available
 */
export function getFinalRiddleById(id: string, room?: Room, stageId?: string): Riddle | undefined {
  // Check AI-generated content first if room and stage provided
  if (room && stageId && room.raceAiEnhanced && room.raceStageQuestions?.[stageId]?.riddle) {
    return room.raceStageQuestions[stageId].riddle as Riddle;
  }
  // Fallback to static pool
  return finalRiddlePool.find((r) => r.id === id);
}

/**
 * Get emoji clue by ID, checking AI-generated content if available
 */
export function getEmojiClueById(id: string, room?: Room, stageId?: string): EmojiClue | undefined {
  // Check AI-generated content first if room and stage provided
  if (room && stageId && room.raceAiEnhanced && room.raceStageQuestions?.[stageId]?.clues) {
    const aiClue = room.raceStageQuestions[stageId].clues?.find((c: any) => c.id === id);
    if (aiClue) return aiClue as EmojiClue;
  }
  // Fallback to static pool
  return emojiClues.find((c) => c.id === id);
}

/**
 * Get code puzzle by ID (AI not supported - uses static content)
 */
export function getCodePuzzleById(id: string): CodePuzzle | undefined {
  return codePuzzles.find((c) => c.id === id);
}

/**
 * Get photo prompt by ID (AI not supported - uses static content)
 */
export function getPhotoPromptById(id: string): PhotoPrompt | undefined {
  return photoPrompts.find((p) => p.id === id);
}

/**
 * Get trivia question by ID, checking AI-generated content if available
 */
export function getTriviaQuestionById(lang: RaceLang, id: string, room?: Room, stageId?: string): TriviaQuestion | undefined {
  // Check AI-generated content first if room and stage provided
  if (room && stageId && room.raceAiEnhanced && room.raceStageQuestions?.[stageId]?.questions) {
    const aiQuestion = room.raceStageQuestions[stageId].questions?.find((q: any) => q.id === id);
    if (aiQuestion) return aiQuestion as TriviaQuestion;
  }
  // Fallback to static pool
  return getTriviaPool(lang).find((q) => q.id === id);
}


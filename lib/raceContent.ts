import type { CodePuzzle, EmojiClue, PhotoPrompt, Riddle, TriviaQuestion } from '@/types';
import {
  codePuzzles,
  emojiClues,
  finalRiddlePool,
  getTriviaPool,
  photoPrompts,
  riddleGatePool,
} from '@/content/raceTracks/christmas_race_v1';

export type RaceLang = 'en' | 'cs';

export function getRiddleGateRiddleById(id: string): Riddle | undefined {
  return riddleGatePool.find((r) => r.id === id);
}

export function getFinalRiddleById(id: string): Riddle | undefined {
  return finalRiddlePool.find((r) => r.id === id);
}

export function getEmojiClueById(id: string): EmojiClue | undefined {
  return emojiClues.find((c) => c.id === id);
}

export function getCodePuzzleById(id: string): CodePuzzle | undefined {
  return codePuzzles.find((c) => c.id === id);
}

export function getPhotoPromptById(id: string): PhotoPrompt | undefined {
  return photoPrompts.find((p) => p.id === id);
}

export function getTriviaQuestionById(lang: RaceLang, id: string): TriviaQuestion | undefined {
  return getTriviaPool(lang).find((q) => q.id === id);
}


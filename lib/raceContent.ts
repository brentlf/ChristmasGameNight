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
  if (room && stageId && room.raceAiEnhanced) {
    // Check for multiple riddles first
    if (room.raceStageQuestions?.[stageId]?.riddles) {
      const riddle = room.raceStageQuestions[stageId].riddles?.find((r: any) => r.id === id);
      if (riddle) return riddle as Riddle;
    }
    // Fallback to single riddle (backward compatibility)
    if (room.raceStageQuestions?.[stageId]?.riddle) {
      return room.raceStageQuestions[stageId].riddle as Riddle;
    }
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
    if (aiClue) return ensureEmojiOptionsContainCorrect(aiClue as EmojiClue);
  }
  // Fallback to static pool
  const clue = emojiClues.find((c) => c.id === id);
  return clue ? ensureEmojiOptionsContainCorrect(clue) : undefined;
}

function normalizeTitle(s: string): string {
  return String(s ?? '')
    .trim()
    // normalize smart quotes/apostrophes to plain
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function ensureEmojiOptionsContainCorrect(clue: EmojiClue): EmojiClue {
  const fixFor = (lang: 'en' | 'cs') => {
    const correct = (clue.correct?.[lang] ?? '').toString();
    const raw = Array.isArray(clue.options?.[lang]) ? clue.options[lang] : [];
    const normalizedCorrect = normalizeTitle(correct);

    // If correct is already present (ignoring punctuation/quotes), keep as-is.
    const hasCorrect = raw.some((o) => normalizeTitle(o) === normalizedCorrect);
    if (hasCorrect) return raw;

    // Otherwise, inject the correct answer and keep 4 unique options.
    const uniq: string[] = [];
    const pushUniq = (v: string) => {
      const n = normalizeTitle(v);
      if (!n) return;
      if (uniq.some((x) => normalizeTitle(x) === n)) return;
      uniq.push(v);
    };

    pushUniq(correct);
    raw.forEach(pushUniq);
    return uniq.slice(0, 4);
  };

  return {
    ...clue,
    options: {
      ...(clue.options as any),
      en: fixFor('en'),
      cs: fixFor('cs'),
    },
  } as EmojiClue;
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


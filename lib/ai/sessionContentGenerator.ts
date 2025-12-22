/**
 * Session Content Generator
 * Generates AI content for a session and stores it in Firestore
 * Used server-side when starting a session
 */

import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { MiniGameType } from '@/types';
import {
  generateAITriviaQuestionsServer,
  generateAIFamilyFeudQuestionServer,
  generateAIPictionaryPromptsServer,
  generateAIWouldYouRatherServer,
  generateAIEmojiMoviesServer,
} from './serverContentGenerator';
import { generateSeed, shuffleSeeded } from '@/lib/utils/seededRandom';

/**
 * Generate AI content for a session and store in Firestore
 * Returns the selected IDs (with "ai_" prefix)
 */
export async function generateAIContentForSession(
  roomId: string,
  sessionId: string,
  gameId: MiniGameType,
  count: number,
  theme: string = 'Christmas',
  difficulty: 'easy' | 'medium' | 'hard' = 'easy'
): Promise<string[]> {
  // Generate seed from roomId and sessionId strings
  const seedStr = `${roomId}_${sessionId}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;
  }
  const seedNum = Math.abs(seed);
  const cacheKey = `rooms/${roomId}/sessions/${sessionId}/aiContent/${gameId}`;
  const cacheRef = doc(db, cacheKey);

  try {
    let content: any[];
    let contentItems: any[];

    switch (gameId) {
      case 'trivia': {
        contentItems = await generateAITriviaQuestionsServer(count, theme, difficulty);
        content = contentItems;
        break;
      }
      case 'family_feud': {
        // For Family Feud, we need to generate multiple questions (one per round)
        const questions = [];
        for (let i = 0; i < count; i++) {
          const question = await generateAIFamilyFeudQuestionServer(theme, difficulty);
          // Update ID to be unique
          question.id = `ai_ff_${sessionId}_${i}`;
          // Update answer IDs
          question.answers = question.answers.map((ans, idx) => ({
            ...ans,
            id: `${question.id}_${String.fromCharCode(97 + idx)}`,
          }));
          questions.push(question);
        }
        contentItems = questions;
        content = questions;
        break;
      }
      case 'pictionary': {
        contentItems = await generateAIPictionaryPromptsServer(count, theme, difficulty);
        content = contentItems;
        break;
      }
      case 'wyr': {
        contentItems = await generateAIWouldYouRatherServer(count, theme, difficulty);
        content = contentItems;
        break;
      }
      case 'emoji': {
        contentItems = await generateAIEmojiMoviesServer(count, theme, difficulty);
        content = contentItems;
        break;
      }
      default:
        throw new Error(`AI generation not supported for game type: ${gameId}`);
    }

    // Shuffle using seed for variety
    const shuffled = shuffleSeeded([...contentItems], seedNum);

    // Extract IDs
    const selectedIds = shuffled.slice(0, count).map((item) => item.id);

    // Store the full content in Firestore for later retrieval
    await setDoc(cacheRef, {
      content: shuffled.slice(0, count),
      generatedAt: Date.now(),
      gameId,
      count: selectedIds.length,
    }, { merge: true });

    return selectedIds;
  } catch (error) {
    console.error(`Error generating AI content for ${gameId}:`, error);
    throw error;
  }
}



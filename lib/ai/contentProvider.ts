/**
 * Content Provider Abstraction
 * Provides a unified interface for accessing game content from either static pools or AI generation
 */

import type { TriviaItem } from '@/content/trivia_christmas';
import type { FamilyFeudQuestion } from '@/content/family_feud_christmas';
import type { PictionaryItem } from '@/content/pictionary_christmas';
import type { WouldYouRatherItem } from '@/content/would_you_rather_christmas';
import type { EmojiItem } from '@/content/emoji_movies_christmas';
import { triviaChristmasPool } from '@/content/trivia_christmas';
import { familyFeudChristmasPool } from '@/content/family_feud_christmas';
import { pictionaryChristmasPool } from '@/content/pictionary_christmas';
import { wouldYouRatherChristmasPool } from '@/content/would_you_rather_christmas';
import { emojiMoviesChristmasPool } from '@/content/emoji_movies_christmas';
import { generateSeed, shuffleSeeded } from '@/lib/utils/seededRandom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface ContentProvider {
  getTriviaQuestions(count: number, seed: number): Promise<TriviaItem[]>;
  getFamilyFeudQuestion(seed: number): Promise<FamilyFeudQuestion>;
  getPictionaryPrompts(count: number, seed: number): Promise<PictionaryItem[]>;
  getWouldYouRather(count: number, seed: number): Promise<WouldYouRatherItem[]>;
  getEmojiMovies(count: number, seed: number): Promise<EmojiItem[]>;
}

/**
 * Static Content Provider - uses predefined content pools
 */
class StaticContentProvider implements ContentProvider {
  async getTriviaQuestions(count: number, seed: number): Promise<TriviaItem[]> {
    const shuffled = shuffleSeeded([...triviaChristmasPool], seed);
    return shuffled.slice(0, count);
  }

  async getFamilyFeudQuestion(seed: number): Promise<FamilyFeudQuestion> {
    const shuffled = shuffleSeeded([...familyFeudChristmasPool], seed);
    return shuffled[0];
  }

  async getPictionaryPrompts(count: number, seed: number): Promise<PictionaryItem[]> {
    const shuffled = shuffleSeeded([...pictionaryChristmasPool], seed);
    return shuffled.slice(0, count);
  }

  async getWouldYouRather(count: number, seed: number): Promise<WouldYouRatherItem[]> {
    const shuffled = shuffleSeeded([...wouldYouRatherChristmasPool], seed);
    return shuffled.slice(0, count);
  }

  async getEmojiMovies(count: number, seed: number): Promise<EmojiItem[]> {
    const shuffled = shuffleSeeded([...emojiMoviesChristmasPool], seed);
    return shuffled.slice(0, count);
  }
}

/**
 * AI Content Provider - generates content using AI and caches in Firestore
 */
class AIContentProvider implements ContentProvider {
  constructor(
    private roomId: string,
    private sessionId: string
  ) {}

  /**
   * Get or generate AI content from cache
   */
  private async getOrGenerateContent<T>(
    gameType: 'trivia' | 'family_feud' | 'pictionary' | 'wyr' | 'emoji',
    count: number,
    seed: number
  ): Promise<T> {
    const cacheKey = `rooms/${this.roomId}/sessions/${this.sessionId}/aiContent/${gameType}`;
    const cacheRef = doc(db, cacheKey);

    try {
      // Try to get from cache first
      const cached = await getDoc(cacheRef);
      if (cached.exists()) {
        const data = cached.data();
        const generatedAt = data.generatedAt || 0;
        const age = Date.now() - generatedAt;

        // Use cached content if less than 24 hours old
        if (age < 24 * 60 * 60 * 1000 && data.content) {
          // Shuffle the cached content using the seed for variety
          if (Array.isArray(data.content)) {
            const shuffled = shuffleSeeded([...data.content], seed);
            return shuffled.slice(0, count) as T;
          }
          return data.content as T;
        }
      }

      // Generate new content
      const response = await fetch('/api/generate-ai-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameType, count }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate AI content: ${response.statusText}`);
      }

      const { content } = await response.json();

      // Cache the generated content
      await setDoc(cacheRef, {
        content,
        generatedAt: Date.now(),
        gameType,
        count,
      }, { merge: true });

      // Shuffle and return
      if (Array.isArray(content)) {
        const shuffled = shuffleSeeded([...content], seed);
        return shuffled.slice(0, count) as T;
      }
      return content as T;
    } catch (error) {
      console.error(`Error getting/generating AI content for ${gameType}:`, error);
      // Fallback to static content on error
      const staticProvider = new StaticContentProvider();
      switch (gameType) {
        case 'trivia':
          return (await staticProvider.getTriviaQuestions(count, seed)) as T;
        case 'family_feud':
          return (await staticProvider.getFamilyFeudQuestion(seed)) as T;
        case 'pictionary':
          return (await staticProvider.getPictionaryPrompts(count, seed)) as T;
        case 'wyr':
          return (await staticProvider.getWouldYouRather(count, seed)) as T;
        case 'emoji':
          return (await staticProvider.getEmojiMovies(count, seed)) as T;
        default:
          throw error;
      }
    }
  }

  async getTriviaQuestions(count: number, seed: number): Promise<TriviaItem[]> {
    return this.getOrGenerateContent<TriviaItem[]>('trivia', count, seed);
  }

  async getFamilyFeudQuestion(seed: number): Promise<FamilyFeudQuestion> {
    return this.getOrGenerateContent<FamilyFeudQuestion>('family_feud', 1, seed);
  }

  async getPictionaryPrompts(count: number, seed: number): Promise<PictionaryItem[]> {
    return this.getOrGenerateContent<PictionaryItem[]>('pictionary', count, seed);
  }

  async getWouldYouRather(count: number, seed: number): Promise<WouldYouRatherItem[]> {
    return this.getOrGenerateContent<WouldYouRatherItem[]>('wyr', count, seed);
  }

  async getEmojiMovies(count: number, seed: number): Promise<EmojiItem[]> {
    return this.getOrGenerateContent<EmojiItem[]>('emoji', count, seed);
  }
}

/**
 * Factory function to get the appropriate content provider
 */
export function getContentProvider(
  roomId: string,
  sessionId: string,
  aiEnhanced: boolean
): ContentProvider {
  if (aiEnhanced) {
    return new AIContentProvider(roomId, sessionId);
  }
  return new StaticContentProvider();
}




import { triviaChristmasPool } from '@/content/trivia_christmas';
import { emojiMoviesChristmasPool } from '@/content/emoji_movies_christmas';
import { wouldYouRatherChristmasPool } from '@/content/would_you_rather_christmas';
import { pictionaryChristmasPool } from '@/content/pictionary_christmas';
import { guessTheSongChristmasPool } from '@/content/guess_the_song_christmas';
import { familyFeudChristmasPool } from '@/content/family_feud_christmas';
import type { TriviaItem } from '@/content/trivia_christmas';
import type { FamilyFeudQuestion } from '@/content/family_feud_christmas';
import type { PictionaryItem } from '@/content/pictionary_christmas';
import type { WouldYouRatherItem } from '@/content/would_you_rather_christmas';
import type { EmojiItem } from '@/content/emoji_movies_christmas';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Helper to get AI-generated content from Firestore cache
 */
async function getAIContentFromCache<T>(
  roomId: string,
  sessionId: string,
  gameId: string,
  itemId: string
): Promise<T | null> {
  try {
    // Extract session ID from item ID if it's embedded (e.g., "ai_ff_session123_0")
    // For simpler IDs, we need the sessionId parameter
    const cacheKey = `rooms/${roomId}/sessions/${sessionId}/aiContent/${gameId}`;
    const cacheRef = doc(db, cacheKey);
    const cached = await getDoc(cacheRef);
    
    if (cached.exists()) {
      const data = cached.data();
      const content = data.content || [];
      
      // Find the item by ID in the cached content
      const item = content.find((item: any) => item.id === itemId);
      return item || null;
    }

    // Fallback: AI content may be stored on the selected deck doc (if aiContent/* writes are blocked).
    const selectedRef = doc(db, 'rooms', roomId, 'sessions', sessionId, 'selected', 'selected');
    const selectedSnap = await getDoc(selectedRef);
    if (selectedSnap.exists()) {
      const data = selectedSnap.data() as any;
      const ai = data?.ai ?? null;
      const content = Array.isArray(ai?.content) ? ai.content : [];
      const item = content.find((x: any) => x?.id === itemId);
      return item || null;
    }
    return null;
  } catch (error) {
    console.error('Error fetching AI content from cache:', error);
    return null;
  }
}

// In-memory cache for AI content (to avoid repeated Firestore reads)
const aiContentCache = new Map<string, any>();

/**
 * Get trivia item by ID, checking AI cache if ID starts with "ai_"
 * Always returns a Promise (resolves immediately for static content)
 */
export async function getTriviaItemById(id: string, roomId?: string, sessionId?: string): Promise<TriviaItem | undefined> {
  // Try static pool first (synchronous check)
  const staticItem = triviaChristmasPool.find((item) => item.id === id);
  if (staticItem) return Promise.resolve(staticItem);
  
  // If AI content and we have room/session info, try cache (async)
  if (id.startsWith('ai_') && roomId && sessionId) {
    const cacheKey = `${roomId}/${sessionId}/trivia/${id}`;
    const cached = aiContentCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);
    
    // Fetch from Firestore
    const aiItem = await getAIContentFromCache<TriviaItem>(roomId, sessionId, 'trivia', id);
    if (aiItem) {
      aiContentCache.set(cacheKey, aiItem);
      return aiItem;
    }
  }
  
  return undefined;
}

/**
 * Get Family Feud item by ID, checking AI cache if ID starts with "ai_"
 * Always returns a Promise (resolves immediately for static content)
 */
export async function getFamilyFeudItemById(id: string, roomId?: string, sessionId?: string): Promise<FamilyFeudQuestion | undefined> {
  // Try static pool first (synchronous check)
  const staticItem = familyFeudChristmasPool.find((item) => item.id === id);
  if (staticItem) return Promise.resolve(staticItem);
  
  // If AI content and we have room/session info, try cache
  if (id.startsWith('ai_') && roomId && sessionId) {
    const cacheKey = `${roomId}/${sessionId}/family_feud/${id}`;
    const cached = aiContentCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);
    
    const aiItem = await getAIContentFromCache<FamilyFeudQuestion>(roomId, sessionId, 'family_feud', id);
    if (aiItem) {
      aiContentCache.set(cacheKey, aiItem);
      return aiItem;
    }
  }
  
  return undefined;
}

/**
 * Get Pictionary item by ID, checking AI cache if ID starts with "ai_"
 * Always returns a Promise (resolves immediately for static content)
 */
export async function getPictionaryItemById(id: string, roomId?: string, sessionId?: string): Promise<PictionaryItem | undefined> {
  // Try static pool first (synchronous check)
  const staticItem = pictionaryChristmasPool.find((item) => item.id === id);
  if (staticItem) return Promise.resolve(staticItem);
  
  // If AI content and we have room/session info, try cache
  if (id.startsWith('ai_') && roomId && sessionId) {
    const cacheKey = `${roomId}/${sessionId}/pictionary/${id}`;
    const cached = aiContentCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);
    
    const aiItem = await getAIContentFromCache<PictionaryItem>(roomId, sessionId, 'pictionary', id);
    if (aiItem) {
      aiContentCache.set(cacheKey, aiItem);
      return aiItem;
    }
  }
  
  return undefined;
}

/**
 * Get Would You Rather item by ID, checking AI cache if ID starts with "ai_"
 * Always returns a Promise (resolves immediately for static content)
 */
export async function getWYRItemById(id: string, roomId?: string, sessionId?: string): Promise<WouldYouRatherItem | undefined> {
  // Try static pool first (synchronous check)
  const staticItem = wouldYouRatherChristmasPool.find((item) => item.id === id);
  if (staticItem) return Promise.resolve(staticItem);
  
  // If AI content and we have room/session info, try cache
  if (id.startsWith('ai_') && roomId && sessionId) {
    const cacheKey = `${roomId}/${sessionId}/wyr/${id}`;
    const cached = aiContentCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);
    
    const aiItem = await getAIContentFromCache<WouldYouRatherItem>(roomId, sessionId, 'wyr', id);
    if (aiItem) {
      aiContentCache.set(cacheKey, aiItem);
      return aiItem;
    }
  }
  
  return undefined;
}

/**
 * Get Emoji Movie item by ID, checking AI cache if ID starts with "ai_"
 * Always returns a Promise (resolves immediately for static content)
 */
export async function getEmojiItemById(id: string, roomId?: string, sessionId?: string): Promise<EmojiItem | undefined> {
  // Try static pool first (synchronous check)
  const staticItem = emojiMoviesChristmasPool.find((item) => item.id === id);
  if (staticItem) return Promise.resolve(staticItem);
  
  // If AI content and we have room/session info, try cache
  if (id.startsWith('ai_') && roomId && sessionId) {
    const cacheKey = `${roomId}/${sessionId}/emoji/${id}`;
    const cached = aiContentCache.get(cacheKey);
    if (cached) return Promise.resolve(cached);
    
    const aiItem = await getAIContentFromCache<EmojiItem>(roomId, sessionId, 'emoji', id);
    if (aiItem) {
      aiContentCache.set(cacheKey, aiItem);
      return aiItem;
    }
  }
  
  return undefined;
}

/**
 * Get Guess the Song item by ID (AI not supported due to audio requirements)
 */
export function getGuessTheSongItemById(id: string) {
  return guessTheSongChristmasPool.find((item) => item.id === id);
}



/**
 * Hook for fetching game content items (supports both static and AI-generated content)
 */

import { useState, useEffect } from 'react';
import {
  getTriviaItemById,
  getFamilyFeudItemById,
  getPictionaryItemById,
  getWYRItemById,
  getEmojiItemById,
} from '@/lib/miniGameContent';
import type { TriviaItem } from '@/content/trivia_christmas';
import type { FamilyFeudQuestion } from '@/content/family_feud_christmas';
import type { PictionaryItem } from '@/content/pictionary_christmas';
import type { WouldYouRatherItem } from '@/content/would_you_rather_christmas';
import type { EmojiItem } from '@/content/emoji_movies_christmas';
import type { MiniGameType } from '@/types';

type GameContentItem =
  | { type: 'trivia'; item: TriviaItem }
  | { type: 'emoji'; item: EmojiItem }
  | { type: 'wyr'; item: WouldYouRatherItem }
  | { type: 'pictionary'; item: PictionaryItem }
  | { type: 'guess_the_song'; item: any }
  | { type: 'family_feud'; item: FamilyFeudQuestion }
  | null;

/**
 * Hook to get game content item by ID, handling both static and AI-generated content
 */
export function useGameContent(
  gameId: MiniGameType | null,
  questionIndex: number | null,
  selectedIds: string[] | undefined,
  roomId?: string | null,
  sessionId?: string | null
): GameContentItem {
  const [content, setContent] = useState<GameContentItem>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId || questionIndex === null || !selectedIds) {
      setContent(null);
      setLoading(false);
      return;
    }

    const id = selectedIds[questionIndex];
    if (!id) {
      setContent(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch content based on game type
    const fetchContent = async () => {
      try {
        const roomIdOrUndef = roomId || undefined;
        const sessionIdOrUndef = sessionId || undefined;
        
        if (gameId === 'trivia') {
          const item = await getTriviaItemById(id, roomIdOrUndef, sessionIdOrUndef);
          setContent(item ? { type: 'trivia', item } : null);
        } else if (gameId === 'emoji') {
          const item = await getEmojiItemById(id, roomIdOrUndef, sessionIdOrUndef);
          setContent(item ? { type: 'emoji', item } : null);
        } else if (gameId === 'wyr') {
          const item = await getWYRItemById(id, roomIdOrUndef, sessionIdOrUndef);
          setContent(item ? { type: 'wyr', item } : null);
        } else if (gameId === 'pictionary') {
          const item = await getPictionaryItemById(id, roomIdOrUndef, sessionIdOrUndef);
          setContent(item ? { type: 'pictionary', item } : null);
        } else if (gameId === 'family_feud') {
          const item = await getFamilyFeudItemById(id, roomIdOrUndef, sessionIdOrUndef);
          setContent(item ? { type: 'family_feud', item } : null);
        } else {
          setContent(null);
        }
      } catch (error) {
        console.error('Error fetching game content:', error);
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [gameId, questionIndex, selectedIds, roomId, sessionId]);

  return content;
}

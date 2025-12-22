/**
 * Hook to load a single game content item by ID
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

export function useTriviaItem(id: string | null, roomId?: string, sessionId?: string) {
  const [item, setItem] = useState<TriviaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getTriviaItemById(id, roomId || undefined, sessionId || undefined)
      .then((result) => setItem(result || null))
      .catch((error) => {
        console.error('Error loading trivia item:', error);
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [id, roomId, sessionId]);

  return { item, loading };
}

export function useEmojiItem(id: string | null, roomId?: string, sessionId?: string) {
  const [item, setItem] = useState<EmojiItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getEmojiItemById(id, roomId || undefined, sessionId || undefined)
      .then((result) => setItem(result || null))
      .catch((error) => {
        console.error('Error loading emoji item:', error);
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [id, roomId, sessionId]);

  return { item, loading };
}

export function useWYRItem(id: string | null, roomId?: string, sessionId?: string) {
  const [item, setItem] = useState<WouldYouRatherItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getWYRItemById(id, roomId || undefined, sessionId || undefined)
      .then((result) => setItem(result || null))
      .catch((error) => {
        console.error('Error loading WYR item:', error);
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [id, roomId, sessionId]);

  return { item, loading };
}

export function usePictionaryItem(id: string | null, roomId?: string, sessionId?: string) {
  const [item, setItem] = useState<PictionaryItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getPictionaryItemById(id, roomId || undefined, sessionId || undefined)
      .then((result) => setItem(result || null))
      .catch((error) => {
        console.error('Error loading pictionary item:', error);
        setItem(null);
      })
      .finally(() => setLoading(false));
  }, [id, roomId, sessionId]);

  return { item, loading };
}




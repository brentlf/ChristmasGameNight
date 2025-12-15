import { triviaChristmasPool } from '@/content/trivia_christmas';
import { emojiMoviesChristmasPool } from '@/content/emoji_movies_christmas';
import { wouldYouRatherChristmasPool } from '@/content/would_you_rather_christmas';
import { pictionaryChristmasPool } from '@/content/pictionary_christmas';

export function getTriviaItemById(id: string) {
  return triviaChristmasPool.find((item) => item.id === id);
}

export function getEmojiItemById(id: string) {
  return emojiMoviesChristmasPool.find((item) => item.id === id);
}

export function getWYRItemById(id: string) {
  return wouldYouRatherChristmasPool.find((item) => item.id === id);
}

export function getPictionaryItemById(id: string) {
  return pictionaryChristmasPool.find((item) => item.id === id);
}



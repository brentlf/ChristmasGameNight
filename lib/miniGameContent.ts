import { triviaChristmasPool } from '@/content/trivia_christmas';
import { emojiMoviesChristmasPool } from '@/content/emoji_movies_christmas';
import { wouldYouRatherChristmasPool } from '@/content/would_you_rather_christmas';
import { pictionaryChristmasPool } from '@/content/pictionary_christmas';
import { guessTheSongChristmasPool } from '@/content/guess_the_song_christmas';
import { familyFeudChristmasPool } from '@/content/family_feud_christmas';

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

export function getGuessTheSongItemById(id: string) {
  return guessTheSongChristmasPool.find((item) => item.id === id);
}

export function getFamilyFeudItemById(id: string) {
  return familyFeudChristmasPool.find((item) => item.id === id);
}



/**
 * Score normalization utilities to ensure fairness across different mini-games.
 * Each game should have similar point potential to prevent one game from dominating scores.
 */

// Target points per question/round for normalization (base scale: 10 points)
const TARGET_POINTS_PER_QUESTION = 10;

// Game-specific multipliers to normalize scores
// These are calculated based on typical max points per game:
// - Trivia: 10 points per question (already normalized)
// - Emoji: 10 points per question (already normalized)  
// - Guess the Song: 10 points per question (already normalized)
// - Pictionary: 15 for guesser + 10 for drawer = ~12.5 average (normalize to 10)
// - Family Feud: Variable team scores (normalize average team score to ~10 per round)
// - Would You Rather: 0 points (social game, no scoring)

export const SCORE_MULTIPLIERS: Record<string, number> = {
  trivia: 1.0, // Already normalized
  emoji: 1.0, // Already normalized
  guess_the_song: 1.0, // Already normalized
  pictionary: 0.8, // 15+10 = 25 total, normalize to ~20 (10 per player avg)
  family_feud: 0.5, // Team scores can be high, normalize significantly
  wyr: 1.0, // No points, but keep multiplier for consistency
};

/**
 * Normalize a score for a specific game type.
 * @param gameId The game identifier
 * @param rawScore The raw score to normalize
 * @returns The normalized score
 */
export function normalizeScore(gameId: string, rawScore: number): number {
  const multiplier = SCORE_MULTIPLIERS[gameId] ?? 1.0;
  return Math.round(rawScore * multiplier);
}

/**
 * Apply normalization to a session score document.
 * This is used when reading scores to ensure fair comparison.
 */
export function applyScoreNormalization(
  gameId: string,
  scoreDoc: { score: number; [key: string]: any }
): { score: number; [key: string]: any } {
  return {
    ...scoreDoc,
    score: normalizeScore(gameId, scoreDoc.score),
  };
}
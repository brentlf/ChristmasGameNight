/**
 * Seeded random number generator for deterministic randomness
 * Based on roomId and stageIndex to ensure all players see the same questions
 */

// Simple seeded random number generator (Mulberry32)
function seededRandom(seed: number): () => number {
  let state = seed;
  return function() {
    let t = state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate a seed from roomId and stageIndex
 */
export function generateSeed(roomId: string, stageIndex: number): number {
  let hash = 0;
  const str = `${roomId}_${stageIndex}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Pick random IDs deterministically based on seed
 */
export function pickRandomIdsSeeded<T extends { id: string }>(
  pool: T[],
  count: number,
  seed: number
): string[] {
  const rng = seededRandom(seed);
  const copy = [...pool];
  
  // Fisher-Yates shuffle with seeded random
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  
  return copy.slice(0, Math.min(count, copy.length)).map((x) => x.id);
}

/**
 * Shuffle array deterministically based on seed
 */
export function shuffleSeeded<T>(array: T[], seed: number): T[] {
  const rng = seededRandom(seed);
  const copy = [...array];
  
  // Fisher-Yates shuffle with seeded random
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  
  return copy;
}

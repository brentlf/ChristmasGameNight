function normalizeForGuessing(input: unknown): string {
  const s = String(input ?? '');
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ') // drop punctuation
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeChristmasSynonyms(input: string): string {
  // Very small, intentionally-safe synonym map to make answers "close enough".
  let s = input;

  // English synonyms
  s = s.replace(/\bfather christmas\b/g, 'santa');
  s = s.replace(/\bsanta claus\b/g, 'santa');
  s = s.replace(/\bst\.?\s*nick\b/g, 'santa');
  s = s.replace(/\bsaint\s+nick\b/g, 'santa');
  s = s.replace(/\bxmas\b/g, 'christmas');

  // Czech-ish helpful mapping (kept minimal to avoid surprising matches)
  // Ježíšek is often used as "Santa" equivalent in Czech families.
  s = s.replace(/\bjez(is|isek|iseku|iskek)\b/g, 'santa'); // rough after diacritic stripping

  return s;
}

function tokenizeForGuessing(input: string): string[] {
  const stop = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'to', 'for', 'in', 'on', 'with']);
  return input
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => {
      // light plural normalization (trees -> tree)
      if (t.length > 3 && t.endsWith('s')) return t.slice(0, -1);
      return t;
    })
    .filter((t) => !stop.has(t));
}

function jaccardSimilarity(a: string[], b: string[]): number {
  const A = new Set(a);
  const B = new Set(b);
  if (A.size === 0 && B.size === 0) return 1;
  let intersection = 0;
  for (const x of A) if (B.has(x)) intersection++;
  const union = A.size + B.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    const ca = a.charCodeAt(i - 1);
    for (let j = 1; j <= b.length; j++) {
      const cb = b.charCodeAt(j - 1);
      const cost = ca === cb ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1, // deletion
        curr[j - 1] + 1, // insertion
        prev[j - 1] + cost // substitution
      );
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

export function fuzzyMatchGuess(guessRaw: unknown, answerRaw: unknown): boolean {
  const guess = canonicalizeChristmasSynonyms(normalizeForGuessing(guessRaw));
  const answer = canonicalizeChristmasSynonyms(normalizeForGuessing(answerRaw));

  if (!guess || !answer) return false;
  if (guess === answer) return true;

  // Substring match for multi-word answers (“gingerbread man” vs “gingerbread”)
  if (guess.length >= 3 && (answer.includes(guess) || guess.includes(answer))) return true;

  const gTokens = tokenizeForGuessing(guess);
  const aTokens = tokenizeForGuessing(answer);
  const tokenSim = jaccardSimilarity(gTokens, aTokens);
  if (tokenSim >= 0.7) return true;

  // Typo tolerance for shorter phrases
  const maxLen = Math.max(guess.length, answer.length);
  const dist = levenshteinDistance(guess, answer);
  const ratio = maxLen === 0 ? 0 : 1 - dist / maxLen;
  if (maxLen <= 25 && ratio >= 0.82) return true;

  return false;
}



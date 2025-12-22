# Content Structure Documentation

Technical documentation of the content data structures used in the game.

## File Organization

All content files are located in the `content/` directory:

```
content/
├── trivia_christmas.ts
├── family_feud_christmas.ts
├── guess_the_song_christmas.ts
├── pictionary_christmas.ts
├── would_you_rather_christmas.ts
├── emoji_movies_christmas.ts
├── traditions_christmas.ts
└── raceTracks/
    └── christmas_race_v1.ts
```

## Common Patterns

### Bilingual Text Structure

All user-facing text uses this bilingual structure:

```typescript
{
  en: string;  // English text
  cs: string;  // Czech text
}
```

### ID Format

All content items have a unique string ID following this pattern:

```
<prefix>_<number>
```

Examples:
- `trivia_1`, `trivia_2`, ...
- `ff_1`, `ff_2`, ...
- `song_1`, `song_2`, ...
- `pic_1`, `pic_2`, ...
- `wyr_1`, `wyr_2`, ...
- `emoji_1`, `emoji_2`, ...

## Content Types

### 1. TriviaItem

**File:** `content/trivia_christmas.ts`

```typescript
export interface TriviaItem {
  id: string;                    // e.g., 'trivia_1'
  question: {
    en: string;                  // Question text in English
    cs: string;                  // Question text in Czech
  };
  options: {
    en: string[];                // Array of 4 option strings (English)
    cs: string[];                // Array of 4 option strings (Czech)
  };
  correctIndex: number;          // Index (0-3) of the correct answer
}
```

**Constraints:**
- `options.en` and `options.cs` must have exactly 4 elements
- `correctIndex` must be 0, 1, 2, or 3
- All strings must be non-empty

### 2. FamilyFeudQuestion

**File:** `content/family_feud_christmas.ts`

```typescript
export interface FamilyFeudQuestion {
  id: string;                    // e.g., 'ff_1'
  question: {
    en: string;
    cs: string;
  };
  answers: Array<{
    id: string;                  // e.g., 'ff_1_a', 'ff_1_b', ...
    text: {
      en: string;
      cs: string;
    };
    points: number;              // Points for this answer (typically 30, 25, 20, 15, 10)
    aliases?: string[];          // Optional: Alternative spellings/names
  }>;
}
```

**Constraints:**
- Typically 5 answers per question
- Points usually decrease: 30, 25, 20, 15, 10
- `aliases` is optional
- Answer IDs should follow pattern: `<question_id>_a`, `<question_id>_b`, etc.

### 3. GuessTheSongItem

**File:** `content/guess_the_song_christmas.ts`

```typescript
export interface GuessTheSongItem {
  id: string;                    // e.g., 'song_1'
  audioSrc: string;              // Path to audio file, e.g., '/audio/christmas_songs/jingle_bells_01.mp3'
  variant: 'song_title' | 'artist' | 'movie' | 'lyrics';
  questionText: {
    en: string;
    cs: string;
  };
  correctAnswer: {
    en: string;
    cs: string;
  };
  options: {
    en: string[];                // Array of 4 option strings
    cs: string[];                // Array of 4 option strings
  };
  correctIndex: number;          // Index (0-3) of the correct answer
}
```

**Constraints:**
- `audioSrc` must point to an existing file in `public/audio/christmas_songs/`
- `options.en` and `options.cs` must have exactly 4 elements
- `correctIndex` must be 0, 1, 2, or 3
- `variant` determines the question type

**Audio File Requirements:**
- Location: `public/audio/christmas_songs/`
- Format: MP3 recommended
- Path in `audioSrc` should start with `/audio/christmas_songs/`

### 4. PictionaryItem

**File:** `content/pictionary_christmas.ts`

```typescript
export interface PictionaryItem {
  id: string;                    // e.g., 'pic_1'
  prompt: {
    en: string;                  // Thing to draw (English)
    cs: string;                  // Thing to draw (Czech)
  };
}
```

**Constraints:**
- Prompts should be simple and drawable
- Single words or short phrases work best

### 5. WouldYouRatherItem

**File:** `content/would_you_rather_christmas.ts`

```typescript
export interface WouldYouRatherItem {
  id: string;                    // e.g., 'wyr_1'
  prompt: {
    en: string;                  // Question with both options, e.g., "Option A 🎄 or Option B ❄️?"
    cs: string;
  };
  optionA: {
    en: string;                  // Description of option A
    cs: string;
  };
  optionB: {
    en: string;                  // Description of option B
    cs: string;
  };
}
```

**Constraints:**
- Both options should be equally appealing/difficult
- Prompt typically includes both options with emojis

### 6. EmojiItem

**File:** `content/emoji_movies_christmas.ts`

```typescript
export interface EmojiItem {
  id: string;                    // e.g., 'emoji_1'
  emoji: string;                 // Sequence of 2-4 emojis, e.g., '🎄👹'
  correct: {
    en: string;                  // Correct movie title (English)
    cs: string;                  // Correct movie title (Czech)
  };
  acceptedAliases: {
    en: string[];                // Alternative titles/names (English)
    cs: string[];                // Alternative titles/names (Czech)
  };
  decoyOptions: {
    en: string[];                // Wrong answer options (typically 3)
    cs: string[];                // Wrong answer options (typically 3)
  };
}
```

**Constraints:**
- `emoji` should be 2-4 emojis that clearly represent the movie
- `acceptedAliases` can be empty arrays
- `decoyOptions` typically has 3 elements

## Data Flow

### Content Loading

Content is imported directly in TypeScript files:

```typescript
// In lib/miniGameEngine.ts
import { triviaChristmasPool } from '@/content/trivia_christmas';
import { familyFeudChristmasPool } from '@/content/family_feud_christmas';
// ... etc
```

### Content Access

Helper functions in `lib/miniGameContent.ts` provide ID-based lookups:

```typescript
export function getTriviaItemById(id: string) {
  return triviaChristmasPool.find((item) => item.id === id);
}
```

### Usage in Game Engine

The game engine uses seeded random selection from content pools:

```typescript
// Example: Select random trivia question
const seed = generateSeed(roomId, sessionId);
const shuffled = shuffleSeeded(triviaChristmasPool, seed);
const selected = shuffled[0];
```

## Validation Rules

### Required Validations

1. **Unique IDs**: No duplicate IDs within the same content type
2. **Bilingual Completeness**: All `en` and `cs` fields must be non-empty strings
3. **Array Lengths**: 
   - Trivia/Song options: Exactly 4 elements
   - Family Feud answers: Typically 5 (but flexible)
4. **Index Validity**: `correctIndex` must be within array bounds (0-3)
5. **Audio File Existence**: `audioSrc` paths must point to existing files
6. **ID Format**: IDs must follow the `<prefix>_<number>` pattern

### Optional Validations

- Content quality (appropriate for family audiences)
- Translation accuracy
- Difficulty consistency
- Cultural appropriateness

## Content Updates and Versioning

### Current Approach

Content is versioned with the codebase in Git. No separate versioning system.

### Best Practices

1. **Sequential IDs**: Use sequential numbers (don't skip unnecessarily)
2. **Backwards Compatibility**: Avoid breaking changes to interfaces
3. **Migration**: If structure changes, update all items
4. **Testing**: Validate after changes using `npm run validate-content`

## File Size Considerations

Large content files are acceptable since:
- Content is compiled into the bundle
- Next.js code-splitting helps with initial load
- Content is static (no runtime fetching)

Typical file sizes:
- Trivia: ~50 items = ~30KB
- Songs: ~60 items = ~40KB
- Other games: Varies

## Type Safety

All content uses TypeScript interfaces, providing:
- Compile-time type checking
- IDE autocomplete
- Refactoring safety

When updating content:
- TypeScript compiler will catch type mismatches
- IDE will highlight errors
- Build process validates structure

## Internationalization (i18n)

Content is bilingual (English/Czech) at the data level, not using a separate i18n system.

**Benefits:**
- Simple structure
- No runtime translation lookup needed
- Easy to add more languages (just add more fields)

**Future Expansion:**
To add a third language (e.g., Slovak):
1. Update interfaces to include `sk` field
2. Add translations to all content items
3. Update game engine to use `sk` when language is Slovak

## Performance Considerations

- Content is bundled at build time (no runtime fetching)
- Arrays are small enough to search linearly (O(n) is acceptable)
- Seeded random ensures consistent selection across clients




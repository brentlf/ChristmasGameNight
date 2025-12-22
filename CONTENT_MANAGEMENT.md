# Content Management Guide

This guide explains how to update game content (questions, challenges, audio songs, etc.) in the Christmas Game Night project.

## Table of Contents

- [Overview](#overview)
- [Content Structure](#content-structure)
- [Adding New Content](#adding-new-content)
- [Updating Existing Content](#updating-existing-content)
- [Audio File Management](#audio-file-management)
- [Validation & Testing](#validation--testing)
- [Best Practices](#best-practices)

## Overview

All game content is stored in TypeScript files in the `content/` directory. Content is:
- **Bilingual**: All content supports both English (en) and Czech (cs)
- **Type-safe**: Uses TypeScript interfaces for validation
- **Statically bundled**: Content is compiled into the application (no database)

### Content Files

| File | Game Type | Description |
|------|-----------|-------------|
| `trivia_christmas.ts` | Trivia | Multiple choice questions |
| `family_feud_christmas.ts` | Family Feud | Survey-style questions with multiple answers |
| `guess_the_song_christmas.ts` | Guess the Song | Audio-based song identification |
| `pictionary_christmas.ts` | Pictionary | Drawing prompts |
| `would_you_rather_christmas.ts` | Would You Rather | Binary choice questions |
| `emoji_movies_christmas.ts` | Emoji Movies | Emoji sequences for movie titles |
| `traditions_christmas.ts` | Traditions | Family tradition prompts |

## Content Structure

### Common Patterns

All content items follow this structure:

```typescript
export interface ContentItem {
  id: string;              // Unique identifier (e.g., 'trivia_1', 'pic_15')
  // ... game-specific fields
}
```

**ID Naming Convention:**
- Trivia: `trivia_1`, `trivia_2`, ...
- Pictionary: `pic_1`, `pic_2`, ...
- Family Feud: `ff_1`, `ff_2`, ...
- Songs: `song_1`, `song_2`, ...
- Would You Rather: `wyr_1`, `wyr_2`, ...
- Emoji: `emoji_1`, `emoji_2`, ...

**Bilingual Fields:**
All user-facing text uses this structure:
```typescript
{
  en: 'English text',
  cs: 'Czech text'
}
```

## Adding New Content

### 1. Trivia Questions

**File:** `content/trivia_christmas.ts`

```typescript
{
  id: 'trivia_N',  // Use next sequential number
  question: {
    en: 'Your question in English?',
    cs: 'Vaše otázka v češtině?',
  },
  options: {
    en: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    cs: ['Možnost 1', 'Možnost 2', 'Možnost 3', 'Možnost 4'],
  },
  correctIndex: 0,  // Index (0-3) of the correct answer
}
```

**Tips:**
- Always provide 4 options
- `correctIndex` must be 0-3
- Keep questions concise and clear

### 2. Family Feud Questions

**File:** `content/family_feud_christmas.ts`

```typescript
{
  id: 'ff_N',
  question: {
    en: 'Name something people...',
    cs: 'Řekněte něco, co lidé...',
  },
  answers: [
    {
      id: 'ff_N_a',
      text: { en: 'Answer 1', cs: 'Odpověď 1' },
      points: 30,  // Points for this answer (higher = more common)
      aliases: ['Alternative name 1', 'Alternative name 2'],  // Optional
    },
    // ... more answers (typically 5)
  ],
}
```

**Tips:**
- Provide 5 answers (most common to least common)
- Points should be decreasing: 30, 25, 20, 15, 10
- Use `aliases` for alternative spellings/names

### 3. Guess the Song

**File:** `content/guess_the_song_christmas.ts`

```typescript
{
  id: 'song_N',
  audioSrc: '/audio/christmas_songs/filename.mp3',  // Path to audio file
  variant: 'song_title',  // 'song_title' | 'artist' | 'movie' | 'lyrics'
  questionText: {
    en: 'Which song is this?',
    cs: 'Která písnička to je?',
  },
  correctAnswer: {
    en: 'Song Title',
    cs: 'Název písně',
  },
  options: {
    en: ['Correct', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
    cs: ['Správně', 'Špatně 1', 'Špatně 2', 'Špatně 3'],
  },
  correctIndex: 0,
}
```

**Audio File Setup:**
1. Place audio file in `public/audio/christmas_songs/`
2. Use filename in `audioSrc` (e.g., `/audio/christmas_songs/jingle_bells_01.mp3`)
3. Ensure file is in MP3 format
4. Run validation script to check file exists

**Tips:**
- `variant` changes the question type (song title, artist, movie, lyrics)
- Ensure audio file exists before committing
- Use clear, descriptive filenames

### 4. Pictionary Prompts

**File:** `content/pictionary_christmas.ts`

```typescript
{
  id: 'pic_N',
  prompt: {
    en: 'Thing to draw',
    cs: 'Věc k nakreslení',
  },
}
```

**Tips:**
- Keep prompts simple and drawable
- Use single words or short phrases
- Christmas-themed items work best

### 5. Would You Rather

**File:** `content/would_you_rather_christmas.ts`

```typescript
{
  id: 'wyr_N',
  prompt: {
    en: 'Option A 🎄 or Option B ❄️?',
    cs: 'Možnost A 🎄 nebo Možnost B ❄️?',
  },
  optionA: {
    en: 'Option A description',
    cs: 'Popis možnosti A',
  },
  optionB: {
    en: 'Option B description',
    cs: 'Popis možnosti B',
  },
}
```

**Tips:**
- Both options should be equally appealing/difficult
- Use emojis in prompts for visual appeal
- Make options distinct and clear

### 6. Emoji Movies

**File:** `content/emoji_movies_christmas.ts`

```typescript
{
  id: 'emoji_N',
  emoji: '🎄👹',  // Emoji sequence
  correct: {
    en: 'Movie Title',
    cs: 'Název filmu',
  },
  acceptedAliases: {
    en: ['Alternative 1', 'Alternative 2'],
    cs: ['Alternativa 1', 'Alternativa 2'],
  },
  decoyOptions: {
    en: ['Wrong Answer 1', 'Wrong Answer 2', 'Wrong Answer 3'],
    cs: ['Špatná odpověď 1', 'Špatná odpověď 2', 'Špatná odpověď 3'],
  },
}
```

**Tips:**
- Use 2-4 emojis that clearly represent the movie
- Provide common alternative titles in `acceptedAliases`
- Make `decoyOptions` plausible but clearly wrong

## Updating Existing Content

### Steps:

1. **Open the relevant content file** in `content/`
2. **Find the item** by ID or search for specific text
3. **Make your changes**:
   - Fix typos
   - Update translations
   - Adjust difficulty
   - Change options/answers
4. **Test your changes**:
   ```bash
   npm run validate-content
   ```
5. **Verify in game** - Create a test room and play through affected games

### Common Updates:

**Fix a typo:**
```typescript
// Before
question: {
  en: 'Wht is Santa\'s name?',  // Typo!
  cs: 'Jaké je Santovo jméno?',
}

// After
question: {
  en: 'What is Santa\'s name?',  // Fixed
  cs: 'Jaké je Santovo jméno?',
}
```

**Update translation:**
```typescript
// Before
cs: 'Překlad může být lepší',

// After
cs: 'Lepší český překlad',
```

**Add an alias (Family Feud):**
```typescript
// Before
{ id: 'ff_1_a', text: { en: 'Lights', cs: 'Světla' }, points: 30 },

// After
{ 
  id: 'ff_1_a', 
  text: { en: 'Lights', cs: 'Světla' }, 
  points: 30,
  aliases: ['Christmas lights', 'Fairy lights']  // Added
},
```

## Audio File Management

### Adding New Audio Files

1. **Obtain audio file** (MP3 format recommended)
2. **Place in:** `public/audio/christmas_songs/`
3. **Naming convention:** Use lowercase with underscores
   - Good: `jingle_bells_01.mp3`
   - Bad: `Jingle Bells 01.mp3`, `jingle-bells-01.mp3`
4. **Update content file** to reference the new file:
   ```typescript
   audioSrc: '/audio/christmas_songs/your_new_file.mp3',
   ```
5. **Validate:**
   ```bash
   npm run check-audio
   ```

### Finding Unused Audio Files

```bash
npm run find-unused-audio
```

This shows audio files that aren't referenced in any content files.

### Audio File Organization

- **Location:** `public/audio/christmas_songs/`
- **Format:** MP3 (MP3 is most compatible)
- **Naming:** Descriptive, lowercase, underscores
- **Size:** Keep files reasonably sized (< 5MB recommended)

## Validation & Testing

### Validate Content Structure

```bash
npm run validate-content
```

This checks:
- ✅ All required fields present
- ✅ IDs are unique
- ✅ Translations are complete (en + cs)
- ✅ Correct indexes are valid
- ✅ Audio files exist
- ✅ No duplicate IDs

### Check Audio Files

```bash
npm run check-audio
```

This verifies:
- ✅ All referenced audio files exist
- ✅ Audio files are referenced in content

### Test in Game

1. **Start development server:**
   ```bash
   npm run dev
   ```

2. **Create a test room** with the games you updated

3. **Play through** the updated content

4. **Check both languages** (switch language if available)

## Best Practices

### Content Quality

1. **Proofread** all text (English and Czech)
2. **Keep it appropriate** for family audiences
3. **Maintain consistency** in difficulty level
4. **Test both languages** before committing

### Code Quality

1. **Follow ID conventions** (trivia_1, pic_2, etc.)
2. **Use sequential IDs** (don't skip numbers unnecessarily)
3. **Keep arrays sorted** (by ID if possible)
4. **Add comments** for complex logic or special cases

### Translation Quality

1. **Use native speakers** for translations when possible
2. **Keep cultural context** in mind (not just literal translations)
3. **Test translations** with native speakers
4. **Consistent terminology** across all content

### Audio Quality

1. **Good audio quality** (no heavy compression artifacts)
2. **Appropriate length** (10-30 seconds for song clips)
3. **Clear audio** (no background noise)
4. **Legal use** (ensure you have rights to use the audio)

### Version Control

1. **Commit content updates** separately from code changes
2. **Use descriptive commit messages:**
   ```
   "Add 10 new trivia questions about Christmas movies"
   "Fix typo in Family Feud question ff_5"
   "Add Czech translation for would_you_rather items 15-20"
   ```
3. **Review changes** before committing (especially translations)

## Troubleshooting

### Content Not Showing

- Check that item ID is unique
- Verify TypeScript compiles without errors
- Ensure item is in the correct array
- Check browser console for errors

### Audio Not Playing

- Verify file exists in `public/audio/christmas_songs/`
- Check path in `audioSrc` matches actual file location
- Ensure file is MP3 format
- Check browser console for 404 errors

### Translation Missing

- Verify both `en` and `cs` fields are present
- Check for typos in field names
- Ensure translations aren't empty strings

### TypeScript Errors

- Run `npm run build` to see all errors
- Check that interfaces match (all required fields present)
- Verify IDs are strings
- Ensure arrays contain the correct types

## Quick Reference

| Task | Command | File Location |
|------|---------|---------------|
| Validate content | `npm run validate-content` | `scripts/validate-content.mjs` |
| Check audio files | `npm run check-audio` | `scripts/check-audio-files.mjs` |
| Find unused audio | `npm run find-unused-audio` | `scripts/find-unused-audio.mjs` |
| Add trivia | Edit | `content/trivia_christmas.ts` |
| Add song | Edit + Add audio file | `content/guess_the_song_christmas.ts` + `public/audio/` |
| Add pictionary | Edit | `content/pictionary_christmas.ts` |

## Need Help?

- Check the code examples in existing content files
- Review TypeScript interfaces at the top of each content file
- Run validation scripts to catch errors early
- Test changes in a development environment before deploying




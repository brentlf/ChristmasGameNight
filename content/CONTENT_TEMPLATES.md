# Content Templates

Quick reference templates for adding new content items to each game type.

## Trivia Question

```typescript
{
  id: 'trivia_N',  // Replace N with next sequential number
  question: {
    en: 'Your question here?',
    cs: 'Vaše otázka zde?',
  },
  options: {
    en: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
    cs: ['Možnost 1', 'Možnost 2', 'Možnost 3', 'Možnost 4'],
  },
  correctIndex: 0,  // 0-3, index of correct answer
},
```

## Family Feud Question

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
      text: { en: 'Most common answer', cs: 'Nejčastější odpověď' },
      points: 30,
      aliases: ['Alternative name 1', 'Alternative name 2'],  // Optional
    },
    {
      id: 'ff_N_b',
      text: { en: 'Second most common', cs: 'Druhá nejčastější' },
      points: 25,
      aliases: [],  // Optional
    },
    {
      id: 'ff_N_c',
      text: { en: 'Third most common', cs: 'Třetí nejčastější' },
      points: 20,
    },
    {
      id: 'ff_N_d',
      text: { en: 'Fourth most common', cs: 'Čtvrtá nejčastější' },
      points: 15,
    },
    {
      id: 'ff_N_e',
      text: { en: 'Fifth most common', cs: 'Pátá nejčastější' },
      points: 10,
    },
  ],
},
```

## Guess the Song (Song Title Variant)

```typescript
{
  id: 'song_N',
  audioSrc: '/audio/christmas_songs/filename.mp3',  // Must exist in public/audio/christmas_songs/
  variant: 'song_title',
  questionText: {
    en: 'Which song is this?',
    cs: 'Která písnička to je?',
  },
  correctAnswer: {
    en: 'Song Title',
    cs: 'Název písně',
  },
  options: {
    en: ['Correct Answer', 'Wrong Answer 1', 'Wrong Answer 2', 'Wrong Answer 3'],
    cs: ['Správná odpověď', 'Špatná odpověď 1', 'Špatná odpověď 2', 'Špatná odpověď 3'],
  },
  correctIndex: 0,
},
```

## Guess the Song (Artist Variant)

```typescript
{
  id: 'song_N',
  audioSrc: '/audio/christmas_songs/filename.mp3',
  variant: 'artist',
  questionText: {
    en: 'Who performs this song?',
    cs: 'Kdo tuto píseň zpívá?',
  },
  correctAnswer: {
    en: 'Artist Name',
    cs: 'Jméno umělce',
  },
  options: {
    en: ['Correct Artist', 'Wrong Artist 1', 'Wrong Artist 2', 'Wrong Artist 3'],
    cs: ['Správný umělec', 'Špatný umělec 1', 'Špatný umělec 2', 'Špatný umělec 3'],
  },
  correctIndex: 0,
},
```

## Guess the Song (Movie Variant)

```typescript
{
  id: 'song_N',
  audioSrc: '/audio/christmas_songs/filename.mp3',
  variant: 'movie',
  questionText: {
    en: 'Which movie features this song?',
    cs: 'Ve kterém filmu zazní tato píseň?',
  },
  correctAnswer: {
    en: 'Movie Title',
    cs: 'Název filmu',
  },
  options: {
    en: ['Correct Movie', 'Wrong Movie 1', 'Wrong Movie 2', 'Wrong Movie 3'],
    cs: ['Správný film', 'Špatný film 1', 'Špatný film 2', 'Špatný film 3'],
  },
  correctIndex: 0,
},
```

## Guess the Song (Lyrics Variant)

```typescript
{
  id: 'song_N',
  audioSrc: '/audio/christmas_songs/filename.mp3',
  variant: 'lyrics',
  questionText: {
    en: 'Which song starts with this lyric: "First line of song"?',
    cs: 'Která píseň začíná textem: "První řádek písně"?',
  },
  correctAnswer: {
    en: 'Song Title',
    cs: 'Název písně',
  },
  options: {
    en: ['Correct Song', 'Wrong Song 1', 'Wrong Song 2', 'Wrong Song 3'],
    cs: ['Správná píseň', 'Špatná píseň 1', 'Špatná píseň 2', 'Špatná píseň 3'],
  },
  correctIndex: 0,
},
```

## Pictionary Prompt

```typescript
{
  id: 'pic_N',
  prompt: {
    en: 'Thing to draw',
    cs: 'Věc k nakreslení',
  },
},
```

## Would You Rather

```typescript
{
  id: 'wyr_N',
  prompt: {
    en: 'Option A 🎄 or Option B ❄️?',
    cs: 'Možnost A 🎄 nebo Možnost B ❄️?',
  },
  optionA: {
    en: 'Description of option A',
    cs: 'Popis možnosti A',
  },
  optionB: {
    en: 'Description of option B',
    cs: 'Popis možnosti B',
  },
},
```

## Emoji Movies

```typescript
{
  id: 'emoji_N',
  emoji: '🎄👹',  // 2-4 emojis that represent the movie
  correct: {
    en: 'Movie Title',
    cs: 'Název filmu',
  },
  acceptedAliases: {
    en: ['Alternative Title 1', 'Alternative Title 2'],
    cs: ['Alternativní název 1', 'Alternativní název 2'],
  },
  decoyOptions: {
    en: ['Wrong Answer 1', 'Wrong Answer 2', 'Wrong Answer 3'],
    cs: ['Špatná odpověď 1', 'Špatná odpověď 2', 'Špatná odpověď 3'],
  },
},
```

## ID Numbering Reference

When adding new items, use the next sequential number:

- **Trivia**: Check last `trivia_N` ID, use `trivia_N+1`
- **Family Feud**: Check last `ff_N` ID, use `ff_N+1`
- **Songs**: Check last `song_N` ID, use `song_N+1`
- **Pictionary**: Check last `pic_N` ID, use `pic_N+1`
- **Would You Rather**: Check last `wyr_N` ID, use `wyr_N+1`
- **Emoji**: Check last `emoji_N` ID, use `emoji_N+1`

## Quick Copy-Paste Checklist

Before adding content:

- [ ] Checked existing IDs to find next number
- [ ] Added both English (en) and Czech (cs) translations
- [ ] Verified all required fields are present
- [ ] For songs: Audio file exists in `public/audio/christmas_songs/`
- [ ] For trivia/songs: correctIndex is 0-3
- [ ] Ran validation: `npm run validate-content`
- [ ] Tested in game (both languages)





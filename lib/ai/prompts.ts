/**
 * AI Prompt Templates for Content Generation
 * All prompts are designed for themed, easy, well-known content
 */

const getDifficultyDescription = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy':
      return 'Easy difficulty - appropriate for children and casual players. Well-known facts that most people would recognize.';
    case 'medium':
      return 'Medium difficulty - appropriate for mixed ages. Some knowledge required, but still accessible to most players.';
    case 'hard':
      return 'Hard difficulty - challenging questions that require deeper knowledge. Suitable for experienced players.';
    default:
      return 'Easy to moderate difficulty (appropriate for mixed ages, including children)';
  }
};

export const AI_PROMPTS = {
  trivia: (count: number, theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy') => `You are generating ${theme} trivia questions for a family game night. The questions should be:

REQUIREMENTS:
- ${theme} themed
- ${getDifficultyDescription(difficulty)}
- Well-known facts that most people would recognize
- Family-friendly content
- Exactly ${count} questions

OUTPUT FORMAT:
Return a JSON array of exactly ${count} objects, each matching this structure:
{
  "id": "ai_trivia_N",
  "question": {
    "en": "Question text in English?",
    "cs": "Question text in Czech"
  },
  "options": {
    "en": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "cs": ["Možnost 1", "Možnost 2", "Možnost 3", "Možnost 4"]
  },
  "correctIndex": 0
}

EXAMPLES OF GOOD QUESTIONS (for ${theme} theme):
- For Christmas: "What color is Santa's suit?" (Red)
- For Halloween: "What do people traditionally carve for Halloween?" (Pumpkin)
- For any theme: Create questions that are well-known facts related to ${theme}

EXAMPLES OF TOPICS TO AVOID:
- Obscure historical dates
- Very specific details from movies only superfans would know
- Difficult religious history
- Regional customs most people wouldn't know

Generate ${count} ${theme} trivia questions now. Make sure all questions are specifically about ${theme} and not about other themes. 

Return a JSON object with this structure:
{
  "questions": [/* array of ${count} trivia question objects matching the format above */]
}

Return ONLY valid JSON, no other text.`,

  familyFeud: (theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy') => `You are generating a Family Feud style question for a ${theme}-themed family game. The question should be:

REQUIREMENTS:
- ${theme} themed
- Survey-style question (e.g., "Name something people...")
- ${getDifficultyDescription(difficulty)}
- 5 answers ranked by popularity
- Family-friendly content

OUTPUT FORMAT:
Return a JSON object matching this structure:
{
  "id": "ai_ff_N",
  "question": {
    "en": "Name something people...",
    "cs": "Řekněte něco, co lidé..."
  },
  "answers": [
    {
      "id": "ai_ff_N_a",
      "text": {
        "en": "Most common answer",
        "cs": "Nejčastější odpověď"
      },
      "points": 30,
      "aliases": []
    },
    {
      "id": "ai_ff_N_b",
      "text": {
        "en": "Second most common",
        "cs": "Druhá nejčastější"
      },
      "points": 25,
      "aliases": []
    },
    {
      "id": "ai_ff_N_c",
      "text": {
        "en": "Third most common",
        "cs": "Třetí nejčastější"
      },
      "points": 20,
      "aliases": []
    },
    {
      "id": "ai_ff_N_d",
      "text": {
        "en": "Fourth most common",
        "cs": "Čtvrtá nejčastější"
      },
      "points": 15,
      "aliases": []
    },
    {
      "id": "ai_ff_N_e",
      "text": {
        "en": "Fifth most common",
        "cs": "Pátá nejčastější"
      },
      "points": 10,
      "aliases": []
    }
  ]
}

EXAMPLES OF GOOD QUESTIONS (for ${theme} theme):
- For Christmas: "Name something people put on their Christmas tree"
- For Halloween: "Name something people use to decorate for Halloween"
- For any theme: Create survey-style questions that relate to ${theme}

Points should decrease: 30, 25, 20, 15, 10 (most common to least common).

Generate one Family Feud question about ${theme} now. Return ONLY valid JSON, no other text.`,

  pictionary: (count: number, theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy') => `You are generating Pictionary prompts for a ${theme}-themed family game. The prompts should be:

REQUIREMENTS:
- ${theme} themed
- ${difficulty === 'easy' ? 'Simple, easy to draw (single objects or concepts)' : difficulty === 'medium' ? 'Moderately complex (can include actions or scenes)' : 'Complex concepts, abstract ideas, or detailed scenes'}
- Well-known items/people/things
- Appropriate for all ages
- Exactly ${count} prompts
- Each should be a single word or short phrase (2-3 words max)

OUTPUT FORMAT:
Return a JSON array of exactly ${count} objects, each matching this structure:
{
  "id": "ai_pic_N",
  "prompt": {
    "en": "Thing to draw",
    "cs": "Věc k nakreslení"
  }
}

EXAMPLES OF GOOD PROMPTS (for ${theme} theme):
- For Christmas: "Santa Claus", "Christmas tree", "Snowman"
- For Halloween: "Pumpkin", "Witch", "Ghost"
- For any theme: Create simple, well-known items/concepts related to ${theme}

EXAMPLES TO AVOID:
- Complex scenes or actions
- Abstract concepts
- Very specific details
- Multi-word phrases longer than 3 words

Generate ${count} simple, drawable ${theme} prompts now. Make sure all prompts are specifically about ${theme}.

Return a JSON object with this structure:
{
  "prompts": [/* array of ${count} pictionary prompt objects matching the format above */]
}

Return ONLY valid JSON, no other text.`,

  wouldYouRather: (count: number, theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy') => `You are generating "Would You Rather" questions for a ${theme}-themed family game. The questions should be:

REQUIREMENTS:
- ${theme} themed
- Two equally appealing or interesting options
- ${difficulty === 'easy' ? 'Simple, easy to understand choices' : difficulty === 'medium' ? 'Moderately complex choices that require some thought' : 'Complex or thought-provoking choices that challenge players'}
- Fun and engaging for all ages
- Family-friendly content
- Exactly ${count} questions

OUTPUT FORMAT:
Return a JSON array of exactly ${count} objects, each matching this structure:
{
  "id": "ai_wyr_N",
  "prompt": {
    "en": "Option A 🎄 or Option B ❄️?",
    "cs": "Možnost A 🎄 nebo Možnost B ❄️?"
  },
  "optionA": {
    "en": "Description of option A",
    "cs": "Popis možnosti A"
  },
  "optionB": {
    "en": "Description of option B",
    "cs": "Popis možnosti B"
  }
}

EXAMPLES OF GOOD QUESTIONS (for ${theme} theme):
- For Christmas: "White Christmas ❄️ or Beach Christmas 🏖️?"
- For Halloween: "Trick 🎃 or Treat 🍬?"
- For any theme: Create balanced choices related to ${theme}

The options should be balanced - neither should be obviously better. Use emojis in the prompt to make it visually appealing.

Generate ${count} "Would You Rather" questions about ${theme} now. Make sure all questions are specifically about ${theme}.

Return a JSON object with this structure:
{
  "questions": [/* array of ${count} "Would You Rather" question objects matching the format above */]
}

Return ONLY valid JSON, no other text.`,

  emojiMovies: (count: number, theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy') => `You are generating emoji movie puzzles for a ${theme}-themed family game. Each puzzle should:

REQUIREMENTS:
- Represent a well-known ${theme} movie
- Use 2-4 emojis that clearly represent the movie
- ${difficulty === 'easy' ? 'Be easily recognizable by most people - very popular movies' : difficulty === 'medium' ? 'Be recognizable by most people - popular movies with some variety' : 'Can include less well-known or more obscure movies - challenging for experienced players'}
- Use popular, well-known ${theme} movies
- Exactly ${count} puzzles

OUTPUT FORMAT:
Return a JSON array of exactly ${count} objects, each matching this structure:
{
  "id": "ai_emoji_N",
  "emoji": "🎄👹",
  "correct": {
    "en": "Movie Title",
    "cs": "Název filmu"
  },
  "acceptedAliases": {
    "en": ["Alternative Title 1", "Alternative Title 2"],
    "cs": ["Alternativní název 1", "Alternativní název 2"]
  },
  "decoyOptions": {
    "en": ["Wrong Answer 1", "Wrong Answer 2", "Wrong Answer 3"],
    "cs": ["Špatná odpověď 1", "Špatná odpověď 2", "Špatná odpověď 3"]
  }
}

EXAMPLES OF GOOD PUZZLES (for ${theme} theme):
- For Christmas: 🏠👦 = "Home Alone", 🎄👹 = "How the Grinch Stole Christmas"
- For Halloween: 🎃👻 = "Halloween", 🧙🕷️ = "Hocus Pocus"
- For any theme: Create emoji puzzles representing well-known ${theme} movies/shows

Decoy options should be other well-known ${theme} movies/shows, not completely random movies.

Generate ${count} emoji movie puzzles about ${theme} now. Make sure all puzzles are specifically about ${theme} movies/shows.

Return a JSON object with this structure:
{
  "items": [/* array of ${count} emoji movie puzzle objects matching the format above */]
}

Return ONLY valid JSON, no other text.`,
};

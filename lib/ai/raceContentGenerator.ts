/**
 * AI Content Generators for Amazing Race stages
 * Generates riddles, trivia, emoji clues for race stages
 */

import type { Riddle, TriviaQuestion, EmojiClue } from '@/types';
import { AI_PROMPTS } from './prompts';
import { generateAITriviaQuestionsServer, generateAIEmojiMoviesServer } from './serverContentGenerator';

/**
 * Generate a single riddle using AI
 */
async function generateAIRiddle(theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy', model: string = 'gpt-4o-mini'): Promise<Riddle> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

  const getDifficultyDescription = (difficulty: 'easy' | 'medium' | 'hard'): string => {
    switch (difficulty) {
      case 'easy':
        return 'Easy difficulty - appropriate for children and casual players. Well-known concepts that most people would recognize.';
      case 'medium':
        return 'Medium difficulty - appropriate for mixed ages. Some knowledge required, but still accessible to most players.';
      case 'hard':
        return 'Hard difficulty - challenging riddles that require deeper knowledge. Suitable for experienced players.';
      default:
        return 'Easy to moderate difficulty (appropriate for mixed ages, including children)';
    }
  };

  const prompt = `You are generating a ${theme} riddle for a family game. The riddle should be:

REQUIREMENTS:
- ${theme} themed
- ${getDifficultyDescription(difficulty)}
- Well-known concepts that most people would recognize
- Family-friendly content
- Have a clear, fun answer

OUTPUT FORMAT:
Return a JSON object matching this structure:
{
  "id": "ai_riddle_N",
  "prompt": {
    "en": "Riddle question text in English?",
    "cs": "Riddle question text in Czech"
  },
  "answers": {
    "en": ["primary answer", "alternative answer 1", "alternative answer 2"],
    "cs": ["hlavní odpověď", "alternativní odpověď 1", "alternativní odpověď 2"]
  },
  "hint": {
    "en": "First hint in English",
    "cs": "První nápověda v češtině"
  },
  "additionalClue": {
    "en": "Additional clue after 3 attempts in English",
    "cs": "Další nápověda po 3 pokusech v češtině"
  },
  "secondHint": {
    "en": "Second hint after 6 attempts in English",
    "cs": "Druhá nápověda po 6 pokusech v češtině"
  }
}

EXAMPLES OF GOOD RIDDLES:
- "I'm not a gift, but I'm wrapped. I'm not a tree, but I'm topped. What am I?" (Answer: Christmas cracker)
- "I have a carrot nose, I wear a hat, and I melt if it gets warm. What am I?" (Answer: Snowman)

Generate one ${theme} riddle now. Return ONLY valid JSON, no other text.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that generates content for family games. The theme for this game is: ${theme}. Always return valid JSON matching the exact format specified. Never add explanatory text outside the JSON.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'OpenAI API error' }));
    throw new Error(error.error?.message || error.message || 'Failed to generate riddle');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  // Parse JSON response
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }

  const parsed = JSON.parse(jsonStr);
  const riddle = parsed.riddle || parsed;

  return {
    id: riddle.id || `ai_riddle_${Date.now()}`,
    prompt: {
      en: riddle.prompt?.en || riddle.prompt || '',
      cs: riddle.prompt?.cs || riddle.prompt || '',
    },
    answers: {
      en: Array.isArray(riddle.answers?.en) ? riddle.answers.en : [riddle.answers?.en || riddle.answer || ''],
      cs: Array.isArray(riddle.answers?.cs) ? riddle.answers.cs : [riddle.answers?.cs || riddle.answer || ''],
    },
    hint: riddle.hint ? {
      en: riddle.hint.en || riddle.hint || '',
      cs: riddle.hint.cs || riddle.hint || '',
    } : undefined,
    additionalClue: riddle.additionalClue ? {
      en: riddle.additionalClue.en || riddle.additionalClue || '',
      cs: riddle.additionalClue.cs || riddle.additionalClue || '',
    } : undefined,
    secondHint: riddle.secondHint ? {
      en: riddle.secondHint.en || riddle.secondHint || '',
      cs: riddle.secondHint.cs || riddle.secondHint || '',
    } : undefined,
  } as Riddle;
}

/**
 * Generate AI content for all race stages
 */
export async function generateAIRaceContent(
  roomId: string,
  trackId: string,
  stages: Array<{ id: string; type: string; content?: any }>,
  theme: string = 'Christmas',
  difficulty: 'easy' | 'medium' | 'hard' = 'easy'
): Promise<Record<string, any>> {
  const raceContent: Record<string, any> = {};
  
  // Generate seed from roomId for consistency
  const seedStr = roomId;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;
  }
  const seedNum = Math.abs(seed);

  for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
    const stage = stages[stageIndex];
    
    try {
      switch (stage.type) {
        case 'riddle_gate':
        case 'final_riddle': {
          const pickCount = stage.content?.pick ?? 1;
          if (pickCount > 1 && stage.type === 'riddle_gate') {
            // Generate multiple riddles
            const riddles: Riddle[] = [];
            for (let i = 0; i < pickCount; i++) {
              const riddle = await generateAIRiddle(theme, difficulty);
              riddle.id = `ai_riddle_${roomId}_${stage.id}_${i}`;
              riddles.push(riddle);
            }
            raceContent[stage.id] = {
              riddleIds: riddles.map(r => r.id),
              riddles: riddles,
            };
          } else {
            // Single riddle
            const riddle = await generateAIRiddle(theme, difficulty);
            riddle.id = `ai_riddle_${roomId}_${stage.id}`;
            raceContent[stage.id] = { riddleId: riddle.id, riddle };
          }
          break;
        }
        case 'trivia_solo': {
          const pickCount = stage.content?.pick ?? 5;
          const triviaQuestions = await generateAITriviaQuestionsServer(pickCount, theme, difficulty);
          // Map to race trivia format (race uses different format - single prompt string, not bilingual)
          const raceTrivia = triviaQuestions.map((q, idx) => ({
            id: `ai_race_trivia_${roomId}_${stage.id}_${idx}`,
            prompt: typeof q.question === 'string' ? q.question : (q.question?.en || ''), // Race uses single language prompt
            options: Array.isArray(q.options) ? q.options : (q.options?.en || []),
            correctIndex: q.correctIndex,
            difficulty: 'easy' as const,
          }));
          raceContent[stage.id] = {
            questionIds: raceTrivia.map(q => q.id),
            questions: raceTrivia,
          };
          break;
        }
        case 'emoji_guess': {
          const pickCount = stage.content?.pick ?? 5;
          const emojiItems = await generateAIEmojiMoviesServer(pickCount, theme, difficulty);
          // Map to race emoji clue format
          const raceEmoji = emojiItems.map((item, idx) => ({
            id: `ai_race_emoji_${roomId}_${stage.id}_${idx}`,
            emoji: item.emoji,
            category: 'movie' as const, // Default to movie, could be enhanced
            correct: item.correct,
            options: {
              en: [item.correct.en, ...item.decoyOptions.en.slice(0, 3)],
              cs: [item.correct.cs, ...item.decoyOptions.cs.slice(0, 3)],
            },
          }));
          raceContent[stage.id] = {
            clueIds: raceEmoji.map(c => c.id),
            clues: raceEmoji,
          };
          break;
        }
        case 'code_lock':
        case 'photo_scavenger':
          // These stage types don't support AI generation (code puzzles and photo prompts need manual creation)
          // Use static content for these
          break;
      }
    } catch (error) {
      console.error(`Error generating AI content for stage ${stage.id}:`, error);
      // Continue with other stages
    }
  }

  return raceContent;
}



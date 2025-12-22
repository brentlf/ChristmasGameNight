/**
 * Server-side AI Content Generator
 * Can be used in API routes and server-side code
 */

import type { TriviaItem } from '@/content/trivia_christmas';
import type { FamilyFeudQuestion } from '@/content/family_feud_christmas';
import type { PictionaryItem } from '@/content/pictionary_christmas';
import type { WouldYouRatherItem } from '@/content/would_you_rather_christmas';
import type { EmojiItem } from '@/content/emoji_movies_christmas';
import { AI_PROMPTS } from './prompts';

/**
 * Calls OpenAI API to generate content (server-side version)
 */
async function callOpenAIServer(prompt: string, theme: string = 'Christmas', model: string = 'gpt-4o-mini'): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }

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
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'OpenAI API error' }));
    throw new Error(error.error?.message || error.message || 'Failed to generate content');
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No content returned from OpenAI');
  }

  return content;
}

/**
 * Parse JSON response, handling cases where it's wrapped in code blocks
 */
function parseJSONResponse(text: string): any {
  // Remove markdown code blocks if present
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    // If it's an array response (some prompts return arrays)
    // Try to extract JSON array
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      return JSON.parse(arrayMatch[0]);
    }
    throw new Error(`Failed to parse JSON: ${error}`);
  }
}

/**
 * Generate trivia questions using AI (server-side)
 */
export async function generateAITriviaQuestionsServer(count: number = 10, theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy'): Promise<TriviaItem[]> {
  try {
    const prompt = AI_PROMPTS.trivia(count, theme, difficulty);
    const response = await callOpenAIServer(prompt, theme);
    const parsed = parseJSONResponse(response);
    
    // Handle both array and object with array property (JSON mode returns objects)
    const questions = parsed.questions || parsed.items || (Array.isArray(parsed) ? parsed : []);
    
    // Validate and ensure correct format
    return questions.map((q: any, index: number) => ({
      id: q.id || `ai_trivia_${Date.now()}_${index}`,
      question: {
        en: q.question?.en || q.question || '',
        cs: q.question?.cs || q.question || '',
      },
      options: {
        en: Array.isArray(q.options?.en) ? q.options.en : q.options?.en?.split?.('|') || q.options || [],
        cs: Array.isArray(q.options?.cs) ? q.options.cs : q.options?.cs?.split?.('|') || q.options || [],
      },
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
    })) as TriviaItem[];
  } catch (error) {
    console.error('Error generating AI trivia:', error);
    throw error;
  }
}

/**
 * Generate Family Feud question using AI (server-side)
 */
export async function generateAIFamilyFeudQuestionServer(theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy'): Promise<FamilyFeudQuestion> {
  try {
    const prompt = AI_PROMPTS.familyFeud(theme, difficulty);
    const response = await callOpenAIServer(prompt, theme);
    const parsed = parseJSONResponse(response);
    
    // Ensure it has the correct structure
    const question = parsed.question || parsed;
    
    return {
      id: question.id || `ai_ff_${Date.now()}`,
      question: {
        en: question.question?.en || question.question || '',
        cs: question.question?.cs || question.question || '',
      },
      answers: (question.answers || []).map((ans: any, index: number) => ({
        id: ans.id || `${question.id || 'ai_ff'}_${String.fromCharCode(97 + index)}`,
        text: {
          en: ans.text?.en || ans.text || ans.answer || '',
          cs: ans.text?.cs || ans.text || ans.answer || '',
        },
        points: typeof ans.points === 'number' ? ans.points : [30, 25, 20, 15, 10][index] || 10,
        aliases: Array.isArray(ans.aliases) ? ans.aliases : [],
      })),
    } as FamilyFeudQuestion;
  } catch (error) {
    console.error('Error generating AI Family Feud question:', error);
    throw error;
  }
}

/**
 * Generate Pictionary prompts using AI (server-side)
 */
export async function generateAIPictionaryPromptsServer(count: number = 20, theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy'): Promise<PictionaryItem[]> {
  try {
    const prompt = AI_PROMPTS.pictionary(count, theme, difficulty);
    const response = await callOpenAIServer(prompt, theme);
    const parsed = parseJSONResponse(response);
    
    // Handle both array and object with array property (JSON mode returns objects)
    const prompts = parsed.prompts || parsed.items || (Array.isArray(parsed) ? parsed : []);
    
    return prompts.map((p: any, index: number) => ({
      id: p.id || `ai_pic_${Date.now()}_${index}`,
      prompt: {
        en: p.prompt?.en || p.prompt || p.en || '',
        cs: p.prompt?.cs || p.prompt || p.cs || '',
      },
    })) as PictionaryItem[];
  } catch (error) {
    console.error('Error generating AI Pictionary prompts:', error);
    throw error;
  }
}

/**
 * Generate Would You Rather questions using AI (server-side)
 */
export async function generateAIWouldYouRatherServer(count: number = 10, theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy'): Promise<WouldYouRatherItem[]> {
  try {
    const prompt = AI_PROMPTS.wouldYouRather(count, theme, difficulty);
    const response = await callOpenAIServer(prompt, theme);
    const parsed = parseJSONResponse(response);
    
    // Handle both array and object with array property (JSON mode returns objects)
    const questions = parsed.questions || parsed.items || (Array.isArray(parsed) ? parsed : []);
    
    return questions.map((q: any, index: number) => ({
      id: q.id || `ai_wyr_${Date.now()}_${index}`,
      prompt: {
        en: q.prompt?.en || q.prompt || '',
        cs: q.prompt?.cs || q.prompt || '',
      },
      optionA: {
        en: q.optionA?.en || q.optionA || '',
        cs: q.optionA?.cs || q.optionA || '',
      },
      optionB: {
        en: q.optionB?.en || q.optionB || '',
        cs: q.optionB?.cs || q.optionB || '',
      },
    })) as WouldYouRatherItem[];
  } catch (error) {
    console.error('Error generating AI Would You Rather:', error);
    throw error;
  }
}

/**
 * Generate Emoji Movies using AI (server-side)
 */
export async function generateAIEmojiMoviesServer(count: number = 15, theme: string = 'Christmas', difficulty: 'easy' | 'medium' | 'hard' = 'easy'): Promise<EmojiItem[]> {
  try {
    const prompt = AI_PROMPTS.emojiMovies(count, theme, difficulty);
    const response = await callOpenAIServer(prompt, theme);
    const parsed = parseJSONResponse(response);
    
    // Handle both array and object with array property (JSON mode returns objects)
    const items = parsed.items || parsed.movies || (Array.isArray(parsed) ? parsed : []);
    
    return items.map((item: any, index: number) => ({
      id: item.id || `ai_emoji_${Date.now()}_${index}`,
      emoji: item.emoji || '',
      correct: {
        en: item.correct?.en || item.correct || item.movie || '',
        cs: item.correct?.cs || item.correct || item.movie || '',
      },
      acceptedAliases: {
        en: Array.isArray(item.acceptedAliases?.en) ? item.acceptedAliases.en : item.aliases?.en || [],
        cs: Array.isArray(item.acceptedAliases?.cs) ? item.acceptedAliases.cs : item.aliases?.cs || [],
      },
      decoyOptions: {
        en: Array.isArray(item.decoyOptions?.en) ? item.decoyOptions.en : item.decoys?.en || [],
        cs: Array.isArray(item.decoyOptions?.cs) ? item.decoyOptions.cs : item.decoys?.cs || [],
      },
    })) as EmojiItem[];
  } catch (error) {
    console.error('Error generating AI Emoji Movies:', error);
    throw error;
  }
}



import { NextRequest, NextResponse } from 'next/server';
import {
  generateAITriviaQuestions,
  generateAIFamilyFeudQuestion,
  generateAIPictionaryPrompts,
  generateAIWouldYouRather,
  generateAIEmojiMovies,
} from '@/lib/ai/contentGenerators';

export const runtime = 'nodejs'; // Use nodejs runtime for AI generation

export async function POST(request: NextRequest) {
  try {
    const { gameType, count } = await request.json();

    if (!gameType) {
      return NextResponse.json({ error: 'gameType is required' }, { status: 400 });
    }

    let result;
    const effectiveCount = count || 10;

    switch (gameType) {
      case 'trivia':
        result = await generateAITriviaQuestions(effectiveCount);
        break;
      case 'family_feud':
        result = await generateAIFamilyFeudQuestion();
        break;
      case 'pictionary':
        result = await generateAIPictionaryPrompts(effectiveCount);
        break;
      case 'wyr':
        result = await generateAIWouldYouRather(effectiveCount);
        break;
      case 'emoji':
        result = await generateAIEmojiMovies(effectiveCount);
        break;
      default:
        return NextResponse.json({ error: `Unknown game type: ${gameType}` }, { status: 400 });
    }

    return NextResponse.json({ content: result, gameType });
  } catch (error: any) {
    console.error('Error generating AI content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}



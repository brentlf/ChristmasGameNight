import { NextRequest, NextResponse } from 'next/server';
import type { MiniGameType } from '@/types';
import {
  generateAIFamilyFeudQuestionServer,
  generateAIEmojiMoviesServer,
  generateAIPictionaryPromptsServer,
  generateAITriviaQuestionsServer,
  generateAIWouldYouRatherServer,
} from '@/lib/ai/serverContentGenerator';
import { shuffleSeeded } from '@/lib/utils/seededRandom';

export const runtime = 'nodejs';

function seedFrom(roomId: string, sessionId: string): number {
  const seedStr = `${roomId}_${sessionId}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = ((seed << 5) - seed + seedStr.charCodeAt(i)) | 0;
  }
  return Math.abs(seed);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const roomId = String(body?.roomId ?? '');
    const sessionId = String(body?.sessionId ?? '');
    const gameId = body?.gameId as MiniGameType | undefined;
    const count = Number(body?.count ?? 0);
    const theme = String(body?.theme ?? 'Christmas').trim() || 'Christmas';
    const difficulty = (body?.difficulty ?? 'easy') as 'easy' | 'medium' | 'hard';

    if (!roomId || !sessionId || !gameId || !count || count < 1) {
      return NextResponse.json(
        { error: 'roomId, sessionId, gameId, and count are required' },
        { status: 400 }
      );
    }

    if (gameId === 'guess_the_song') {
      return NextResponse.json({ error: 'AI generation not supported for guess_the_song' }, { status: 400 });
    }

    const seed = seedFrom(roomId, sessionId);

    let contentItems: any[] = [];
    switch (gameId) {
      case 'trivia':
        contentItems = await generateAITriviaQuestionsServer(count, theme, difficulty);
        break;
      case 'emoji':
        contentItems = await generateAIEmojiMoviesServer(count, theme, difficulty);
        break;
      case 'wyr':
        contentItems = await generateAIWouldYouRatherServer(count, theme, difficulty);
        break;
      case 'pictionary':
        contentItems = await generateAIPictionaryPromptsServer(count, theme, difficulty);
        break;
      case 'family_feud': {
        const questions: any[] = [];
        for (let i = 0; i < count; i++) {
          const q = await generateAIFamilyFeudQuestionServer(theme, difficulty);
          q.id = `ai_ff_${sessionId}_${i}`;
          q.answers = (q.answers || []).map((ans: any, idx: number) => ({
            ...ans,
            id: `${q.id}_${String.fromCharCode(97 + idx)}`,
          }));
          questions.push(q);
        }
        contentItems = questions;
        break;
      }
      default:
        return NextResponse.json({ error: `AI generation not supported for ${String(gameId)}` }, { status: 400 });
    }

    const shuffled = shuffleSeeded([...contentItems], seed);
    const chosen = shuffled.slice(0, count);
    const selectedIds = chosen.map((item: any) => String(item?.id ?? '')).filter(Boolean);

    return NextResponse.json({
      theme,
      difficulty,
      selectedIds,
      content: chosen,
      generatedAt: Date.now(),
    });
  } catch (error: any) {
    console.error('Error generating AI session content:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate session content' },
      { status: 500 }
    );
  }
}




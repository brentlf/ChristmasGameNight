import { NextRequest, NextResponse } from 'next/server';
import { familyFeudChristmasPool } from '@/content/family_feud_christmas';
import { fuzzyMatchGuess } from '@/lib/utils/guessing';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const questionId = String(body?.questionId ?? '').trim();
    const guess = String(body?.guess ?? '').trim();
    const lang = (String(body?.lang ?? 'en') as 'en' | 'cs') || 'en';

    if (!questionId || !guess) {
      return NextResponse.json({ error: 'Missing questionId or guess' }, { status: 400 });
    }

    const question = familyFeudChristmasPool.find((q) => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    // Check against all answers for this question
    for (const answer of question.answers) {
      const answerText = answer.text[lang] || answer.text.en;
      
      // Direct match
      if (fuzzyMatchGuess(guess, answerText)) {
        return NextResponse.json({ 
          correct: true, 
          answerId: answer.id,
          points: answer.points 
        });
      }

      // Check aliases
      if (answer.aliases && answer.aliases.length > 0) {
        for (const alias of answer.aliases) {
          if (fuzzyMatchGuess(guess, alias)) {
            return NextResponse.json({ 
              correct: true, 
              answerId: answer.id,
              points: answer.points 
            });
          }
        }
      }
    }

    // No match found
    return NextResponse.json({ correct: false });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 });
  }
}

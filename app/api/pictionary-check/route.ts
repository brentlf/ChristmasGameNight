import { NextRequest, NextResponse } from 'next/server';
import { pictionaryChristmasPool } from '@/content/pictionary_christmas';
import { fuzzyMatchGuess } from '@/lib/utils/guessing';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const promptId = String(body?.promptId ?? '').trim();
    const guess = String(body?.guess ?? '').trim();

    if (!promptId || !guess) {
      return NextResponse.json({ error: 'Missing promptId or guess' }, { status: 400 });
    }

    const prompt = pictionaryChristmasPool.find((p) => p.id === promptId);
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 });
    }

    const correct = fuzzyMatchGuess(guess, prompt.prompt.en) || fuzzyMatchGuess(guess, prompt.prompt.cs);
    // Never return the prompt text/answer.
    return NextResponse.json({ correct });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Internal server error' }, { status: 500 });
  }
}







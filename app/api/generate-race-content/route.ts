import { NextRequest, NextResponse } from 'next/server';
import { generateAIRaceContent } from '@/lib/ai/raceContentGenerator';
import { getRaceTrack } from '@/lib/raceEngine';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { roomId, trackId, theme = 'Christmas', difficulty = 'easy' } = await request.json();

    if (!roomId || !trackId) {
      return NextResponse.json({ error: 'roomId and trackId are required' }, { status: 400 });
    }

    const track = getRaceTrack(trackId);
    const stages = track.stages.map((s: any) => ({ id: s.id, type: s.type, content: s.content }));
    const raceContent = await generateAIRaceContent(roomId, trackId, stages, theme, difficulty);

    return NextResponse.json({ raceContent });
  } catch (error: any) {
    console.error('Error generating AI race content:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate race content' },
      { status: 500 }
    );
  }
}

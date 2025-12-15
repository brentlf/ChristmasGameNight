import { NextRequest, NextResponse } from 'next/server';
import { traditionsChristmasPool } from '@/content/traditions_christmas';

export const runtime = 'edge';

function safeJsonFromContent(content: string): any {
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  }
  return JSON.parse(jsonStr);
}

function slugifyId(input: string): string {
  const s = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_')
    .slice(0, 48);
  return `ai_${s || 'tradition'}`;
}

export async function POST(_request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    const bannedIds = traditionsChristmasPool.map((t) => t.id);
    const bannedEn = traditionsChristmasPool.map((t) => t.en);
    const bannedCs = traditionsChristmasPool.map((t) => t.cs);

    const systemPrompt =
      'You generate ONE brand-new Christmas tradition idea for families. ' +
      'It must be practical, safe, positive, and not identical to any banned items. ' +
      'Return ONLY valid JSON with keys: id, en, cs (no markdown, no extra text).';

    const userPrompt =
      `BANNED_IDS: ${JSON.stringify(bannedIds)}\n` +
      `BANNED_EN: ${JSON.stringify(bannedEn)}\n` +
      `BANNED_CS: ${JSON.stringify(bannedCs)}\n\n` +
      `Generate ONE new tradition not in the lists above.\n` +
      `Requirements:\n` +
      `- en: one short actionable sentence (max 90 chars)\n` +
      `- cs: Czech translation (max 110 chars)\n` +
      `- id: snake_case, MUST start with "ai_" and be unique vs BANNED_IDS\n` +
      `Output JSON only.`;

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 1.0,
        max_tokens: 180,
      }),
    });

    if (!resp.ok) {
      const error = await resp.json().catch(() => ({ message: 'OpenAI API error' }));
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: error.error?.message || 'Failed to generate tradition' },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    let parsed: any;
    try {
      parsed = safeJsonFromContent(content);
    } catch (e) {
      console.error('Failed to parse AI JSON:', content);
      return NextResponse.json({ error: 'AI returned invalid JSON' }, { status: 500 });
    }

    const en = String(parsed?.en ?? '').trim();
    const cs = String(parsed?.cs ?? '').trim();
    let id = String(parsed?.id ?? '').trim();

    if (!en || !cs) {
      return NextResponse.json({ error: 'AI returned empty tradition text' }, { status: 500 });
    }

    if (!id || !/^ai_[a-z0-9_]+$/.test(id)) {
      id = slugifyId(en);
    }

    const enLc = en.toLowerCase();
    const csLc = cs.toLowerCase();
    const isDup =
      bannedIds.includes(id) ||
      bannedEn.some((x) => x.toLowerCase() === enLc) ||
      bannedCs.some((x) => x.toLowerCase() === csLc);

    if (isDup) {
      return NextResponse.json({ error: 'AI returned a duplicate tradition' }, { status: 500 });
    }

    return NextResponse.json({ id, en, cs });
  } catch (error: any) {
    console.error('AI tradition error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}



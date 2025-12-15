import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge'; // Optional: use edge runtime for faster responses

export async function POST(request: NextRequest) {
  try {
    const { image, mimeType, prompt, lang } = await request.json();

    if (!image || !prompt) {
      return NextResponse.json({ error: 'Missing image or prompt' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 });
    }

    // Prepare the prompt for OpenAI
    const systemPrompt = lang === 'cs'
      ? 'Jsi pomocník pro validaci fotografií. Analyzuj, zda fotografie odpovídá zadanému úkolu. Odpověz JSON ve formátu: {"valid": true/false, "confidence": 0.0-1.0, "reason": "krátké vysvětlení"}.'
      : 'You are a photo validation assistant. Analyze whether the photo matches the given task. Respond with JSON in format: {"valid": true/false, "confidence": 0.0-1.0, "reason": "brief explanation"}.';

    const userPrompt = lang === 'cs'
      ? `Úkol: ${prompt}\n\nOdpovídá tato fotografie úkolu?`
      : `Task: ${prompt}\n\nDoes this photo match the task?`;

    // Call OpenAI Vision API (GPT-4 Vision or gpt-4o)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o', // or 'gpt-4-vision-preview' if gpt-4o unavailable
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${image}`,
                },
              },
            ],
          },
        ],
        max_tokens: 150,
        temperature: 0.3, // Lower temperature for more consistent validation
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'OpenAI API error' }));
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: error.error?.message || 'Failed to validate photo' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    // Parse JSON response (handle markdown code blocks if present)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }

    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch {
      // Fallback: try to extract valid/confidence from text
      const validMatch = jsonStr.match(/valid["\s:]+(true|false)/i);
      const confMatch = jsonStr.match(/confidence["\s:]+([0-9.]+)/i);
      result = {
        valid: validMatch ? validMatch[1].toLowerCase() === 'true' : false,
        confidence: confMatch ? parseFloat(confMatch[1]) : 0.5,
        reason: content.substring(0, 100),
      };
    }

    // Ensure valid boolean and confidence 0-1
    const valid = Boolean(result.valid);
    const confidence = Math.max(0, Math.min(1, Number(result.confidence) || 0.5));

    // Consider valid if confidence >= 0.6 (family-friendly threshold)
    return NextResponse.json({
      valid: valid && confidence >= 0.6,
      confidence,
      reason: result.reason || (valid ? 'Photo matches the task' : 'Photo does not match the task'),
    });
  } catch (error: any) {
    console.error('Photo validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}



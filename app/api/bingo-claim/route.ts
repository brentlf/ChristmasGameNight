export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  // This endpoint is intentionally disabled. If you see requests hitting it, some client is stale.
  console.warn('[API] /api/bingo-claim called (deprecated). Refresh all clients.', body);
  return NextResponse.json(
    {
      error:
        'Deprecated endpoint. Refresh all clients (phone + TV tabs). Bingo claim now runs client-side via Firestore.',
    },
    { status: 410 }
  );
}


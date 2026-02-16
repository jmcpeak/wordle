import { NextResponse } from 'next/server';
import { ensureSchema } from '@/db/schema';

/**
 * Deploy-time schema setup. Call this once after deploy (e.g. from CI or a script).
 * Protected by DB_INIT_SECRET; returns 401 if missing or wrong.
 *
 * Example: curl "https://your-app.com/api/db/ensure-schema?secret=YOUR_DB_INIT_SECRET"
 * Or: Authorization: Bearer YOUR_DB_INIT_SECRET
 */
async function handleEnsureSchema(request: Request) {
  const secret = process.env.DB_INIT_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: 'DB_INIT_SECRET not configured' },
      { status: 501 },
    );
  }

  const authHeader = request.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const urlSecret = new URL(request.url).searchParams.get('secret');
  let bodySecret: string | null = null;
  if (request.method === 'POST') {
    try {
      const b = await request.json().catch(() => ({}));
      bodySecret = typeof b?.secret === 'string' ? b.secret : null;
    } catch {
      // ignore
    }
  }

  const provided = bearer ?? urlSecret ?? bodySecret;
  if (provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSchema();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('ensureSchema failed:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Schema setup failed' },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return handleEnsureSchema(request);
}

export async function POST(request: Request) {
  return handleEnsureSchema(request);
}

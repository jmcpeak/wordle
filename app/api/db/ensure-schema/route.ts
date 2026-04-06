import { NextResponse } from 'next/server';
import { ensureSchema } from '@/db/schema';

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

async function getBodySecret(request: Request): Promise<string | null> {
  try {
    const body = (await request.json()) as { secret?: unknown };
    return typeof body.secret === 'string' ? body.secret : null;
  } catch {
    return null;
  }
}

/**
 * Deploy-time schema setup. Call this once after deploy from CI or a script.
 * Protected by DB_INIT_SECRET; accepts Authorization: Bearer <secret>
 * or a JSON POST body { "secret": "..." }.
 *
 * Example:
 * curl -X POST "https://your-app.com/api/db/ensure-schema" \
 *   -H "Authorization: Bearer YOUR_DB_INIT_SECRET"
 */
export async function GET() {
  return errorResponse('Method not allowed. Use POST.', 405);
}

export async function POST(request: Request) {
  const secret = process.env.DB_INIT_SECRET;
  if (!secret) {
    return errorResponse('DB_INIT_SECRET not configured', 501);
  }

  const authHeader = request.headers.get('authorization');
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const bodySecret = bearer ? null : await getBodySecret(request);

  const provided = bearer ?? bodySecret;
  if (provided !== secret) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    await ensureSchema();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('ensureSchema failed:', err);
    return errorResponse(
      err instanceof Error ? err.message : 'Schema setup failed',
      500,
    );
  }
}

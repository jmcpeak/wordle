import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { THEME_MODES } from '@/constants';
import { ensureUserExists, getTheme, setTheme } from '@/db/stats';
import type { ThemeMode } from '@/store/themeStore';

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isThemeMode(value: unknown): value is ThemeMode {
  return (
    typeof value === 'string' &&
    Object.values(THEME_MODES).includes(value as ThemeMode)
  );
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse('Unauthorized', 401);

  try {
    const theme = await getTheme(userId);
    return NextResponse.json({ theme });
  } catch (err) {
    console.error('Error in GET /api/theme:', err);
    return errorResponse('Failed to load theme', 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse('Unauthorized', 401);

  try {
    await ensureUserExists(userId, session.user?.name, session.user?.email);

    let body: { theme?: unknown };
    try {
      body = (await request.json()) as { theme?: unknown };
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    if (!isThemeMode(body.theme)) {
      return errorResponse('Invalid theme value', 400);
    }

    const theme = body.theme;
    await setTheme(userId, theme);
    return NextResponse.json({ theme });
  } catch (err) {
    console.error('Error in POST /api/theme:', err);
    return errorResponse('Failed to update theme', 500);
  }
}

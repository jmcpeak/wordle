import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { ensureUserExists, getTheme, setTheme } from '@/db/stats';
import type { ThemeMode } from '@/store/themeStore';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const theme = await getTheme(userId);
  return NextResponse.json({ theme });
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    await ensureUserExists(userId, session.user?.name, session.user?.email);

    const body = await request.json();
    const { theme } = body as { theme: ThemeMode };
    await setTheme(userId, theme);
    return NextResponse.json({ theme });
  } catch (err) {
    console.error('Error in POST /api/theme:', err);
    return new Response('Failed to update theme', { status: 500 });
  }
}

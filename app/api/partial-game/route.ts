import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MAX_GUESSES, WORD_LENGTH } from '@/constants';
import {
  deletePartialGame,
  ensureUserExists,
  getPartialGame,
  savePartialGame,
} from '@/db/stats';

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isValidGuessesArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= MAX_GUESSES &&
    value.every(
      (g) =>
        typeof g === 'string' && g.length === WORD_LENGTH && /^[A-Z]+$/.test(g),
    )
  );
}

function isValidSolution(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length === WORD_LENGTH &&
    /^[A-Z]+$/.test(value)
  );
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse('Unauthorized', 401);

  try {
    const game = await getPartialGame(userId);
    return NextResponse.json({ game });
  } catch (err) {
    console.error('Error in GET /api/partial-game:', err);
    return errorResponse('Failed to load partial game', 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse('Unauthorized', 401);

  try {
    await ensureUserExists(userId, session.user?.name, session.user?.email);

    let body: { solution?: unknown; guesses?: unknown };
    try {
      body = (await request.json()) as {
        solution?: unknown;
        guesses?: unknown;
      };
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { solution, guesses } = body;

    if (!isValidSolution(solution)) {
      return errorResponse('Invalid solution', 400);
    }

    if (!isValidGuessesArray(guesses)) {
      return errorResponse('Invalid guesses', 400);
    }

    await savePartialGame(userId, solution, guesses);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in POST /api/partial-game:', err);
    return errorResponse('Failed to save partial game', 500);
  }
}

export async function DELETE() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse('Unauthorized', 401);

  try {
    await deletePartialGame(userId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in DELETE /api/partial-game:', err);
    return errorResponse('Failed to delete partial game', 500);
  }
}

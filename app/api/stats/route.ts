import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { MAX_GUESSES, STATS_ACTIONS, WORD_LENGTH } from '@/constants';
import {
  addLoss,
  addWin,
  ensureUserExists,
  getStats,
  resetStats,
} from '@/db/stats';

type StatsAction = (typeof STATS_ACTIONS)[keyof typeof STATS_ACTIONS];

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function isStatsAction(value: unknown): value is StatsAction {
  return (
    typeof value === 'string' &&
    Object.values(STATS_ACTIONS).includes(value as StatsAction)
  );
}

function isValidWinGuessCount(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= MAX_GUESSES
  );
}

function isValidWord(value: unknown): value is string {
  return typeof value === 'string' && value.length === WORD_LENGTH;
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse('Unauthorized', 401);

  try {
    const stats = await getStats(userId);
    return NextResponse.json(stats);
  } catch (err) {
    console.error('Error in GET /api/stats:', err);
    return errorResponse('Failed to load stats', 500);
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return errorResponse('Unauthorized', 401);

  try {
    await ensureUserExists(userId, session.user?.name, session.user?.email);

    let body: {
      action?: unknown;
      guesses?: unknown;
      word?: unknown;
    };
    try {
      body = (await request.json()) as {
        action?: unknown;
        guesses?: unknown;
        word?: unknown;
      };
    } catch {
      return errorResponse('Invalid JSON body', 400);
    }

    const { action, guesses, word } = body;

    if (!isStatsAction(action)) {
      return errorResponse('Invalid stats action', 400);
    }

    if (action === STATS_ACTIONS.ADD_WIN) {
      if (!isValidWinGuessCount(guesses)) {
        return errorResponse('Invalid win guess count', 400);
      }
      if (!isValidWord(word)) {
        return errorResponse('Invalid word', 400);
      }
      await addWin(userId, guesses, word);
    } else if (action === STATS_ACTIONS.ADD_LOSS) {
      if (!isValidWord(word)) {
        return errorResponse('Invalid word', 400);
      }
      await addLoss(userId, word);
    } else if (action === STATS_ACTIONS.RESET) {
      await resetStats(userId);
    }

    const stats = await getStats(userId);
    return NextResponse.json(stats);
  } catch (err) {
    console.error('Error in POST /api/stats:', err);
    return errorResponse('Failed to update stats', 500);
  }
}

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { STATS_ACTIONS } from '@/constants';
import {
  addLoss,
  addWin,
  ensureUserExists,
  getStats,
  resetStats,
} from '@/db/stats';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const stats = await getStats(userId);
  return NextResponse.json(stats);
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  try {
    await ensureUserExists(userId, session.user?.name, session.user?.email);

    const { action, guesses } = await request.json();

    if (action === STATS_ACTIONS.ADD_WIN) {
      await addWin(userId, guesses);
    } else if (action === STATS_ACTIONS.ADD_LOSS) {
      await addLoss(userId);
    } else if (action === STATS_ACTIONS.RESET) {
      await resetStats(userId);
    }

    const stats = await getStats(userId);
    return NextResponse.json(stats);
  } catch (err) {
    console.error('Error in POST /api/stats:', err);
    return new Response('Failed to update stats', { status: 500 });
  }
}

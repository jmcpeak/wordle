import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import GameErrorBoundary from '@/components/GameErrorBoundary';
import GamePage from '@/components/GamePage';
import { pickRandomSolution } from '@/data/wordLists';
import { getPartialGame } from '@/db/stats';
import type { InitialGameSeed } from '@/types';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/signin');
  }

  let initialGame: InitialGameSeed | undefined;
  try {
    const partial = await getPartialGame(session.user.id);
    initialGame = partial ?? {
      solution: pickRandomSolution(),
      guesses: [],
    };
  } catch (err) {
    console.error('Failed to seed initial game:', err);
  }

  return (
    <GameErrorBoundary>
      <GamePage initialGame={initialGame} />
    </GameErrorBoundary>
  );
}

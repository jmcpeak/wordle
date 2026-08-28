import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import GameErrorBoundary from '@/components/GameErrorBoundary';
import GamePage from '@/components/GamePage';

export default async function Home() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/signin');
  }

  // Do not SSR the solution into HTML — a cached PWA shell would replay a stale
  // word. GamePage loads the board from /api/partial-game and /api/word.
  return (
    <GameErrorBoundary>
      <GamePage />
    </GameErrorBoundary>
  );
}

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import GameErrorBoundary from '@/components/GameErrorBoundary';
import GamePage from '@/components/GamePage';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/signin');
  }

  return (
    <GameErrorBoundary>
      <GamePage />
    </GameErrorBoundary>
  );
}

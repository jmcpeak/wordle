import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import GamePage from '@/components/GamePage';

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect('/signin'); // Redirect to the custom sign-in page
  }

  return <GamePage />;
}

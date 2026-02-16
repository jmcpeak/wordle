'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { type ReactNode, useEffect } from 'react';
import ToastSnackbar from '@/components/ToastSnackbar';
import { useStatsStore } from '@/store/statsStore';

type Props = {
  children: ReactNode;
  session: Session | null;
};

export default function ClientProvider({ children, session }: Props) {
  const setFromApiResponse = useStatsStore((state) => state.setFromApiResponse);
  const clearStats = useStatsStore((state) => state.clearStats);

  useEffect(() => {
    if (!session?.user?.id) {
      clearStats();
      return;
    }
    async function fetchStats() {
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const data = (await statsRes.json()) as unknown;
        setFromApiResponse(data);
      }
    }
    fetchStats().catch(console.error);
  }, [session?.user?.id, setFromApiResponse, clearStats]);

  return (
    <SessionProvider session={session}>
      {children}
      <ToastSnackbar />
    </SessionProvider>
  );
}

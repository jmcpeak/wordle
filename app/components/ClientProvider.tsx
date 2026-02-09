'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { type ReactNode, useEffect } from 'react';
import { useStatsStore } from '@/store/statsStore';

type Props = {
  children: ReactNode;
  session: Session | null;
};

export default function ClientProvider({ children, session }: Props) {
  const setStats = useStatsStore((state) => state.setStats);

  useEffect(() => {
    async function fetchStats() {
      if (session?.user?.id) {
        const statsRes = await fetch('/api/stats');
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      }
    }
    fetchStats().catch(console.error);
  }, [session?.user?.id, setStats]);

  return <SessionProvider session={session}>{children}</SessionProvider>;
}

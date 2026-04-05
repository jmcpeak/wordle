'use client';

import type { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import { type ReactNode, useLayoutEffect } from 'react';
import ToastSnackbar from '@/components/ToastSnackbar';
import { useStatsStore } from '@/store/statsStore';

type Props = {
  children: ReactNode;
  session: Session | null;
};

export default function ClientProvider({ children, session }: Props) {
  const setFromApiResponse = useStatsStore((state) => state.setFromApiResponse);
  const clearStats = useStatsStore((state) => state.clearStats);

  useLayoutEffect(() => {
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
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      fetchStats().catch(console.error);
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(run, { timeout: 4000 });
    } else {
      timeoutId = setTimeout(run, 1);
    }
    return () => {
      if (idleId !== undefined && typeof window !== 'undefined') {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };
  }, [session?.user?.id, setFromApiResponse, clearStats]);

  return (
    <SessionProvider session={session}>
      {children}
      <ToastSnackbar />
    </SessionProvider>
  );
}

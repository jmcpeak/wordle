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
  const loadStats = useStatsStore((state) => state.loadStats);
  const clearStats = useStatsStore((state) => state.clearStats);

  useLayoutEffect(() => {
    if (!session?.user?.id) {
      clearStats();
      return;
    }
    const run = () => {
      loadStats().catch(console.error);
    };
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(run, { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(run, 1);
    return () => clearTimeout(id);
  }, [session?.user?.id, loadStats, clearStats]);

  return (
    <SessionProvider session={session}>
      {children}
      <ToastSnackbar />
    </SessionProvider>
  );
}

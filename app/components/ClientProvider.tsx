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
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      loadStats().catch(console.error);
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
  }, [session?.user?.id, loadStats, clearStats]);

  return (
    <SessionProvider session={session}>
      {children}
      <ToastSnackbar />
    </SessionProvider>
  );
}

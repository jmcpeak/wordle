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
  const loadStats = useStatsStore((state) => state.loadStats);
  const clearStats = useStatsStore((state) => state.clearStats);

  // Deliberately not a layout effect: this is an idle-time network fetch, and
  // useLayoutEffect warns when the tree is server-rendered.
  useEffect(() => {
    // Clear on every identity change, not only sign-out. Otherwise user B can
    // briefly inherit user A's loaded stats while B's request is in flight.
    clearStats();
    if (!session?.user?.id) return;

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

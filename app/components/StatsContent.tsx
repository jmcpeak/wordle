'use client';

import {
  Box,
  Button,
  Divider,
  LinearProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { MAX_GUESSES } from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import { useStatsStore } from '@/store/statsStore';
import { useToastStore } from '@/store/toastStore';

const TOAST_LOAD_FAILED = 'Failed to load statistics. Try again when online.';

function StatsSkeleton() {
  return (
    <>
      <Skeleton
        variant="text"
        sx={{ fontSize: '1.25rem', mx: 'auto', mb: 2, width: '55%' }}
      />
      <Stack
        direction="row"
        justifyContent="space-around"
        sx={{ textAlign: 'center', mb: 2 }}
      >
        {[1, 2, 3, 4].map((i) => (
          <Box key={i}>
            <Skeleton
              variant="text"
              width={48}
              height={42}
              sx={{ mx: 'auto' }}
            />
            <Skeleton
              variant="text"
              width={56}
              height={20}
              sx={{ mx: 'auto' }}
            />
          </Box>
        ))}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Skeleton
        variant="text"
        sx={{ fontSize: '1.25rem', mx: 'auto', mb: 2, width: '75%' }}
      />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Stack
          key={i}
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Skeleton width="10%" height={24} />
          <Skeleton
            variant="rounded"
            height={20}
            sx={{ flexGrow: 1, borderRadius: 1 }}
          />
          <Skeleton width="10%" height={24} />
        </Stack>
      ))}
    </>
  );
}

export default function StatsContent() {
  const { status } = useSession();
  const { t } = useTranslation();
  const [loadError, setLoadError] = useState(false);
  const gamesWon = useStatsStore((s) => s.gamesWon);
  const gamesLost = useStatsStore((s) => s.gamesLost);
  const guessDistribution = useStatsStore((s) => s.guessDistribution);
  const isLoaded = useStatsStore((s) => s.isLoaded);
  const loadStats = useStatsStore((s) => s.loadStats);
  const showToast = useToastStore((s) => s.showToast);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      await loadStats();
    } catch {
      setLoadError(true);
      showToast(TOAST_LOAD_FAILED, 'error');
    }
  }, [loadStats, showToast]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    if (isLoaded) return;
    load();
  }, [status, isLoaded, load]);

  if (status === 'loading') {
    return <StatsSkeleton />;
  }

  if (status === 'unauthenticated') {
    return (
      <Typography sx={{ textAlign: 'center', p: 4 }}>
        {t('stats.signInToView')}
      </Typography>
    );
  }

  if (!isLoaded) {
    if (loadError) {
      return (
        <Stack alignItems="center" spacing={2} sx={{ py: 4, px: 2 }}>
          <Typography color="text.secondary" textAlign="center">
            {TOAST_LOAD_FAILED}
          </Typography>
          <Button variant="outlined" onClick={load}>
            Retry
          </Button>
        </Stack>
      );
    }
    return <StatsSkeleton />;
  }

  const totalGames = gamesWon + gamesLost;
  const winPercentage =
    totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;

  const completeDistribution = Array.from({ length: MAX_GUESSES }, (_, i) => {
    const guesses = i + 1;
    return {
      guesses: guesses.toString(),
      count: guessDistribution[guesses] || 0,
    };
  });

  return (
    <>
      <Typography
        variant="h6"
        component="h2"
        sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}
      >
        {t('stats.title')}
      </Typography>
      <Stack
        direction="row"
        justifyContent="space-around"
        sx={{ textAlign: 'center', mb: 2 }}
      >
        <Box>
          <Typography variant="h4">{totalGames}</Typography>
          <Typography variant="body2">{t('stats.played')}</Typography>
        </Box>
        <Box>
          <Typography variant="h4">{gamesWon}</Typography>
          <Typography variant="body2">{t('stats.won')}</Typography>
        </Box>
        <Box>
          <Typography variant="h4">{gamesLost}</Typography>
          <Typography variant="body2">{t('stats.lost')}</Typography>
        </Box>
        <Box>
          <Typography variant="h4">{winPercentage}%</Typography>
          <Typography variant="body2">{t('stats.winPercent')}</Typography>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Typography
        variant="h6"
        component="h3"
        sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}
      >
        {t('stats.guessDistribution')}
      </Typography>
      <Box>
        {completeDistribution.map(({ guesses, count }) => (
          <Stack
            key={guesses}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 1 }}
          >
            <Typography sx={{ width: '10%' }}>{guesses}</Typography>
            <LinearProgress
              variant="determinate"
              value={count > 0 ? (count / (gamesWon || 1)) * 100 : 0}
              sx={{ height: 20, borderRadius: 1, flexGrow: 1 }}
            />
            <Typography sx={{ width: '10%', fontWeight: 'bold' }}>
              {count}
            </Typography>
          </Stack>
        ))}
      </Box>

      <BuildVersionFooter />
    </>
  );
}

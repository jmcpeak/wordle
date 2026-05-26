'use client';

import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import BuildVersionFooter from '@/components/BuildVersionFooter';
import { MAX_GUESSES } from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import { useStatsStore } from '@/store/statsStore';
import { useToastStore } from '@/store/toastStore';

const TOAST_LOAD_FAILED_KEY = 'stats.loadFailed';

const summaryGridSx = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 1,
  mb: 2,
} as const;

function StatSummaryItem({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <Box sx={{ minWidth: 0, textAlign: 'center' }}>
      <Typography
        variant="h4"
        component="div"
        sx={{
          fontVariantNumeric: 'tabular-nums',
          fontSize: 'clamp(1rem, 5vw, 2.125rem)',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </Typography>
      <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
        {label}
      </Typography>
    </Box>
  );
}

function StatsSkeleton() {
  return (
    <>
      <Skeleton
        variant="text"
        sx={{ fontSize: '1.25rem', mx: 'auto', mb: 2, width: '55%' }}
      />
      <Box sx={summaryGridSx}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ minWidth: 0 }}>
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
      </Box>
      <Divider sx={{ my: 2 }} />
      <Skeleton
        variant="text"
        sx={{ fontSize: '1.25rem', mx: 'auto', mb: 2, width: '75%' }}
      />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Stack
          key={i}
          direction="row"
          spacing={1}
          sx={{ alignItems: 'center', mb: 1 }}
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
      <BuildVersionFooter />
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
  const recentGames = useStatsStore((s) => s.recentGames);
  const isLoaded = useStatsStore((s) => s.isLoaded);
  const loadStats = useStatsStore((s) => s.loadStats);
  const showToast = useToastStore((s) => s.showToast);

  const load = useCallback(async () => {
    setLoadError(false);
    try {
      await loadStats();
    } catch {
      setLoadError(true);
      showToast(t(TOAST_LOAD_FAILED_KEY), 'error');
    }
  }, [loadStats, showToast, t]);

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
      <>
        <Typography sx={{ textAlign: 'center', p: 4 }}>
          {t('stats.signInToView')}
        </Typography>
        <BuildVersionFooter />
      </>
    );
  }

  if (!isLoaded) {
    if (loadError) {
      return (
        <>
          <Stack spacing={2} sx={{ alignItems: 'center', py: 4, px: 2 }}>
            <Typography
              sx={{
                color: 'text.secondary',
                textAlign: 'center',
              }}
            >
              {t(TOAST_LOAD_FAILED_KEY)}
            </Typography>
            <Button variant="outlined" onClick={load}>
              {t('stats.retry')}
            </Button>
          </Stack>
          <BuildVersionFooter />
        </>
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
      <Box sx={summaryGridSx}>
        <StatSummaryItem value={totalGames} label={t('stats.played')} />
        <StatSummaryItem value={gamesWon} label={t('stats.won')} />
        <StatSummaryItem value={gamesLost} label={t('stats.lost')} />
        <StatSummaryItem
          value={`${winPercentage}%`}
          label={t('stats.winPercent')}
        />
      </Box>

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
            spacing={1}
            sx={{ alignItems: 'center', mb: 1 }}
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

      {recentGames.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography
            variant="h6"
            component="h3"
            sx={{ textAlign: 'center', mb: 2, fontWeight: 'bold' }}
          >
            {t('stats.recentWords')}
          </Typography>
          <Stack spacing={1}>
            {recentGames.map((game) => {
              const color = game.won ? 'success.main' : 'error.main';
              const outcomeLabel = game.won
                ? t('stats.wonIn', { guesses: String(game.guesses) })
                : t('stats.lost');
              return (
                <Stack
                  key={game.id}
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: 'center',
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    border: 1,
                    borderColor: color,
                    bgcolor: (theme) =>
                      theme.palette.mode === 'dark'
                        ? game.won
                          ? 'rgba(76, 175, 80, 0.12)'
                          : 'rgba(244, 67, 54, 0.12)'
                        : game.won
                          ? 'rgba(76, 175, 80, 0.08)'
                          : 'rgba(244, 67, 54, 0.08)',
                  }}
                >
                  {game.won ? (
                    <CheckCircleIcon sx={{ color }} aria-hidden />
                  ) : (
                    <CancelIcon sx={{ color }} aria-hidden />
                  )}
                  <Typography
                    sx={{
                      fontWeight: 'bold',
                      letterSpacing: '0.15em',
                      color,
                      flexGrow: 1,
                    }}
                  >
                    {game.word.toUpperCase()}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color, fontWeight: 'medium' }}
                  >
                    {outcomeLabel}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </>
      )}

      <BuildVersionFooter />
    </>
  );
}

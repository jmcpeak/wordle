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
import DefinitionDrawer from '@/components/DefinitionDrawer';
import { MAX_GUESSES } from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import { useStatsStore } from '@/store/statsStore';
import { useToastStore } from '@/store/toastStore';

const TOAST_LOAD_FAILED_KEY = 'stats.loadFailed';

const SUMMARY_GRID_SX = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 1,
  mb: 2,
} as const;

const STAT_ITEM_BOX_SX = { minWidth: 0, textAlign: 'center' } as const;

const STAT_VALUE_SX = {
  fontVariantNumeric: 'tabular-nums',
  fontSize: 'clamp(1rem, 5vw, 2.125rem)',
  lineHeight: 1.2,
  whiteSpace: 'nowrap',
} as const;

const STAT_LABEL_SX = { lineHeight: 1.2 } as const;

const SKELETON_TITLE_SX = {
  fontSize: '1.25rem',
  mx: 'auto',
  mb: 2,
  width: '55%',
} as const;

const SKELETON_ITEM_BOX_SX = { minWidth: 0 } as const;

const SKELETON_CENTERED_SX = { mx: 'auto' } as const;

const DIVIDER_SX = { my: 2 } as const;

const SKELETON_DISTRIBUTION_TITLE_SX = {
  fontSize: '1.25rem',
  mx: 'auto',
  mb: 2,
  width: '75%',
} as const;

const DISTRIBUTION_ROW_SX = { alignItems: 'center', mb: 1 } as const;

const SKELETON_BAR_SX = { flexGrow: 1, borderRadius: 1 } as const;

const SIGN_IN_MESSAGE_SX = { textAlign: 'center', p: 4 } as const;

const ERROR_STACK_SX = { alignItems: 'center', py: 4, px: 2 } as const;

const ERROR_MESSAGE_SX = {
  color: 'text.secondary',
  textAlign: 'center',
} as const;

const SECTION_TITLE_SX = {
  textAlign: 'center',
  mb: 2,
  fontWeight: 'bold',
} as const;

const GUESS_LABEL_SX = { width: '10%' } as const;

const PROGRESS_SX = { height: 20, borderRadius: 1, flexGrow: 1 } as const;

const COUNT_LABEL_SX = { width: '10%', fontWeight: 'bold' } as const;

type StatSummaryItemProps = {
  value: ReactNode;
  label: string;
};

function StatSummaryItem({ value, label }: StatSummaryItemProps) {
  return (
    <Box sx={STAT_ITEM_BOX_SX}>
      <Typography variant="h4" component="div" sx={STAT_VALUE_SX}>
        {value}
      </Typography>
      <Typography variant="body2" sx={STAT_LABEL_SX}>
        {label}
      </Typography>
    </Box>
  );
}

function StatsSkeleton() {
  return (
    <>
      <Skeleton variant="text" sx={SKELETON_TITLE_SX} />
      <Box sx={SUMMARY_GRID_SX}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={SKELETON_ITEM_BOX_SX}>
            <Skeleton
              variant="text"
              width={48}
              height={42}
              sx={SKELETON_CENTERED_SX}
            />
            <Skeleton
              variant="text"
              width={56}
              height={20}
              sx={SKELETON_CENTERED_SX}
            />
          </Box>
        ))}
      </Box>
      <Divider sx={DIVIDER_SX} />
      <Skeleton variant="text" sx={SKELETON_DISTRIBUTION_TITLE_SX} />
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Stack key={i} direction="row" spacing={1} sx={DISTRIBUTION_ROW_SX}>
          <Skeleton width="10%" height={24} />
          <Skeleton variant="rounded" height={20} sx={SKELETON_BAR_SX} />
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
  const [definitionWord, setDefinitionWord] = useState<string | null>(null);
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

  const handleCloseDefinition = useCallback(() => setDefinitionWord(null), []);

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
        <Typography sx={SIGN_IN_MESSAGE_SX}>
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
          <Stack spacing={2} sx={ERROR_STACK_SX}>
            <Typography sx={ERROR_MESSAGE_SX}>
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
      <Typography variant="h6" component="h2" sx={SECTION_TITLE_SX}>
        {t('stats.title')}
      </Typography>
      <Box sx={SUMMARY_GRID_SX}>
        <StatSummaryItem value={totalGames} label={t('stats.played')} />
        <StatSummaryItem value={gamesWon} label={t('stats.won')} />
        <StatSummaryItem value={gamesLost} label={t('stats.lost')} />
        <StatSummaryItem
          value={`${winPercentage}%`}
          label={t('stats.winPercent')}
        />
      </Box>

      <Divider sx={DIVIDER_SX} />

      <Typography variant="h6" component="h3" sx={SECTION_TITLE_SX}>
        {t('stats.guessDistribution')}
      </Typography>
      <Box>
        {completeDistribution.map(({ guesses, count }) => (
          <Stack
            key={guesses}
            direction="row"
            spacing={1}
            sx={DISTRIBUTION_ROW_SX}
          >
            <Typography sx={GUESS_LABEL_SX}>{guesses}</Typography>
            <LinearProgress
              variant="determinate"
              value={count > 0 ? (count / (gamesWon || 1)) * 100 : 0}
              sx={PROGRESS_SX}
            />
            <Typography sx={COUNT_LABEL_SX}>{count}</Typography>
          </Stack>
        ))}
      </Box>

      {recentGames.length > 0 && (
        <>
          <Divider sx={DIVIDER_SX} />
          <Typography variant="h6" component="h3" sx={SECTION_TITLE_SX}>
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
                  role="button"
                  tabIndex={0}
                  onClick={() => setDefinitionWord(game.word)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDefinitionWord(game.word);
                    }
                  }}
                  aria-label={t('definition.tooltip')}
                  sx={{
                    alignItems: 'center',
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    border: 1,
                    borderColor: color,
                    cursor: 'pointer',
                    transition: 'filter 0.15s ease',
                    '&:hover': { filter: 'brightness(0.95)' },
                    '&:focus-visible': {
                      outline: 2,
                      outlineColor: color,
                      outlineOffset: 2,
                    },
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

      <DefinitionDrawer
        key={definitionWord ?? ''}
        open={definitionWord !== null}
        onClose={handleCloseDefinition}
        word={definitionWord ?? ''}
      />
    </>
  );
}

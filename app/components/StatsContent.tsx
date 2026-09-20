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
import type { Theme } from '@mui/material/styles';
import { useSession } from 'next-auth/react';
import {
  memo,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import BuildVersionFooter from '@/components/BuildVersionFooter';
import DefinitionDrawer from '@/components/DefinitionDrawer';
import { MAX_GUESSES } from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import { useStatsStore } from '@/store/statsStore';
import { useToastStore } from '@/store/toastStore';
import type { RecentGame } from '@/types';

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

const RECENT_GAME_ROW_BASE_SX = {
  alignItems: 'center',
  px: 1.5,
  py: 1,
  borderRadius: 1,
  border: 1,
  cursor: 'pointer',
  transition: 'filter 0.15s ease',
  '&:hover': { filter: 'brightness(0.95)' },
  '&:focus-visible': { outline: 2, outlineOffset: 2 },
} as const;

/** Lifted per-outcome so rows don't re-serialize their styles on every render. */
const RECENT_GAME_ROW_WON_SX = {
  ...RECENT_GAME_ROW_BASE_SX,
  borderColor: 'success.main',
  '&:focus-visible': {
    ...RECENT_GAME_ROW_BASE_SX['&:focus-visible'],
    outlineColor: 'success.main',
  },
  bgcolor: (theme: Theme) =>
    theme.palette.mode === 'dark'
      ? 'rgba(76, 175, 80, 0.12)'
      : 'rgba(76, 175, 80, 0.08)',
} as const;

const RECENT_GAME_ROW_LOST_SX = {
  ...RECENT_GAME_ROW_BASE_SX,
  borderColor: 'error.main',
  '&:focus-visible': {
    ...RECENT_GAME_ROW_BASE_SX['&:focus-visible'],
    outlineColor: 'error.main',
  },
  bgcolor: (theme: Theme) =>
    theme.palette.mode === 'dark'
      ? 'rgba(244, 67, 54, 0.12)'
      : 'rgba(244, 67, 54, 0.08)',
} as const;

const RECENT_GAME_WORD_WON_SX = {
  fontWeight: 'bold',
  letterSpacing: '0.15em',
  flexGrow: 1,
  color: 'success.main',
} as const;

const RECENT_GAME_WORD_LOST_SX = {
  ...RECENT_GAME_WORD_WON_SX,
  color: 'error.main',
} as const;

const RECENT_GAME_OUTCOME_WON_SX = {
  color: 'success.main',
  fontWeight: 'medium',
} as const;

const RECENT_GAME_OUTCOME_LOST_SX = {
  color: 'error.main',
  fontWeight: 'medium',
} as const;

const ICON_WON_SX = { color: 'success.main' } as const;
const ICON_LOST_SX = { color: 'error.main' } as const;

/** Closing keeps the word so the drawer can play its exit transition. */
type DefinitionTarget = { word: string; open: boolean };

const CLOSED_DEFINITION: DefinitionTarget = { word: '', open: false };

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

type StatsContentProps = {
  headingComponent?: 'h1' | 'h2';
};

export default function StatsContent({
  headingComponent = 'h2',
}: StatsContentProps) {
  const { status } = useSession();
  const { t } = useTranslation();
  const [loadError, setLoadError] = useState(false);
  const [definition, setDefinition] =
    useState<DefinitionTarget>(CLOSED_DEFINITION);
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

  const handleOpenDefinition = useCallback(
    (word: string) => setDefinition({ word, open: true }),
    [],
  );
  // Keep the word so <DefinitionDrawer key={word}> survives the exit transition.
  const handleCloseDefinition = useCallback(
    () => setDefinition((current) => ({ ...current, open: false })),
    [],
  );

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
    const rawCount = guessDistribution[guesses];
    return {
      guesses: guesses.toString(),
      count: typeof rawCount === 'number' && rawCount > 0 ? rawCount : 0,
    };
  });
  // Scale against the tallest bar so a stale/partial distribution can't push a
  // determinate LinearProgress past 100%.
  const maxDistributionCount = Math.max(
    1,
    ...completeDistribution.map(({ count }) => count),
  );

  return (
    <>
      <Typography
        variant="h6"
        component={headingComponent}
        sx={SECTION_TITLE_SX}
      >
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
              value={(count / maxDistributionCount) * 100}
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
            {recentGames.map((game) => (
              <RecentGameRow
                key={game.id}
                game={game}
                onSelect={handleOpenDefinition}
              />
            ))}
          </Stack>
        </>
      )}

      <BuildVersionFooter />

      <DefinitionDrawer
        key={definition.word}
        open={definition.open}
        onClose={handleCloseDefinition}
        word={definition.word}
      />
    </>
  );
}

type RecentGameRowProps = {
  game: RecentGame;
  onSelect: (word: string) => void;
};

const RecentGameRow = memo(function RecentGameRow({
  game,
  onSelect,
}: RecentGameRowProps) {
  const { t } = useTranslation();
  const word = game.word.toUpperCase();

  const handleSelect = useCallback(() => onSelect(game.word), [onSelect, game]);
  const handleKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      onSelect(game.word);
    },
    [onSelect, game],
  );

  const outcomeLabel = game.won
    ? t('stats.wonIn', { guesses: String(game.guesses) })
    : t('stats.lost');

  return (
    <Stack
      direction="row"
      spacing={1.5}
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      // Name each row by its word; a shared generic label makes every row
      // read identically to a screen reader.
      aria-label={`${word}, ${outcomeLabel}. ${t('definition.tooltip')}`}
      sx={game.won ? RECENT_GAME_ROW_WON_SX : RECENT_GAME_ROW_LOST_SX}
    >
      {game.won ? (
        <CheckCircleIcon sx={ICON_WON_SX} aria-hidden />
      ) : (
        <CancelIcon sx={ICON_LOST_SX} aria-hidden />
      )}
      <Typography
        sx={game.won ? RECENT_GAME_WORD_WON_SX : RECENT_GAME_WORD_LOST_SX}
      >
        {word}
      </Typography>
      <Typography
        variant="body2"
        sx={game.won ? RECENT_GAME_OUTCOME_WON_SX : RECENT_GAME_OUTCOME_LOST_SX}
      >
        {outcomeLabel}
      </Typography>
    </Stack>
  );
});

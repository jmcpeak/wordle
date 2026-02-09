import { Box, Divider, LinearProgress, Stack, Typography } from '@mui/material';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import { MAX_GUESSES } from '@/constants';
import { getTranslations } from '@/db/i18n';
import { getStats } from '@/db/stats';
import { parseAcceptLanguage } from '@/utils/parseLocale';

export default async function StatsModalPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const headerStore = await headers();
  const locale = parseAcceptLanguage(headerStore.get('accept-language'));
  const translations = await getTranslations(locale);
  const t = (key: string) => translations[key] ?? key;

  if (!userId) {
    return (
      <Typography sx={{ textAlign: 'center', p: 4 }}>
        {t('stats.signInToView')}
      </Typography>
    );
  }
  const { gamesWon, gamesLost, guessDistribution } = await getStats(userId);

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
        id="modal-modal-title"
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
    </>
  );
}

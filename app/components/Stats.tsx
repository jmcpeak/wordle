'use client';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  LinearProgress,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '@/store/i18nStore';
import { useStatsStore } from '@/store/statsStore';

type Props = {
  open: boolean;
  handleClose: () => void;
};

export default function Stats({ open, handleClose }: Props) {
  const { gamesWon, gamesLost, guessDistribution, isLoaded, resetStats } =
    useStatsStore(
      useShallow((s) => ({
        gamesWon: s.gamesWon,
        gamesLost: s.gamesLost,
        guessDistribution: s.guessDistribution,
        isLoaded: s.isLoaded,
        resetStats: s.resetStats,
      })),
    );
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const totalGames = gamesWon + gamesLost;
  const winPercentage =
    totalGames > 0 ? Math.round((gamesWon / totalGames) * 100) : 0;

  const sortedGuessDistribution = Object.entries(guessDistribution).sort(
    ([a], [b]) => Number(a) - Number(b),
  );

  const handleReset = async () => {
    await resetStats();
    setConfirmOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        <Tooltip title={t('stats.reset')}>
          <IconButton
            aria-label={t('stats.reset')}
            onClick={() => setConfirmOpen(true)}
            size="small"
            sx={{ mr: 1 }}
          >
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Typography
          variant="h6"
          component="span"
          sx={{ flexGrow: 1, textAlign: 'center', mr: 4 }}
        >
          {t('stats.title')}
        </Typography>
      </DialogTitle>

      {/* Reset confirmation dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>{t('stats.reset')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('stats.resetConfirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>
            {t('stats.resetCancel')}
          </Button>
          <Button onClick={handleReset} color="error">
            {t('stats.resetConfirmButton')}
          </Button>
        </DialogActions>
      </Dialog>
      <DialogContent>
        {!isLoaded ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Stack direction="row" justifyContent="space-around" sx={{ mb: 2 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{totalGames}</Typography>
                <Typography variant="body2">{t('stats.played')}</Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4">{winPercentage}</Typography>
                <Typography variant="body2">{t('stats.winPercent')}</Typography>
              </Box>
            </Stack>
            {gamesWon > 0 && (
              <>
                <Typography
                  variant="h6"
                  component="h3"
                  sx={{ textAlign: 'center', mb: 2 }}
                >
                  {t('stats.guessDistribution')}
                </Typography>
                <Box>
                  {sortedGuessDistribution.map(([guesses, count]) => (
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
                        value={(count / gamesWon) * 100}
                        sx={{ height: 20, borderRadius: 1, flexGrow: 1 }}
                      />
                      <Typography sx={{ width: '10%', fontWeight: 'bold' }}>
                        {count}
                      </Typography>
                    </Stack>
                  ))}
                </Box>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

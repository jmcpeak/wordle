'use client';

import RestartAltIcon from '@mui/icons-material/RestartAlt';
import type { SxProps, Theme } from '@mui/material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useTranslation } from '@/store/i18nStore';
import { useStatsStore } from '@/store/statsStore';

type ResetStatsButtonProps = {
  sx?: SxProps<Theme>;
};

export default function ResetStatsButton({ sx }: ResetStatsButtonProps) {
  const resetStats = useStatsStore((s) => s.resetStats);
  const { t } = useTranslation();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const openConfirm = useCallback(() => setConfirmOpen(true), []);
  const closeConfirm = useCallback(() => setConfirmOpen(false), []);

  const handleReset = useCallback(async () => {
    setIsResetting(true);
    try {
      await resetStats();
      setConfirmOpen(false);
    } catch {
      // The store already surfaces a toast; keep the dialog open for retry.
    } finally {
      setIsResetting(false);
    }
  }, [resetStats]);

  return (
    <>
      <Tooltip title={t('stats.reset')}>
        <IconButton aria-label={t('stats.reset')} onClick={openConfirm} sx={sx}>
          <RestartAltIcon />
        </IconButton>
      </Tooltip>
      <Dialog open={confirmOpen} onClose={closeConfirm}>
        <DialogTitle>{t('stats.reset')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('stats.resetConfirm')}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm} disabled={isResetting}>
            {t('stats.resetCancel')}
          </Button>
          <Button onClick={handleReset} color="error" disabled={isResetting}>
            {t('stats.resetConfirmButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

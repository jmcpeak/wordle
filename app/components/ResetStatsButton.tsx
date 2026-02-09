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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useTranslation } from '@/store/i18nStore';
import { useStatsStore } from '@/store/statsStore';

type ResetStatsButtonProps = {
  sx?: SxProps<Theme>;
};

export default function ResetStatsButton({ sx }: ResetStatsButtonProps) {
  const resetStats = useStatsStore((s) => s.resetStats);
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleReset = async () => {
    await resetStats();
    setConfirmOpen(false);
    // Re-fetch server components without a full page reload to keep the modal open
    router.refresh();
  };

  return (
    <>
      <Tooltip title={t('stats.reset')}>
        <IconButton
          aria-label={t('stats.reset')}
          onClick={() => setConfirmOpen(true)}
          sx={sx}
        >
          <RestartAltIcon />
        </IconButton>
      </Tooltip>
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
    </>
  );
}

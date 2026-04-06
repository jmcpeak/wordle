'use client';

import LoopIcon from '@mui/icons-material/Loop';
import { Button, Collapse } from '@mui/material';
import { memo } from 'react';
import { useTranslation } from '@/store/i18nStore';

const COLLAPSE_DURATION_MS = 400;

type PlayAgainButtonProps = {
  /** When true, the button is expanded into view. */
  visible?: boolean;
  onClick: () => void;
  onExited?: () => void;
};

export default memo(function PlayAgainButton({
  visible = false,
  onClick,
  onExited,
}: PlayAgainButtonProps) {
  const { t } = useTranslation();

  return (
    <Collapse
      in={visible}
      timeout={{ enter: COLLAPSE_DURATION_MS, exit: COLLAPSE_DURATION_MS }}
      onExited={onExited}
      sx={{
        minHeight: 0,
        '&.MuiCollapse-hidden': {
          display: 'none',
        },
      }}
    >
      <Button
        onClick={onClick}
        size="large"
        variant="contained"
        color="success"
        startIcon={<LoopIcon />}
        sx={{
          mt: 0,
          mb: 0,
          textTransform: 'uppercase',
          fontWeight: 700,
          boxShadow: 2,
        }}
      >
        {t('game.playAgain')}
      </Button>
    </Collapse>
  );
});

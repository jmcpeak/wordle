'use client';

import LoopIcon from '@mui/icons-material/Loop';
import { Button, Grow } from '@mui/material';
import { useTranslation } from '@/store/i18nStore';

const GROW_DURATION_MS = 400;

type PlayAgainButtonProps = {
  in?: boolean;
  onClick: () => void;
  onExited?: () => void;
};

export default function PlayAgainButton({
  in: inProp = true,
  onClick,
  onExited,
}: PlayAgainButtonProps) {
  const { t } = useTranslation();

  return (
    <Grow
      in={inProp}
      appear
      timeout={{ enter: GROW_DURATION_MS, exit: GROW_DURATION_MS }}
      onExited={onExited}
    >
      <Button
        onClick={onClick}
        size="large"
        variant="contained"
        color="success"
        startIcon={<LoopIcon />}
        sx={{
          mt: 2,
          textTransform: 'uppercase',
          fontWeight: 700,
          boxShadow: 2,
        }}
      >
        {t('game.playAgain')}
      </Button>
    </Grow>
  );
}

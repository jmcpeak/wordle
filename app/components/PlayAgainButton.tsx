'use client';

import { Button } from '@mui/material';
import { useTranslation } from '@/store/i18nStore';

type PlayAgainButtonProps = {
  onClick: () => void;
};

export default function PlayAgainButton({ onClick }: PlayAgainButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      onClick={onClick}
      size="large"
      sx={{ mt: 2 }}
      variant="contained"
    >
      {t('game.playAgain')}
    </Button>
  );
}

'use client';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { IconButton, Tooltip } from '@mui/material';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from '@/store/i18nStore';

export default memo(function HowToPlayButton() {
  const { t } = useTranslation();

  return (
    <Tooltip title={t('howToPlay.tooltip')}>
      <IconButton
        component={Link}
        href="/how-to-play"
        prefetch
        aria-label={t('howToPlay.tooltip')}
      >
        <HelpOutlineIcon />
      </IconButton>
    </Tooltip>
  );
});

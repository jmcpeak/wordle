'use client';

import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { IconButton, Tooltip } from '@mui/material';
import Link from 'next/link';
import { useTranslation } from '@/store/i18nStore';

export default function HowToPlayButton() {
  const { t } = useTranslation();

  return (
    <Tooltip title={t('howToPlay.tooltip')}>
      <Link href="/how-to-play" passHref>
        <IconButton aria-label={t('howToPlay.tooltip')}>
          <HelpOutlineIcon />
        </IconButton>
      </Link>
    </Tooltip>
  );
}

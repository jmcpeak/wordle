'use client';

import BarChartIcon from '@mui/icons-material/BarChart';
import { IconButton, Tooltip } from '@mui/material';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from '@/store/i18nStore';

export default memo(function StatsButton() {
  const { t } = useTranslation();

  return (
    <Tooltip title={t('stats.title')}>
      <IconButton
        component={Link}
        href="/stats"
        prefetch={false}
        aria-label={t('stats.title')}
      >
        <BarChartIcon />
      </IconButton>
    </Tooltip>
  );
});

'use client';

import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import Link from 'next/link';
import { memo } from 'react';
import { useTranslation } from '@/store/i18nStore';

const BUTTON_SX = {
  position: 'absolute',
  // macOS PWAs overlay a titlebar and often report 0 for safe-area-inset-top.
  top: 'max(52px, env(safe-area-inset-top, 0px))',
  right: 'max(8px, env(safe-area-inset-right, 0px))',
  zIndex: 1,
} as const;

/**
 * Full-page fallback when intercepting routes are skipped (common in installed
 * PWAs). The modal layout already has its own close control.
 */
export default memo(function DismissToGameButton() {
  const { t } = useTranslation();

  return (
    <IconButton
      aria-label={t('dialog.close')}
      component={Link}
      href="/"
      replace
      sx={BUTTON_SX}
    >
      <CloseIcon />
    </IconButton>
  );
});

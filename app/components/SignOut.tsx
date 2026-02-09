'use client';

import LogoutIcon from '@mui/icons-material/Logout';
import { IconButton, Tooltip } from '@mui/material';
import { signOut } from 'next-auth/react';
import { useTranslation } from '@/store/i18nStore';

export default function SignOut() {
  const { t } = useTranslation();

  const handleSignOut = () => {
    // When signing out, redirect to the homepage.
    // The page will reload, and the stores will be re-initialized with default values.
    signOut({ callbackUrl: '/' });
  };

  return (
    <Tooltip title={t('auth.signOut')}>
      <IconButton
        color="inherit"
        onClick={handleSignOut}
        aria-label={t('auth.signOut')}
      >
        <LogoutIcon />
      </IconButton>
    </Tooltip>
  );
}

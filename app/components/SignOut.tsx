'use client';

import LogoutIcon from '@mui/icons-material/Logout';
import { IconButton, Tooltip } from '@mui/material';
import { signOut } from 'next-auth/react';
import { useTranslation } from '@/store/i18nStore';

export default function SignOut() {
  const { t } = useTranslation();

  const handleSignOut = () => {
    // Send users to the sign-in page. Home (`/`) redirects there anyway, and
    // that extra hop can cache a logged-out document over the game route.
    signOut({ callbackUrl: '/signin' });
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

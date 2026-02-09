'use client';

import { AppBar, Toolbar, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import SignIn from '@/components/SignIn';
import SignOut from '@/components/SignOut';
import StatsButton from '@/components/StatsButton';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { useTranslation } from '@/store/i18nStore';

export default function GameTitle() {
  const { data: session } = useSession();
  const { t } = useTranslation();

  return (
    <AppBar position="static" color="transparent" elevation={0}>
      <Toolbar sx={{ justifyContent: 'center', gap: 2 }}>
        <Typography
          variant="gameTitle"
          sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}
        >
          {t('game.title')}
        </Typography>
        <StatsButton />
        <ThemeToggleButton />
        {session ? <SignOut /> : <SignIn />}
      </Toolbar>
    </AppBar>
  );
}

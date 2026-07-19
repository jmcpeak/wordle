'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useSession } from 'next-auth/react';
import HowToPlayButton from '@/components/HowToPlayButton';
import SignIn from '@/components/SignIn';
import SignOut from '@/components/SignOut';
import StatsButton from '@/components/StatsButton';
import ThemeToggleButton from '@/components/ThemeToggleButton';
import { isIosDevice, useStandaloneMode } from '@/hooks/useStandaloneMode';
import { useTranslation } from '@/store/i18nStore';

const IOS_STANDALONE_APPBAR_SX = {
  paddingTop: 'env(safe-area-inset-top, 0px)',
} as const;

const TOOLBAR_SX = { justifyContent: 'center', gap: 2 } as const;

const TITLE_SX = { fontSize: { xs: '1.5rem', sm: '2rem' } } as const;

export default function GameTitle() {
  const { data: session } = useSession();
  const { t } = useTranslation();
  const standalone = useStandaloneMode();
  const iosStandalone = standalone && isIosDevice();

  return (
    <AppBar
      component="header"
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        flexShrink: 0,
        ...(iosStandalone ? IOS_STANDALONE_APPBAR_SX : {}),
      }}
    >
      <Toolbar
        component="nav"
        aria-label={t('game.navigation')}
        sx={TOOLBAR_SX}
      >
        <Typography variant="gameTitle" component="h1" sx={TITLE_SX}>
          {t('game.title')}
        </Typography>
        <StatsButton />
        <HowToPlayButton />
        <ThemeToggleButton />
        {session ? <SignOut /> : <SignIn />}
      </Toolbar>
    </AppBar>
  );
}

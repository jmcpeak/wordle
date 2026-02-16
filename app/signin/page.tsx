'use client';

import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { signIn } from 'next-auth/react';
import { useCallback, useState } from 'react';
import { AUTH_PROVIDERS } from '@/constants';
import { useTranslation } from '@/store/i18nStore';

const PROVIDER_IDS = [
  AUTH_PROVIDERS.GITHUB,
  AUTH_PROVIDERS.GOOGLE,
  AUTH_PROVIDERS.FACEBOOK,
] as const;

export default function SignInPage() {
  const { t } = useTranslation();
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const handleSignIn = useCallback(
    (provider: (typeof PROVIDER_IDS)[number]) => {
      setPendingProvider(provider);
      signIn(provider, { callbackUrl: '/' });
    },
    [],
  );

  const isDisabled = pendingProvider !== null;

  const iconWrapperSx = {
    position: 'relative' as const,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  };

  function StartIcon({
    provider,
    icon: Icon,
  }: {
    provider: string;
    icon: React.ComponentType<{ sx?: object }>;
  }) {
    const isLoading = pendingProvider === provider;
    return (
      <Box sx={iconWrapperSx}>
        {isLoading && (
          <CircularProgress
            size={32}
            variant="indeterminate"
            color="inherit"
            sx={{ position: 'absolute' }}
          />
        )}
        <Icon sx={{ fontSize: 24, position: 'relative', zIndex: 1 }} />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography
          component="h1"
          variant="h5"
          sx={isDisabled ? { color: 'action.disabled' } : undefined}
        >
          {t('auth.signIn')}
        </Typography>
        <Box sx={{ mt: 3, width: '100%' }}>
          <Button
            fullWidth
            variant="outlined"
            disabled={isDisabled}
            startIcon={
              <StartIcon provider={AUTH_PROVIDERS.GITHUB} icon={GitHubIcon} />
            }
            onClick={() => handleSignIn(AUTH_PROVIDERS.GITHUB)}
            sx={{ mb: 2 }}
          >
            {t('auth.signInWithGithub')}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            disabled={isDisabled}
            startIcon={
              <StartIcon provider={AUTH_PROVIDERS.GOOGLE} icon={GoogleIcon} />
            }
            onClick={() => handleSignIn(AUTH_PROVIDERS.GOOGLE)}
            sx={{ mb: 2 }}
          >
            {t('auth.signInWithGoogle')}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            disabled={isDisabled}
            startIcon={
              <StartIcon
                provider={AUTH_PROVIDERS.FACEBOOK}
                icon={FacebookIcon}
              />
            }
            onClick={() => handleSignIn(AUTH_PROVIDERS.FACEBOOK)}
          >
            {t('auth.signInWithFacebook')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

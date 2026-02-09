'use client';

import GitHubIcon from '@mui/icons-material/GitHub';
import FacebookIcon from '@mui/icons-material/Facebook';
import GoogleIcon from '@mui/icons-material/Google';
import { Box, Button, Container, Paper, Typography } from '@mui/material';
import { signIn } from 'next-auth/react';
import { AUTH_PROVIDERS } from '@/constants';
import { useTranslation } from '@/store/i18nStore';

export default function SignInPage() {
  const { t } = useTranslation();

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
        <Typography component="h1" variant="h5">
          {t('auth.signIn')}
        </Typography>
        <Box sx={{ mt: 3, width: '100%' }}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GitHubIcon />}
            onClick={() => signIn(AUTH_PROVIDERS.GITHUB, { callbackUrl: '/' })}
            sx={{ mb: 2 }}
          >
            {t('auth.signInWithGithub')}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<GoogleIcon />}
            onClick={() => signIn(AUTH_PROVIDERS.GOOGLE, { callbackUrl: '/' })}
            sx={{ mb: 2 }}
          >
            {t('auth.signInWithGoogle')}
          </Button>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FacebookIcon />}
            onClick={() => signIn(AUTH_PROVIDERS.FACEBOOK, { callbackUrl: '/' })}
          >
            {t('auth.signInWithFacebook')}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

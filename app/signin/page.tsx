'use client';

import GitHubIcon from '@mui/icons-material/GitHub';
import {
  Box,
  Button,
  Container,
  Divider,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { AUTH_PROVIDERS } from '@/constants';
import { useTranslation } from '@/store/i18nStore';

export default function SignInPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { t } = useTranslation();

  const handleCredentialsSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(AUTH_PROVIDERS.CREDENTIALS, {
      username,
      password,
      callbackUrl: '/',
    });
  };

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
          <Divider>{t('auth.or')}</Divider>
          <Box
            component="form"
            onSubmit={handleCredentialsSignIn}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              id="username"
              label={t('auth.username')}
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              variant="outlined"
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('auth.password')}
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              {t('auth.signIn')}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

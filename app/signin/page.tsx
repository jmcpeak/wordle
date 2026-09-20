'use client';

import FacebookIcon from '@mui/icons-material/Facebook';
import GitHubIcon from '@mui/icons-material/GitHub';
import GoogleIcon from '@mui/icons-material/Google';
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import { signIn } from 'next-auth/react';
import { type ComponentType, useCallback, useEffect, useState } from 'react';
import { AUTH_PROVIDERS } from '@/constants';
import { useTranslation } from '@/store/i18nStore';
import { useToastStore } from '@/store/toastStore';
import {
  type AuthProviderId,
  loadLastAuthProvider,
  saveLastAuthProvider,
} from '@/utils/lastAuthProviderStorage';

const PROVIDER_IDS = [
  AUTH_PROVIDERS.GITHUB,
  AUTH_PROVIDERS.GOOGLE,
  AUTH_PROVIDERS.FACEBOOK,
] as const;

const PROVIDER_CONFIG = [
  {
    id: AUTH_PROVIDERS.GITHUB,
    icon: GitHubIcon,
    labelKey: 'auth.signInWithGithub' as const,
  },
  {
    id: AUTH_PROVIDERS.GOOGLE,
    icon: GoogleIcon,
    labelKey: 'auth.signInWithGoogle' as const,
  },
  {
    id: AUTH_PROVIDERS.FACEBOOK,
    icon: FacebookIcon,
    labelKey: 'auth.signInWithFacebook' as const,
  },
] as const;

const ICON_WRAPPER_SX = {
  position: 'relative' as const,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
};

const PROGRESS_SX = { position: 'absolute' } as const;

const ICON_SX = { fontSize: 24, position: 'relative', zIndex: 1 } as const;

const PAPER_SX = {
  mt: 8,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
} as const;

const BUTTONS_BOX_SX = { mt: 3, width: '100%' } as const;
const TITLE_DISABLED_SX = { color: 'action.disabled' } as const;

const BADGE_ANCHOR_ORIGIN = {
  vertical: 'top',
  horizontal: 'right',
} as const;

const BADGE_SX = {
  width: '100%',
  display: 'block',
  mb: 2,
  '& .MuiBadge-badge': {
    fontSize: '0.65rem',
    height: 18,
    minWidth: 'auto',
    px: 0.75,
    py: 0.25,
    whiteSpace: 'nowrap',
    bgcolor: 'primary.main',
    color: 'primary.contrastText',
    // Nudge left from the default corner so the label sits on the button edge.
    right: 16,
  },
} as const;

type StartIconProps = {
  provider: string;
  pendingProvider: string | null;
  icon: ComponentType<{ sx?: object }>;
};

function StartIcon({ provider, pendingProvider, icon: Icon }: StartIconProps) {
  const isLoading = pendingProvider === provider;
  return (
    <Box sx={ICON_WRAPPER_SX}>
      {isLoading && (
        <CircularProgress
          size={32}
          variant="indeterminate"
          color="inherit"
          sx={PROGRESS_SX}
        />
      )}
      <Icon sx={ICON_SX} />
    </Box>
  );
}

export default function SignInPage() {
  const { t } = useTranslation();
  const showToast = useToastStore((state) => state.showToast);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [lastUsedProvider, setLastUsedProvider] =
    useState<AuthProviderId | null>(null);

  useEffect(() => {
    setLastUsedProvider(loadLastAuthProvider());
  }, []);

  const handleSignIn = useCallback(
    async (provider: (typeof PROVIDER_IDS)[number]) => {
      saveLastAuthProvider(provider);
      setLastUsedProvider(provider);
      setPendingProvider(provider);
      try {
        await signIn(provider, { callbackUrl: '/' });
        // OAuth normally navigates away. If it returns without navigating,
        // restore the controls so another provider remains available.
        setPendingProvider(null);
      } catch (error) {
        console.error('Sign-in failed:', error);
        setPendingProvider(null);
        showToast(t('auth.signInFailed'), 'error');
      }
    },
    [showToast, t],
  );

  const isDisabled = pendingProvider !== null;

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={PAPER_SX}>
        <Typography
          component="h1"
          variant="h5"
          sx={isDisabled ? TITLE_DISABLED_SX : undefined}
        >
          {t('auth.signIn')}
        </Typography>
        <Box sx={BUTTONS_BOX_SX}>
          {PROVIDER_CONFIG.map(({ id, icon, labelKey }) => (
            <Badge
              key={id}
              badgeContent={t('auth.lastUsed')}
              invisible={lastUsedProvider !== id}
              anchorOrigin={BADGE_ANCHOR_ORIGIN}
              sx={BADGE_SX}
            >
              <Button
                fullWidth
                variant="outlined"
                disabled={isDisabled}
                startIcon={
                  <StartIcon
                    provider={id}
                    pendingProvider={pendingProvider}
                    icon={icon}
                  />
                }
                onClick={() => void handleSignIn(id)}
              >
                {t(labelKey)}
              </Button>
            </Badge>
          ))}
        </Box>
      </Paper>
    </Container>
  );
}

'use client';

import { Button } from '@mui/material';
import { signIn } from 'next-auth/react';
import { useTranslation } from '@/store/i18nStore';

export default function SignIn() {
  const { t } = useTranslation();

  return (
    <Button color="inherit" onClick={() => signIn()}>
      {t('auth.signIn')}
    </Button>
  );
}

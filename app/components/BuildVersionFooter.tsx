'use client';

import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from '@/store/i18nStore';

const BUILD_LABEL = process.env.NEXT_PUBLIC_BUILD_LABEL;

/**
 * Subtle build stamp for modal footers (How to Play, Stats, etc.).
 */
export default function BuildVersionFooter() {
  const { t } = useTranslation();

  if (!BUILD_LABEL) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 3,
        pt: 2.5,
        borderTop: '1px solid',
        borderColor: 'divider',
        textAlign: 'center',
      }}
    >
      <Stack
        direction="row"
        spacing={1.25}
        sx={{
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          rowGap: 0.5,
        }}
      >
        <Typography
          component="span"
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            opacity: 0.9,
          }}
        >
          {t('build.versionLabel')}
        </Typography>
        <Box
          aria-hidden
          sx={{
            width: 3,
            height: 3,
            borderRadius: '50%',
            bgcolor: 'text.disabled',
            opacity: 0.6,
            flexShrink: 0,
          }}
        />
        <Typography
          component="span"
          variant="caption"
          sx={{
            fontFamily:
              'ui-monospace, "Cascadia Code", "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
            fontSize: '0.7rem',
            fontWeight: 500,
            letterSpacing: '0.04em',
            color: 'text.secondary',
            opacity: 0.95,
          }}
        >
          {BUILD_LABEL}
        </Typography>
      </Stack>
    </Box>
  );
}

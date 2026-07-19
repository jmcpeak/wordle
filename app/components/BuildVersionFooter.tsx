'use client';

import { Box, Stack, Typography } from '@mui/material';
import { useTranslation } from '@/store/i18nStore';

const BUILD_LABEL = process.env.NEXT_PUBLIC_BUILD_LABEL;
const BUILD_DATE = process.env.NEXT_PUBLIC_BUILD_DATE;

const ROOT_SX = {
  mt: 3,
  pt: 2.5,
  borderTop: '1px solid',
  borderColor: 'divider',
  textAlign: 'center',
} as const;

const STACK_SX = {
  justifyContent: 'center',
  alignItems: 'center',
  flexWrap: 'wrap',
  rowGap: 0.5,
} as const;

const LABEL_SX = {
  fontSize: '0.65rem',
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: 'text.secondary',
  opacity: 0.9,
} as const;

const DOT_SX = {
  width: 3,
  height: 3,
  borderRadius: '50%',
  bgcolor: 'text.disabled',
  opacity: 0.6,
  flexShrink: 0,
} as const;

const BUILD_ID_SX = {
  fontFamily:
    'ui-monospace, "Cascadia Code", "SFMono-Regular", Menlo, Monaco, Consolas, monospace',
  fontSize: '0.7rem',
  fontWeight: 500,
  letterSpacing: '0.04em',
  color: 'text.secondary',
  opacity: 0.95,
} as const;

/**
 * Subtle build stamp for modal footers (How to Play, Stats, etc.).
 */
export default function BuildVersionFooter() {
  const { t } = useTranslation();

  if (!BUILD_LABEL) {
    return null;
  }

  return (
    <Box sx={ROOT_SX}>
      <Stack direction="row" spacing={1.25} sx={STACK_SX}>
        <Typography component="span" variant="caption" sx={LABEL_SX}>
          {t('build.versionLabel')}
        </Typography>
        <Box aria-hidden sx={DOT_SX} />
        <Typography component="span" variant="caption" sx={BUILD_ID_SX}>
          {BUILD_LABEL}
        </Typography>
        {BUILD_DATE ? (
          <>
            <Box aria-hidden sx={DOT_SX} />
            <Typography component="span" variant="caption" sx={BUILD_ID_SX}>
              {BUILD_DATE}
            </Typography>
          </>
        ) : null}
      </Stack>
    </Box>
  );
}

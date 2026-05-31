'use client';

import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { memo, useCallback, useEffect, useState } from 'react';
import { useTranslation } from '@/store/i18nStore';

/** Maximum definitions to show per part-of-speech to keep the drawer scannable. */
const MAX_DEFINITIONS_PER_MEANING = 3;

type DictionaryDefinition = {
  definition: string;
  example?: string;
};

type DictionaryMeaning = {
  partOfSpeech: string;
  definitions: DictionaryDefinition[];
};

type DictionaryEntry = {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string }>;
  meanings: DictionaryMeaning[];
};

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; entries: DictionaryEntry[] }
  | { status: 'notFound' }
  | { status: 'error' };

type DefinitionDrawerProps = {
  open: boolean;
  onClose: () => void;
  word: string;
};

function getPhonetic(entry: DictionaryEntry): string | undefined {
  if (entry.phonetic) return entry.phonetic;
  return entry.phonetics?.find((p) => p.text)?.text;
}

export default memo(function DefinitionDrawer({
  open,
  onClose,
  word,
}: DefinitionDrawerProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<FetchState>({ status: 'idle' });

  const fetchDefinition = useCallback(async () => {
    if (!word) return;
    setState({ status: 'loading' });
    try {
      const response = await fetch(
        `/api/definition/${encodeURIComponent(word.toLowerCase())}`,
      );
      if (response.status === 404) {
        setState({ status: 'notFound' });
        return;
      }
      if (!response.ok) {
        setState({ status: 'error' });
        return;
      }
      const data = (await response.json()) as { entries?: DictionaryEntry[] };
      if (!data.entries || data.entries.length === 0) {
        setState({ status: 'notFound' });
        return;
      }
      setState({ status: 'success', entries: data.entries });
    } catch {
      setState({ status: 'error' });
    }
  }, [word]);

  // Lazy fetch on first open; cached afterward.
  useEffect(() => {
    if (open && state.status === 'idle') {
      void fetchDefinition();
    }
  }, [open, state.status, fetchDefinition]);

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      sx={{ zIndex: (theme) => theme.zIndex.modal + 1 }}
      slotProps={{
        paper: {
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '60vh',
            mx: 'auto',
            maxWidth: 600,
          },
        },
      }}
    >
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2,
          pt: 2,
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{ textTransform: 'capitalize', fontWeight: 700 }}
        >
          {word.toLowerCase()}
        </Typography>
        <IconButton
          onClick={onClose}
          aria-label={t('definition.close')}
          size="small"
        >
          <CloseIcon />
        </IconButton>
      </Stack>

      <Box
        sx={{
          px: 2,
          pb: 3,
          pt: 1,
          overflowY: 'auto',
          '& .MuiTypography-body2': { fontSize: '1rem' },
          '& .MuiTypography-caption': { fontSize: '0.875rem' },
          '& .MuiTypography-overline': { fontSize: '0.875rem' },
        }}
      >
        {state.status === 'loading' && <LoadingSkeleton />}

        {state.status === 'error' && (
          <ErrorState message={t('definition.error')} onRetry={fetchDefinition}>
            {t('definition.retry')}
          </ErrorState>
        )}

        {state.status === 'notFound' && (
          <Typography variant="body2" color="text.secondary">
            {t('definition.notFound')}
          </Typography>
        )}

        {state.status === 'success' && (
          <DefinitionContent entries={state.entries} />
        )}
      </Box>
    </Drawer>
  );
});

function LoadingSkeleton() {
  return (
    <Stack spacing={1.5} aria-busy="true" aria-live="polite">
      <Skeleton variant="text" width="30%" height={20} />
      <Divider />
      <Skeleton variant="text" width="20%" height={18} />
      <Skeleton variant="text" width="95%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="60%" />
    </Stack>
  );
}

type ErrorStateProps = {
  message: string;
  onRetry: () => void;
  children: React.ReactNode;
};

function ErrorState({ message, onRetry, children }: ErrorStateProps) {
  return (
    <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      <Button onClick={onRetry} variant="outlined" size="small">
        {children}
      </Button>
    </Stack>
  );
}

function DefinitionContent({ entries }: { entries: DictionaryEntry[] }) {
  const phonetic = entries.map(getPhonetic).find(Boolean);

  // Merge meanings across entries grouped by part of speech, preserving order.
  const meaningsByPos = new Map<string, DictionaryDefinition[]>();
  for (const entry of entries) {
    for (const meaning of entry.meanings ?? []) {
      const existing = meaningsByPos.get(meaning.partOfSpeech) ?? [];
      meaningsByPos.set(meaning.partOfSpeech, [
        ...existing,
        ...meaning.definitions,
      ]);
    }
  }

  return (
    <Stack spacing={2}>
      {phonetic && (
        <Typography variant="body2" color="text.secondary" component="p">
          {phonetic}
        </Typography>
      )}
      <Divider />
      {Array.from(meaningsByPos.entries()).map(
        ([partOfSpeech, definitions]) => (
          <Box key={partOfSpeech}>
            <Typography
              variant="overline"
              color="primary"
              sx={{ fontWeight: 700, letterSpacing: 1 }}
            >
              {partOfSpeech}
            </Typography>
            <Stack component="ol" spacing={1} sx={{ pl: 3, m: 0, mt: 0.5 }}>
              {definitions
                .slice(0, MAX_DEFINITIONS_PER_MEANING)
                .map((def, index) => (
                  <Box
                    component="li"
                    // biome-ignore lint/suspicious/noArrayIndexKey: definitions render order is stable and unique within a part of speech
                    key={`${partOfSpeech}-${index}`}
                    sx={{ '&::marker': { color: 'text.secondary' } }}
                  >
                    <Typography variant="body2">{def.definition}</Typography>
                    {def.example && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontStyle: 'italic', display: 'block', mt: 0.5 }}
                      >
                        “{def.example}”
                      </Typography>
                    )}
                  </Box>
                ))}
            </Stack>
          </Box>
        ),
      )}
    </Stack>
  );
}

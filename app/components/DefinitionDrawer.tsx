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
import type { Theme } from '@mui/material/styles';
import {
  memo,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { DictionaryDefinition, DictionaryEntry } from '@/data/definitions';
import { useTranslation } from '@/store/i18nStore';

/** Maximum definitions to show per part-of-speech to keep the drawer scannable. */
const MAX_DEFINITIONS_PER_MEANING = 3;

const DRAWER_SX = {
  zIndex: (theme: Theme) => theme.zIndex.modal + 1,
} as const;

const DRAWER_SLOT_PROPS = {
  paper: {
    'aria-labelledby': 'definition-drawer-title',
    'aria-modal': true,
    role: 'dialog',
    sx: {
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '60vh',
      mx: 'auto',
      maxWidth: 600,
    },
  },
} as const;

const HEADER_STACK_SX = {
  alignItems: 'center',
  justifyContent: 'space-between',
  px: 2,
  pt: 2,
} as const;

const TITLE_SX = {
  textTransform: 'capitalize',
  fontWeight: 700,
} as const;

const CONTENT_BOX_SX = {
  px: 2,
  pb: 3,
  pt: 1,
  overflowY: 'auto',
  '& .MuiTypography-body2': { fontSize: '1rem' },
  '& .MuiTypography-caption': { fontSize: '0.875rem' },
  '& .MuiTypography-overline': { fontSize: '0.875rem' },
} as const;

const ERROR_STACK_SX = { alignItems: 'flex-start' } as const;

const POS_TITLE_SX = { fontWeight: 700, letterSpacing: 1 } as const;

const DEFINITION_LIST_SX = { pl: 3, m: 0, mt: 0.5 } as const;

const LIST_ITEM_SX = { '&::marker': { color: 'text.secondary' } } as const;

const EXAMPLE_SX = {
  fontStyle: 'italic',
  display: 'block',
  mt: 0.5,
} as const;

const ATTRIBUTION_SX = {
  display: 'block',
  mt: 2,
  pt: 1,
} as const;

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; entries: readonly DictionaryEntry[] }
  | { status: 'notFound' }
  | { status: 'error' };

type DefinitionDrawerProps = {
  open: boolean;
  onClose: () => void;
  word: string;
};

export default memo(function DefinitionDrawer({
  open,
  onClose,
  word,
}: DefinitionDrawerProps) {
  const { t } = useTranslation();
  const [state, setState] = useState<FetchState>({ status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  const fetchDefinition = useCallback(async () => {
    if (!word) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading' });
    try {
      const response = await fetch(
        `/api/definition/${encodeURIComponent(word.toLowerCase())}`,
        { signal: controller.signal },
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
    } catch (error) {
      // An aborted request was superseded or unmounted — leave state alone.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setState({ status: 'error' });
    }
  }, [word]);

  useEffect(() => () => abortRef.current?.abort(), []);

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
      sx={DRAWER_SX}
      slotProps={DRAWER_SLOT_PROPS}
    >
      <Stack direction="row" sx={HEADER_STACK_SX}>
        <Typography
          id="definition-drawer-title"
          variant="h6"
          component="h2"
          sx={TITLE_SX}
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

      <Box sx={CONTENT_BOX_SX}>
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
  children: ReactNode;
};

function ErrorState({ message, onRetry, children }: ErrorStateProps) {
  return (
    <Stack spacing={2} sx={ERROR_STACK_SX}>
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
      <Button onClick={onRetry} variant="outlined" size="small">
        {children}
      </Button>
    </Stack>
  );
}

function DefinitionContent({
  entries,
}: {
  entries: readonly DictionaryEntry[];
}) {
  const { t } = useTranslation();
  const phonetic = useMemo(
    () => entries.map((entry) => entry.phonetic).find(Boolean),
    [entries],
  );

  // Merge meanings across entries grouped by part of speech, preserving order.
  const meaningsByPos = useMemo(() => {
    const grouped = new Map<string, DictionaryDefinition[]>();
    for (const entry of entries) {
      for (const meaning of entry.meanings ?? []) {
        const existing = grouped.get(meaning.partOfSpeech);
        if (existing) existing.push(...meaning.definitions);
        else grouped.set(meaning.partOfSpeech, [...meaning.definitions]);
      }
    }
    return grouped;
  }, [entries]);

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
            <Typography variant="overline" color="primary" sx={POS_TITLE_SX}>
              {partOfSpeech}
            </Typography>
            <Stack component="ol" spacing={1} sx={DEFINITION_LIST_SX}>
              {definitions
                .slice(0, MAX_DEFINITIONS_PER_MEANING)
                .map((def, index) => (
                  <Box
                    component="li"
                    // biome-ignore lint/suspicious/noArrayIndexKey: definitions render order is stable and unique within a part of speech
                    key={`${partOfSpeech}-${index}`}
                    sx={LIST_ITEM_SX}
                  >
                    <Typography variant="body2">{def.definition}</Typography>
                    {def.example && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={EXAMPLE_SX}
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
      <Typography
        variant="caption"
        color="text.secondary"
        component="p"
        sx={ATTRIBUTION_SX}
      >
        {t('definition.attribution')}
      </Typography>
    </Stack>
  );
}

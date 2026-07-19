'use client';

import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import { Collapse, IconButton, Tooltip } from '@mui/material';
import dynamic from 'next/dynamic';
import { memo, useCallback, useState } from 'react';
import { useTranslation } from '@/store/i18nStore';

const DefinitionDrawer = dynamic(
  () => import('@/components/DefinitionDrawer'),
  { ssr: false },
);

const COLLAPSE_DURATION_MS = 400;

const COLLAPSE_TIMEOUT = {
  enter: COLLAPSE_DURATION_MS,
  exit: COLLAPSE_DURATION_MS,
} as const;

const COLLAPSE_SX = {
  minHeight: 0,
  '&.MuiCollapse-hidden': { display: 'none' },
} as const;

const ICON_BUTTON_SX = {
  boxShadow: 2,
  backgroundColor: 'background.paper',
  '&:hover': { backgroundColor: 'background.paper' },
} as const;

type DefinitionButtonProps = {
  /** When true, the button slides up into view. */
  visible?: boolean;
  /** The solution word to look up. */
  word: string;
};

export default memo(function DefinitionButton({
  visible = false,
  word,
}: DefinitionButtonProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [drawerMounted, setDrawerMounted] = useState(false);

  const handleOpen = useCallback(() => {
    setDrawerMounted(true);
    setOpen(true);
  }, []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <Collapse in={visible} timeout={COLLAPSE_TIMEOUT} sx={COLLAPSE_SX}>
        <Tooltip title={t('definition.tooltip')}>
          <IconButton
            onClick={handleOpen}
            color="primary"
            size="large"
            aria-label={t('definition.tooltip')}
            sx={ICON_BUTTON_SX}
          >
            <MenuBookRoundedIcon />
          </IconButton>
        </Tooltip>
      </Collapse>
      {drawerMounted ? (
        <DefinitionDrawer
          key={word}
          open={open}
          onClose={handleClose}
          word={word}
        />
      ) : null}
    </>
  );
});

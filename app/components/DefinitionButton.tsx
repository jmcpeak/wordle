'use client';

import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded';
import { Collapse, IconButton, Tooltip } from '@mui/material';
import { memo, useCallback, useState } from 'react';
import DefinitionDrawer from '@/components/DefinitionDrawer';
import { useTranslation } from '@/store/i18nStore';

const COLLAPSE_DURATION_MS = 400;

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

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <Collapse
        in={visible}
        timeout={{ enter: COLLAPSE_DURATION_MS, exit: COLLAPSE_DURATION_MS }}
        sx={{
          minHeight: 0,
          '&.MuiCollapse-hidden': { display: 'none' },
        }}
      >
        <Tooltip title={t('definition.tooltip')}>
          <IconButton
            onClick={handleOpen}
            color="primary"
            size="large"
            aria-label={t('definition.tooltip')}
            sx={{
              boxShadow: 2,
              backgroundColor: 'background.paper',
              '&:hover': { backgroundColor: 'background.paper' },
            }}
          >
            <MenuBookRoundedIcon />
          </IconButton>
        </Tooltip>
      </Collapse>
      <DefinitionDrawer
        key={word}
        open={open}
        onClose={handleClose}
        word={word}
      />
    </>
  );
});

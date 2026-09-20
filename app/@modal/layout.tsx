'use client';

import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import type { Theme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from '@/store/i18nStore';

const CLOSE_BUTTON_SX = {
  position: 'absolute',
  right: 8,
  top: 8,
  zIndex: 1,
} as const;

const DIALOG_CONTENT_SX = { pt: 5 } as const;

const DIALOG_TITLE_SX = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

/**
 * Keep the paper in the visible webview. macOS standalone PWAs overlay a native
 * titlebar on the top of the layout viewport (`viewport-fit: cover`) and often
 * report `safe-area-inset-top: 0`, so an unpadded dialog's close control and
 * the top of the backdrop sit under chrome and cannot be clicked.
 */
const DIALOG_SX = {
  zIndex: (theme: Theme) => theme.zIndex.modal,
  '& .MuiDialog-container': {
    boxSizing: 'border-box',
    alignItems: 'center',
    paddingTop: 'max(52px, env(safe-area-inset-top, 0px))',
    paddingRight: 'max(16px, env(safe-area-inset-right, 0px))',
    paddingBottom: 'max(16px, env(safe-area-inset-bottom, 0px))',
    paddingLeft: 'max(16px, env(safe-area-inset-left, 0px))',
  },
} as const;

const DIALOG_PAPER_SX = {
  m: 0,
  maxHeight: '100%',
} as const;

export default function ModalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const triggerRef = useRef<HTMLElement | null>(null);
  const { t } = useTranslation();

  // Release focus from the trigger element before the Dialog's underlying
  // Modal applies aria-hidden to the page root in its own useEffect.
  // Without this, the browser blocks the aria-hidden because a descendant
  // of the hidden subtree still holds focus.
  useLayoutEffect(() => {
    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement !== document.body
    ) {
      triggerRef.current = document.activeElement;
      document.activeElement.blur();
    }
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);
  const slotProps = useMemo(
    () => ({
      paper: { sx: DIALOG_PAPER_SX },
      transition: {
        onExited: () => {
          router.back();
          setTimeout(() => {
            if (triggerRef.current?.isConnected) triggerRef.current.focus();
          }, 0);
        },
      },
    }),
    [router],
  );

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={handleClose}
      open={open}
      slotProps={slotProps}
      sx={DIALOG_SX}
    >
      <DialogTitle sx={DIALOG_TITLE_SX}>{t('dialog.modalLabel')}</DialogTitle>
      <IconButton
        aria-label={t('dialog.close')}
        onClick={handleClose}
        sx={CLOSE_BUTTON_SX}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={DIALOG_CONTENT_SX}>{children}</DialogContent>
    </Dialog>
  );
}

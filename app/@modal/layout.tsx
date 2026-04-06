'use client';

import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import { useRouter } from 'next/navigation';
import {
  type ReactNode,
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslation } from '@/store/i18nStore';

const sx = { position: 'absolute', right: 8, top: 8, zIndex: 1 };

export default function ModalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
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
      document.activeElement.blur();
    }
  }, []);

  const handleClose = useCallback(() => setOpen(false), []);
  const slotProps = useMemo(() => {
    const handleExited = () => router.back();

    return { transition: { onExited: handleExited } };
  }, [router]);

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={handleClose}
      open={open}
      slotProps={slotProps}
    >
      <IconButton aria-label={t('dialog.close')} onClick={handleClose} sx={sx}>
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ pt: 5 }}>{children}</DialogContent>
    </Dialog>
  );
}

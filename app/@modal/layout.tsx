'use client';

import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { useTranslation } from '@/store/i18nStore';

const sx = { position: 'absolute', right: 8, top: 8, zIndex: 1 };

export default function ModalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const { t } = useTranslation();

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

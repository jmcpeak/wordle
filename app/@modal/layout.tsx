'use client';

import CloseIcon from '@mui/icons-material/Close';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';
import { type ReactNode, useCallback, useState } from 'react';

export default function ModalLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  const handleClose = useCallback(() => setOpen(false), []);
  const handleExited = useCallback(() => router.back(), [router]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ transition: { onExited: handleExited } }}
    >
      <IconButton
        aria-label="close"
        onClick={handleClose}
        sx={{ position: 'absolute', right: 8, top: 8, zIndex: 1 }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent sx={{ pt: 5 }}>{children}</DialogContent>
    </Dialog>
  );
}

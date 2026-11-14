'use client';

import { useShallow } from 'zustand/react/shallow';
import BaseSnackbar from '@/components/BaseSnackbar';
import { useToastStore } from '@/store/toastStore';

const ANCHOR_ORIGIN = {
  vertical: 'bottom',
  horizontal: 'center',
} as const;

export default function ToastSnackbar() {
  const { message, severity, hideToast } = useToastStore(
    useShallow((s) => ({
      message: s.message,
      severity: s.severity,
      hideToast: s.hideToast,
    })),
  );

  return (
    <BaseSnackbar
      anchorOrigin={ANCHOR_ORIGIN}
      autoHideDuration={6000}
      message={message}
      onClose={hideToast}
      severity={severity}
    />
  );
}

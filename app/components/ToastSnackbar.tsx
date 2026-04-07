'use client';

import BaseSnackbar from '@/components/BaseSnackbar';
import { useToastStore } from '@/store/toastStore';

export default function ToastSnackbar() {
  const { message, severity, hideToast } = useToastStore();

  return (
    <BaseSnackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      autoHideDuration={6000}
      message={message}
      onClose={hideToast}
      severity={severity}
    />
  );
}

import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useInitialWordLoad } from '@/hooks/useInitialWordLoad';

describe('useInitialWordLoad', () => {
  it('calls fetchWord when enabled', async () => {
    const fetchWord = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useInitialWordLoad({ fetchWord, enabled: true }));

    await waitFor(() => {
      expect(fetchWord).toHaveBeenCalledTimes(1);
    });
  });

  it('does not fetch until enabled', async () => {
    const fetchWord = vi.fn().mockResolvedValue(undefined);

    const { rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useInitialWordLoad({ fetchWord, enabled }),
      { initialProps: { enabled: false } },
    );

    expect(fetchWord).not.toHaveBeenCalled();

    rerender({ enabled: true });

    await waitFor(() => {
      expect(fetchWord).toHaveBeenCalledTimes(1);
    });
  });
});

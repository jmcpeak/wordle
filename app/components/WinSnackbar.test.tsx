import { act, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WinSnackbar from '@/components/WinSnackbar';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

describe('WinSnackbar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a top-center snackbar with no close button or alert', () => {
    renderWithTheme(<WinSnackbar message="Genius!" onClose={() => {}} />);

    expect(screen.getByText('Genius!')).toBeTruthy();
    expect(
      document.querySelector('.MuiSnackbar-anchorOriginTopCenter'),
    ).not.toBeNull();
    expect(document.querySelector('.MuiSnackbarContent-root')).not.toBeNull();
    expect(document.querySelector('.MuiAlert-root')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('auto-hides after 10 seconds', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    renderWithTheme(<WinSnackbar message="Genius!" onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(onClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

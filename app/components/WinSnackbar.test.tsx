import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import WinSnackbar from '@/components/WinSnackbar';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

const { useStandaloneModeMock, isIosDeviceMock, useSafeAreaTopOffsetMock } =
  vi.hoisted(() => ({
    useStandaloneModeMock: vi.fn(() => false),
    isIosDeviceMock: vi.fn(() => false),
    useSafeAreaTopOffsetMock: vi.fn(() => 8),
  }));

vi.mock('@/hooks/useStandaloneMode', () => ({
  useStandaloneMode: useStandaloneModeMock,
  isIosDevice: isIosDeviceMock,
}));

vi.mock('@/hooks/useSafeAreaTopOffset', () => ({
  useSafeAreaTopOffset: useSafeAreaTopOffsetMock,
}));

describe('WinSnackbar', () => {
  beforeEach(() => {
    useStandaloneModeMock.mockReturnValue(false);
    isIosDeviceMock.mockReturnValue(false);
    useSafeAreaTopOffsetMock.mockReturnValue(8);
  });

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

  it('requests a larger minimum inset on iOS standalone', () => {
    useStandaloneModeMock.mockReturnValue(true);
    isIosDeviceMock.mockReturnValue(true);
    useSafeAreaTopOffsetMock.mockReturnValue(60);

    renderWithTheme(
      <WinSnackbar
        message="Genius!"
        onClose={() => {}}
        simulateIosStandalone
      />,
    );

    expect(useSafeAreaTopOffsetMock).toHaveBeenCalledWith(8, 52);
    expect(screen.getByText('Genius!')).toBeTruthy();
  });

  it('honors an explicit top offset override', () => {
    renderWithTheme(
      <WinSnackbar message="Genius!" onClose={() => {}} topPxOverride={72} />,
    );

    expect(screen.getByText('Genius!')).toBeTruthy();
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

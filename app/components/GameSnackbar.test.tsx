import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GameSnackbar from '@/components/GameSnackbar';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

describe('GameSnackbar', () => {
  it('renders an error severity alert when requested', () => {
    renderWithTheme(
      <GameSnackbar
        message="Network error"
        onClose={() => {}}
        severity="error"
      />,
    );

    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('MuiAlert-colorError');
    expect(alert.className).toContain('MuiAlert-filled');
    expect(alert.textContent).toContain('Network error');
  });

  it('renders retry action and invokes callback', () => {
    const onRetry = vi.fn();
    renderWithTheme(
      <GameSnackbar
        message="Could not validate word"
        onClose={() => {}}
        onRetry={onRetry}
      />,
    );

    fireEvent.click(screen.getByLabelText('Retry validating your guess'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

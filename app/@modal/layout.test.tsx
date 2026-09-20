import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ModalLayout from '@/@modal/layout';
import DismissToGameButton from '@/components/DismissToGameButton';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

describe('DismissToGameButton', () => {
  it('links back to the game', () => {
    renderWithTheme(<DismissToGameButton />);

    const close = screen.getByRole('link', { name: 'Close dialog' });
    expect(close.getAttribute('href')).toBe('/');
  });
});

describe('ModalLayout', () => {
  it('exposes a close control and labelled dialog', () => {
    renderWithTheme(
      <ModalLayout>
        <div>Stats go here</div>
      </ModalLayout>,
    );

    expect(
      screen.getByRole('dialog', { name: 'Game information' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
  });
});

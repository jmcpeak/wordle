import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DefinitionButton from '@/components/DefinitionButton';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

vi.mock('@/components/DefinitionDrawer', () => ({
  default: function MockDefinitionDrawer({
    open,
    word,
    onClose,
  }: {
    open: boolean;
    word: string;
    onClose: () => void;
  }) {
    if (!open) return null;
    return (
      <div role="dialog" aria-label={`Definition of ${word}`}>
        <button type="button" onClick={onClose}>
          Close definition
        </button>
      </div>
    );
  },
}));

describe('DefinitionButton', () => {
  it('opens the definition drawer for the given word', async () => {
    renderWithTheme(<DefinitionButton visible word="CRANE" />);

    fireEvent.click(screen.getByRole('button', { name: 'Definition' }));

    expect(
      await screen.findByRole('dialog', { name: 'Definition of CRANE' }),
    ).toBeTruthy();
  });

  it('closes the drawer when the button is hidden', async () => {
    const { rerender } = renderWithTheme(
      <DefinitionButton visible word="CRANE" />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Definition' }));
    expect(
      await screen.findByRole('dialog', { name: 'Definition of CRANE' }),
    ).toBeTruthy();

    rerender(<DefinitionButton visible={false} word="CRANE" />);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

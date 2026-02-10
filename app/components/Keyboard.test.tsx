import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Keyboard from '@/components/Keyboard';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

describe('Keyboard', () => {
  it('calls onKeyPress with the clicked key', () => {
    const onKeyPress = vi.fn();
    renderWithTheme(<Keyboard letterStatuses={{}} onKeyPress={onKeyPress} />);

    fireEvent.click(screen.getByRole('button', { name: 'Key A' }));

    expect(onKeyPress).toHaveBeenCalledWith('A');
  });

  it('renders status in aria label when provided', () => {
    renderWithTheme(
      <Keyboard letterStatuses={{ A: 'present' }} onKeyPress={() => {}} />,
    );

    expect(screen.getByRole('button', { name: 'Key A, present' })).toBeTruthy();
  });
});

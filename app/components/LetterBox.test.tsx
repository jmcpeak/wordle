import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LetterBox from '@/components/LetterBox';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

describe('LetterBox', () => {
  it('renders provided content and accessibility label', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        index={0}
        status="correct"
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    expect(tile.textContent).toBe('A');
  });

  it('accepts empty status for placeholder cells', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 2, Letter 5: empty"
        index={4}
        status="empty"
      />,
    );

    expect(screen.getByLabelText('Row 2, Letter 5: empty')).toBeTruthy();
  });
});

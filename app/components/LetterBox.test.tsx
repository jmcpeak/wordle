import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LetterBox from '@/components/LetterBox';
import { renderWithTheme } from '@/testUtils/renderWithTheme';

describe('LetterBox', () => {
  it('renders provided content and accessibility label', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        animation={{ type: 'none' }}
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
        status="empty"
        animation={{ type: 'none' }}
      />,
    );

    expect(screen.getByLabelText('Row 2, Letter 5: empty')).toBeTruthy();
  });

  it('handles disabled state', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        disabled={true}
        animation={{ type: 'none' }}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);
    expect(styles.opacity).toBe('0.5');
    expect(styles.pointerEvents).toBe('none');
  });

  it('handles focused state', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        isFocused={true}
        animation={{ type: 'none' }}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);
    expect(styles.borderColor).toBeTruthy();
  });

  it('renders different status colors correctly', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        animation={{ type: 'none' }}
      >
        A
      </LetterBox>,
    );

    const tileCorrect = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const stylesCorrect = window.getComputedStyle(tileCorrect);
    const correctBg = stylesCorrect.backgroundColor;

    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: B, present"
        status="present"
        animation={{ type: 'none' }}
      >
        B
      </LetterBox>,
    );

    const tilePresent = screen.getByLabelText('Row 1, Letter 1: B, present');
    const stylesPresent = window.getComputedStyle(tilePresent);
    const presentBg = stylesPresent.backgroundColor;

    expect(presentBg).not.toBe(correctBg);
  });
});

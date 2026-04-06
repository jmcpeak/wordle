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

  it('applies winning animation when animation type is winning', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        animation={{ type: 'winning', index: 0 }}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);

    expect(styles.animation).toBeTruthy();
    expect(styles.animation).not.toBe('none');
  });

  it('applies staggered animation delay for winning boxes based on index', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        animation={{ type: 'winning', index: 0 }}
      >
        A
      </LetterBox>,
    );

    const tile0 = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles0 = window.getComputedStyle(tile0);
    const delay0 = styles0.animationDelay;

    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 2: B, correct"
        status="correct"
        animation={{ type: 'winning', index: 1 }}
      >
        B
      </LetterBox>,
    );

    const tile1 = screen.getByLabelText('Row 1, Letter 2: B, correct');
    const styles1 = window.getComputedStyle(tile1);
    const delay1 = styles1.animationDelay;

    expect(delay1).not.toBe(delay0);
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

  it('handles loss flip to empty animation', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        animation={{ type: 'lossFlipToEmpty', delay: 100 }}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);
    expect(styles.animation).toBeTruthy();
    expect(styles.transformOrigin).toBe('50% 0%');
  });

  it('handles loss reveal animation', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        animation={{ type: 'lossReveal', delay: 200 }}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);
    expect(styles.animation).toBeTruthy();
    expect(styles.transformOrigin).toBe('50% 0%');
  });

  it('handles loss phase 2 split flap reveal', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        animation={{ type: 'lossPhase2Reveal', delay: 300 }}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);
    expect(styles.animation).toBeTruthy();
    expect(styles.transformOrigin).toBe('50% 0%');
  });

  it('handles restart flip to empty animation', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        animation={{ type: 'restartFlipToEmpty', delay: 150 }}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);
    expect(styles.animation).toBeTruthy();
    expect(styles.transformOrigin).toBe('50% 0%');
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

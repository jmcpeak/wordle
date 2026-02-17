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

  it('applies winning animation when isWinning is true', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        index={0}
        status="correct"
        isWinning={true}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);

    // Check that animation is applied (winning boxes have flip and jump animations)
    expect(styles.animation).toBeTruthy();
    expect(styles.animation).not.toBe('none');
  });

  it('applies staggered animation delay for winning boxes based on index', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        index={0}
        status="correct"
        isWinning={true}
      >
        A
      </LetterBox>,
    );

    const tile0 = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles0 = window.getComputedStyle(tile0);
    const delay0 = styles0.animationDelay;

    // Render a second box with different index
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 2: B, correct"
        index={1}
        status="correct"
        isWinning={true}
      >
        B
      </LetterBox>,
    );

    const tile1 = screen.getByLabelText('Row 1, Letter 2: B, correct');
    const styles1 = window.getComputedStyle(tile1);
    const delay1 = styles1.animationDelay;

    // Second box should have a later delay than the first
    expect(delay1).not.toBe(delay0);
  });

  it('handles disabled state', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        index={0}
        status="correct"
        disabled={true}
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
        index={0}
        status="correct"
        isFocused={true}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);
    // Focused state should have a border color change
    expect(styles.borderColor).toBeTruthy();
  });

  it('handles loss flip to empty animation', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        index={0}
        status="correct"
        isLossFlipToEmpty={true}
        lossAnimationDelay={100}
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
        index={0}
        status="correct"
        isLossReveal={true}
        lossAnimationDelay={200}
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
        index={0}
        status="correct"
        isLossPhase2SplitFlapReveal={true}
        lossAnimationDelay={300}
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
        index={0}
        status="correct"
        isRestartFlipToEmpty={true}
        lossAnimationDelay={150}
      >
        A
      </LetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const styles = window.getComputedStyle(tile);
    expect(styles.animation).toBeTruthy();
    expect(styles.transformOrigin).toBe('50% 0%');
  });

  it('handles forceBorder prop', () => {
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: A, correct"
        index={0}
        status="correct"
        forceBorder={true}
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
        index={0}
        status="correct"
      >
        A
      </LetterBox>,
    );

    const tileCorrect = screen.getByLabelText('Row 1, Letter 1: A, correct');
    const stylesCorrect = window.getComputedStyle(tileCorrect);
    const correctBg = stylesCorrect.backgroundColor;

    // Render a separate box with present status
    renderWithTheme(
      <LetterBox
        aria-label="Row 1, Letter 1: B, present"
        index={0}
        status="present"
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

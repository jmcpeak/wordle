import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SplitFlapLetterBox from '@/components/SplitFlapLetterBox';
import {
  SPLIT_FLAP_FLIP_DURATION_MS,
  WIN_COUNT_UP_STAGGER_MS,
} from '@/constants';
import { renderWithTheme } from '@/testUtils/renderWithTheme';
import { darkTheme } from '@/themes';
import { getSplitFlapCountUpStartChar } from '@/utils/splitFlapDrum';

describe('SplitFlapLetterBox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders a restart drum clear with flap halves', () => {
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="Row 1, Letter 1: Z, correct"
        status="correct"
        animation={{ type: 'restartFlipToEmpty', delay: 0 }}
      >
        Z
      </SplitFlapLetterBox>,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: Z, correct');
    expect(tile.textContent).toContain('Z');
    expect(tile.querySelector('[data-split-flap-front]')).toBeTruthy();
    expect(tile.querySelector('[data-split-flap-back]')).toBeTruthy();
    expect(tile.querySelector('[data-split-flap-bottom]')).toBeTruthy();
  });

  it('walks a random-style clear path to blank on restart', () => {
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="cell"
        status="present"
        animation={{ type: 'restartFlipToEmpty', delay: 0 }}
        drumPath={['Y', 'P', '']}
      >
        D
      </SplitFlapLetterBox>,
    );

    expect(screen.getByLabelText('cell').textContent).toContain('D');

    act(() => {
      vi.advanceTimersByTime(0);
    });
    // First fold D → Y
    expect(screen.getByLabelText('cell').textContent).toMatch(/D/);
    expect(screen.getByLabelText('cell').textContent).toMatch(/Y/);

    act(() => {
      vi.advanceTimersByTime(SPLIT_FLAP_FLIP_DURATION_MS);
    });
    // Second fold Y → P
    expect(screen.getByLabelText('cell').textContent).toMatch(/Y/);
    expect(screen.getByLabelText('cell').textContent).toMatch(/P/);

    act(() => {
      vi.advanceTimersByTime(SPLIT_FLAP_FLIP_DURATION_MS);
    });
    // Third fold P → blank
    expect(screen.getByLabelText('cell').textContent).toMatch(/P/);

    act(() => {
      vi.advanceTimersByTime(SPLIT_FLAP_FLIP_DURATION_MS);
    });
    expect(screen.getByLabelText('cell').textContent?.trim()).toBe('');
  });

  it('renders loss phase 2 reveal flaps', () => {
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="Row 1, Letter 1: A, correct"
        status="correct"
        animation={{ type: 'lossPhase2Reveal', delay: 0 }}
      >
        A
      </SplitFlapLetterBox>,
    );

    expect(screen.getByLabelText('Row 1, Letter 1: A, correct')).toBeTruthy();
  });

  it('status reveal uses mid-seam flaps (not a whole-tile center rotate)', () => {
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="Row 1, Letter 1: C, correct"
        letter="C"
        status="correct"
        animation={{ type: 'reveal', index: 0 }}
      />,
    );

    const tile = screen.getByLabelText('Row 1, Letter 1: C, correct');
    expect(tile.querySelector('[data-split-flap-front]')).toBeTruthy();
    expect(tile.querySelector('[data-split-flap-back]')).toBeTruthy();
    expect(tile.textContent).toMatch(/C/);
    const newTop = tile.querySelector(
      '[data-split-flap-new-top]',
    ) as HTMLElement;
    expect(newTop.style.getPropertyValue('--split-flap-start-bg')).toBeTruthy();
    expect(newTop.style.getPropertyValue('--split-flap-end-bg')).toBeTruthy();
  });

  it('letterEnter flaps clear → C → C', () => {
    const onDrumComplete = vi.fn();
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="cell"
        letter="C"
        status="empty"
        animation={{ type: 'letterEnter', delay: 0 }}
        drumActive
        onDrumComplete={onDrumComplete}
      />,
    );

    // First fold clear → C starts on first paint
    expect(screen.getByLabelText('cell').textContent).toMatch(/C/);

    act(() => {
      vi.advanceTimersByTime(0);
    });
    act(() => {
      vi.advanceTimersByTime(SPLIT_FLAP_FLIP_DURATION_MS);
    });
    // Second fold C → C (clack)
    expect(screen.getByLabelText('cell').textContent).toMatch(/C/);

    act(() => {
      vi.advanceTimersByTime(SPLIT_FLAP_FLIP_DURATION_MS);
    });
    expect(onDrumComplete).toHaveBeenCalledOnce();
  });

  it('keeps delayed winning C tile green before count-up starts', () => {
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="winning-cell"
        letter="C"
        status="correct"
        animation={{ type: 'winning', index: 1 }}
        drumStartChar=""
      />,
      darkTheme,
    );

    const idle = screen.getByLabelText('winning-cell');
    expect(idle.textContent).toMatch(/C/);
    expect(idle.textContent).not.toMatch(/A/);
    expect(getComputedStyle(idle).backgroundColor).toBe('rgb(106, 170, 100)');

    act(() => {
      vi.advanceTimersByTime(WIN_COUNT_UP_STAGGER_MS - 1);
    });
    const stillIdle = screen.getByLabelText('winning-cell');
    expect(stillIdle.textContent).toMatch(/C/);
    expect(stillIdle.textContent).not.toMatch(/A/);
    expect(getComputedStyle(stillIdle).backgroundColor).toBe(
      'rgb(106, 170, 100)',
    );

    act(() => {
      vi.advanceTimersByTime(1);
    });
    // First fold is C → A (not blank → A). SplitFlapUnit remounts per step.
    const folding = screen.getByLabelText('winning-cell');
    expect(folding.textContent).toMatch(/C/);
    expect(folding.textContent).toMatch(/A/);
    expect(getComputedStyle(folding).backgroundColor).toBe(
      'rgb(106, 170, 100)',
    );

    act(() => {
      vi.advanceTimersByTime(SPLIT_FLAP_FLIP_DURATION_MS * 4);
    });
    const settled = screen.getByLabelText('winning-cell');
    expect(settled.textContent).toMatch(/C/);
    expect(getComputedStyle(settled).backgroundColor).toBe(
      'rgb(106, 170, 100)',
    );
  });

  it('idles delayed winning E on E, not the drum start B', () => {
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="winning-e"
        letter="E"
        status="correct"
        animation={{ type: 'winning', index: 1 }}
        drumStartChar={getSplitFlapCountUpStartChar('E')}
      />,
      darkTheme,
    );

    const tile = screen.getByLabelText('winning-e');
    expect(getSplitFlapCountUpStartChar('E')).toBe('B');
    expect(tile.textContent).toMatch(/E/);
    expect(tile.textContent).not.toMatch(/B/);
    expect(getComputedStyle(tile).backgroundColor).toBe('rgb(106, 170, 100)');
  });

  it('idles delayed winning W on W, not the drum start Z', () => {
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="winning-w"
        letter="W"
        status="correct"
        animation={{ type: 'winning', index: 1 }}
        drumStartChar={getSplitFlapCountUpStartChar('W')}
      />,
      darkTheme,
    );

    const tile = screen.getByLabelText('winning-w');
    expect(getSplitFlapCountUpStartChar('W')).toBe('Z');
    expect(tile.textContent).toMatch(/W/);
    expect(tile.textContent).not.toMatch(/Z/);
    expect(getComputedStyle(tile).backgroundColor).toBe('rgb(106, 170, 100)');
  });

  it('enter via restartFlipToEmpty + reveal path for S starts at Z', () => {
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="cell"
        letter="S"
        status="correct"
        animation={{ type: 'restartFlipToEmpty', delay: 0 }}
        drumStartChar=""
        drumPath={['Z', 'Y', 'X', 'W', 'V', 'U', 'T', 'S']}
        drumActive
      />,
    );

    // Same machinery as Play Again; shorter enter path begins at Z
    expect(screen.getByLabelText('cell').textContent).toMatch(/Z/);
    expect(screen.getByLabelText('cell').textContent).not.toMatch(/A/);
    expect(
      screen.getByLabelText('cell').querySelector('[data-split-flap-front]'),
    ).toBeTruthy();
  });

  it('settled empty tile hides folding flaps and shows no glyph', () => {
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="empty"
        letter=""
        status="empty"
        animation={{ type: 'restartFlipToEmpty', delay: 0 }}
        drumPath={['']}
        drumStartChar=""
        drumActive={false}
      />,
    );

    const tile = screen.getByLabelText('empty');
    expect(tile.textContent?.trim()).toBe('');
    const front = tile.querySelector('[data-split-flap-front]') as HTMLElement;
    const back = tile.querySelector('[data-split-flap-back]') as HTMLElement;
    // Idle: folding panels hidden so the tile is a flat empty cell
    expect(front.style.visibility || getComputedStyle(front).visibility).toBe(
      'hidden',
    );
    expect(back.style.visibility || getComputedStyle(back).visibility).toBe(
      'hidden',
    );
  });

  it('lab-style C enter walks clear → A → B → C (not instant C)', () => {
    const onDrumComplete = vi.fn();
    renderWithTheme(
      <SplitFlapLetterBox
        aria-label="Demo letter C"
        letter="C"
        status="correct"
        animation={{ type: 'restartFlipToEmpty', delay: 0 }}
        drumStartChar=""
        drumPath={['A', 'B', 'C']}
        drumActive
        onDrumComplete={onDrumComplete}
      />,
    );

    // Must not be settled on C alone on first paint
    const initial = screen.getByLabelText('Demo letter C').textContent ?? '';
    expect(initial).toMatch(/A/);
    expect(initial.replace(/A/g, '').includes('C')).toBe(false);

    act(() => {
      vi.advanceTimersByTime(0);
    });
    act(() => {
      vi.advanceTimersByTime(SPLIT_FLAP_FLIP_DURATION_MS);
    });
    expect(screen.getByLabelText('Demo letter C').textContent).toMatch(/B/);

    act(() => {
      vi.advanceTimersByTime(SPLIT_FLAP_FLIP_DURATION_MS);
    });
    expect(screen.getByLabelText('Demo letter C').textContent).toMatch(/C/);

    act(() => {
      vi.advanceTimersByTime(SPLIT_FLAP_FLIP_DURATION_MS);
    });
    expect(onDrumComplete).toHaveBeenCalledOnce();
  });
});

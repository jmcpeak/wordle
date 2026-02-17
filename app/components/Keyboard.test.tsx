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

  it('renders correct status in aria label', () => {
    renderWithTheme(
      <Keyboard letterStatuses={{ A: 'correct' }} onKeyPress={() => {}} />,
    );

    expect(screen.getByRole('button', { name: 'Key A, correct' })).toBeTruthy();
  });

  it('renders absent status in aria label', () => {
    renderWithTheme(
      <Keyboard letterStatuses={{ A: 'absent' }} onKeyPress={() => {}} />,
    );

    expect(screen.getByRole('button', { name: 'Key A, absent' })).toBeTruthy();
  });

  it('renders BACKSPACE key with proper aria label', () => {
    renderWithTheme(<Keyboard letterStatuses={{}} onKeyPress={() => {}} />);

    expect(screen.getByRole('button', { name: 'Backspace' })).toBeTruthy();
  });

  it('renders ENTER key with proper aria label', () => {
    renderWithTheme(<Keyboard letterStatuses={{}} onKeyPress={() => {}} />);

    expect(screen.getByRole('button', { name: 'Enter' })).toBeTruthy();
  });

  it('renders BACKSPACE key with status in aria label', () => {
    renderWithTheme(
      <Keyboard
        letterStatuses={{ BACKSPACE: 'correct' }}
        onKeyPress={() => {}}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'Backspace, correct' }),
    ).toBeTruthy();
  });

  it('renders ENTER key with status in aria label', () => {
    renderWithTheme(
      <Keyboard letterStatuses={{ ENTER: 'present' }} onKeyPress={() => {}} />,
    );

    expect(screen.getByRole('button', { name: 'Enter, present' })).toBeTruthy();
  });

  it('handles disabled state', () => {
    renderWithTheme(
      <Keyboard disabled letterStatuses={{}} onKeyPress={() => {}} />,
    );

    const keyboard = screen.getByRole('group', { name: 'Keyboard' });
    const styles = window.getComputedStyle(keyboard);
    expect(styles.opacity).toBe('0.5');
    expect(styles.pointerEvents).toBe('none');
  });

  it('handles enabled state', () => {
    renderWithTheme(
      <Keyboard disabled={false} letterStatuses={{}} onKeyPress={() => {}} />,
    );

    const keyboard = screen.getByRole('group', { name: 'Keyboard' });
    const styles = window.getComputedStyle(keyboard);
    expect(styles.opacity).toBe('1');
    expect(styles.pointerEvents).toBe('auto');
  });

  it('calls onKeyPress for BACKSPACE key', () => {
    const onKeyPress = vi.fn();
    renderWithTheme(<Keyboard letterStatuses={{}} onKeyPress={onKeyPress} />);

    fireEvent.click(screen.getByRole('button', { name: 'Backspace' }));

    expect(onKeyPress).toHaveBeenCalledWith('BACKSPACE');
  });

  it('calls onKeyPress for ENTER key', () => {
    const onKeyPress = vi.fn();
    renderWithTheme(<Keyboard letterStatuses={{}} onKeyPress={onKeyPress} />);

    fireEvent.click(screen.getByRole('button', { name: 'Enter' }));

    expect(onKeyPress).toHaveBeenCalledWith('ENTER');
  });

  it('does not include status in aria label when status is empty', () => {
    renderWithTheme(
      <Keyboard letterStatuses={{ A: 'empty' }} onKeyPress={() => {}} />,
    );

    expect(screen.getByRole('button', { name: 'Key A' })).toBeTruthy();
  });

  it('renders all keyboard rows', () => {
    renderWithTheme(<Keyboard letterStatuses={{}} onKeyPress={() => {}} />);

    // Check that we have keys from all rows
    expect(screen.getByRole('button', { name: 'Key Q' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Key A' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Key Z' })).toBeTruthy();
  });
});

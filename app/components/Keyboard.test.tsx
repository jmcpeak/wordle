import { fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Keyboard, { type KeyboardHandle } from '@/components/Keyboard';
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

    expect(
      screen.getByRole('button', { name: 'Key A, in wrong position' }),
    ).toBeTruthy();
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

    expect(
      screen.getByRole('button', { name: 'Key A, not in word' }),
    ).toBeTruthy();
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

    expect(
      screen.getByRole('button', { name: 'Enter, in wrong position' }),
    ).toBeTruthy();
  });

  it('handles disabled state', () => {
    renderWithTheme(
      <Keyboard disabled letterStatuses={{}} onKeyPress={() => {}} />,
    );

    const keyboard = screen.getByRole('group', { name: 'On-screen keyboard' });
    const keyA = screen.getByRole('button', { name: 'Key A' });
    const styles = window.getComputedStyle(keyboard);
    expect(styles.opacity).toBe('0.5');
    expect(keyA.getAttribute('disabled')).not.toBeNull();
    expect(keyboard.getAttribute('aria-disabled')).toBe('true');
  });

  it('looks enabled but blocks interaction when disabled=true and visuallyDisabled=false', () => {
    const onKeyPress = vi.fn();
    renderWithTheme(
      <Keyboard
        disabled
        visuallyDisabled={false}
        letterStatuses={{}}
        onKeyPress={onKeyPress}
      />,
    );

    const keyboard = screen.getByRole('group', { name: 'On-screen keyboard' });
    const keyA = screen.getByRole('button', { name: 'Key A' });
    const styles = window.getComputedStyle(keyboard);
    expect(styles.opacity).toBe('1');
    expect(styles.pointerEvents).toBe('none');
    expect(keyA.getAttribute('disabled')).toBeNull();
    expect(keyboard.getAttribute('aria-disabled')).toBe('true');
  });

  it('handles enabled state', () => {
    renderWithTheme(
      <Keyboard disabled={false} letterStatuses={{}} onKeyPress={() => {}} />,
    );

    const keyboard = screen.getByRole('group', { name: 'On-screen keyboard' });
    const keyA = screen.getByRole('button', { name: 'Key A' });
    const styles = window.getComputedStyle(keyboard);
    expect(styles.opacity).toBe('1');
    expect(keyA.getAttribute('disabled')).toBeNull();
    expect(keyboard.getAttribute('aria-disabled')).toBeNull();
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

  it('exposes flashKey via imperative handle', () => {
    const ref = createRef<KeyboardHandle>();
    renderWithTheme(
      <Keyboard ref={ref} letterStatuses={{}} onKeyPress={() => {}} />,
    );

    expect(ref.current).not.toBeNull();
    expect(typeof ref.current?.flashKey).toBe('function');
    expect(() => ref.current?.flashKey('A')).not.toThrow();
  });

  it('flashKey does not throw for unknown keys', () => {
    const ref = createRef<KeyboardHandle>();
    renderWithTheme(
      <Keyboard ref={ref} letterStatuses={{}} onKeyPress={() => {}} />,
    );

    expect(() => ref.current?.flashKey('NONEXISTENT')).not.toThrow();
  });

  it('shows a MUI-style circular ripple on pointer down', () => {
    renderWithTheme(<Keyboard letterStatuses={{}} onKeyPress={() => {}} />);

    const keyA = screen.getByRole('button', { name: 'Key A' });
    fireEvent.pointerDown(keyA, { clientX: 20, clientY: 20 });

    const ripple = keyA.querySelector('.key-ripple');
    expect(ripple).toBeTruthy();
    expect(ripple?.tagName).toBe('SPAN');
  });
});

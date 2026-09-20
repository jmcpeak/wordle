import { ThemeProvider } from '@mui/material';
import { act, fireEvent, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import Keyboard, { type KeyboardHandle } from '@/components/Keyboard';
import { renderWithTheme } from '@/testUtils/renderWithTheme';
import { lightTheme } from '@/themes';

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
    expect(keyA.getAttribute('disabled')).toBeNull();
    expect(keyA.className).not.toMatch(/Mui-disabled/);
    expect(keyA.getAttribute('aria-disabled')).toBe('true');
    expect(keyA.getAttribute('tabindex')).toBe('-1');
    expect(keyA.getAttribute('data-dimmed')).toBe('true');
    expect(keyboard.getAttribute('aria-disabled')).toBe('true');
  });

  it('does not fire Enter when enterDisabled is set', () => {
    const onKeyPress = vi.fn();
    renderWithTheme(
      <Keyboard enterDisabled letterStatuses={{}} onKeyPress={onKeyPress} />,
    );

    const enter = screen.getByRole('button', { name: 'Enter' });
    expect(enter.getAttribute('disabled')).toBeNull();
    expect(enter.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(enter);
    expect(onKeyPress).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Key A' }));
    expect(onKeyPress).toHaveBeenCalledWith('A');
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
    expect(keyA.getAttribute('aria-disabled')).toBe('true');
    expect(keyA.getAttribute('tabindex')).toBe('-1');
    expect(keyboard.getAttribute('aria-disabled')).toBe('true');

    fireEvent.click(keyA);
    expect(onKeyPress).not.toHaveBeenCalled();
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

  it('flashKey targets the right button after re-renders', () => {
    const ref = createRef<KeyboardHandle>();
    const { rerender } = renderWithTheme(
      <Keyboard ref={ref} letterStatuses={{}} onKeyPress={() => {}} />,
    );

    act(() => ref.current?.flashKey('A'));
    expect(screen.getByRole('button', { name: 'Key A' }).dataset.pressed).toBe(
      'true',
    );

    // Key refs are registered through `data-key` with a stable callback, so a
    // re-render with a fresh statuses object must not lose the registry.
    rerender(
      <ThemeProvider theme={lightTheme}>
        <Keyboard
          ref={ref}
          letterStatuses={{ B: 'absent' }}
          onKeyPress={() => {}}
        />
      </ThemeProvider>,
    );

    act(() => ref.current?.flashKey('Z'));
    expect(screen.getByRole('button', { name: 'Key Z' }).dataset.pressed).toBe(
      'true',
    );
    expect(
      screen.getByRole('button', { name: 'Key Q' }).dataset.pressed,
    ).toBeUndefined();
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

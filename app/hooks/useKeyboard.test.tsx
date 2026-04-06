import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboard } from '@/hooks/useKeyboard';

function KeyboardTestHarness({
  disabled = false,
  onInput,
}: {
  disabled?: boolean;
  onInput: (key: string) => void;
}) {
  useKeyboard(onInput, disabled);
  return null;
}

describe('useKeyboard', () => {
  it('normalizes keyboard input to uppercase', () => {
    const onInput = vi.fn();
    render(<KeyboardTestHarness onInput={onInput} />);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(onInput).toHaveBeenCalledWith('A');
  });

  it('ignores keydown when meta/ctrl/alt modifiers are active', () => {
    const onInput = vi.fn();
    render(<KeyboardTestHarness onInput={onInput} />);

    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', metaKey: true }),
    );
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'a', altKey: true }),
    );

    expect(onInput).not.toHaveBeenCalled();
  });

  it('does not forward non-game keys to the handler', () => {
    const onInput = vi.fn();
    render(<KeyboardTestHarness onInput={onInput} />);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Shift' }));

    expect(onInput).not.toHaveBeenCalled();
  });

  it('does not forward keys when disabled', () => {
    const onInput = vi.fn();
    render(<KeyboardTestHarness disabled onInput={onInput} />);

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

    expect(onInput).not.toHaveBeenCalled();
  });

  it('handles paste by dispatching each letter', () => {
    const onInput = vi.fn();
    render(<KeyboardTestHarness onInput={onInput} />);

    const pasteEvent = new Event('paste') as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => 'a-b 9c' },
      configurable: true,
    });

    window.dispatchEvent(pasteEvent);

    expect(onInput).toHaveBeenNthCalledWith(1, 'A');
    expect(onInput).toHaveBeenNthCalledWith(2, 'B');
    expect(onInput).toHaveBeenNthCalledWith(3, 'C');
  });

  it('does not consume keydown when focus is inside an input', () => {
    const onInput = vi.fn();
    render(<KeyboardTestHarness onInput={onInput} />);
    const input = document.createElement('input');
    document.body.appendChild(input);

    const keyEvent = new KeyboardEvent('keydown', {
      key: 'a',
      cancelable: true,
    });
    Object.defineProperty(keyEvent, 'target', {
      value: input,
      configurable: true,
    });

    window.dispatchEvent(keyEvent);

    expect(onInput).not.toHaveBeenCalled();
    expect(keyEvent.defaultPrevented).toBe(false);
    input.remove();
  });

  it('does not consume paste when focus is inside a textarea', () => {
    const onInput = vi.fn();
    render(<KeyboardTestHarness onInput={onInput} />);
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    const pasteEvent = new Event('paste', {
      cancelable: true,
    }) as ClipboardEvent;
    Object.defineProperty(pasteEvent, 'target', {
      value: textarea,
      configurable: true,
    });
    Object.defineProperty(pasteEvent, 'clipboardData', {
      value: { getData: () => 'abcde' },
      configurable: true,
    });

    window.dispatchEvent(pasteEvent);

    expect(onInput).not.toHaveBeenCalled();
    expect(pasteEvent.defaultPrevented).toBe(false);
    textarea.remove();
  });
});

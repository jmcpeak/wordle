import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useKeyboard } from '@/hooks/useKeyboard';

function KeyboardTestHarness({ onInput }: { onInput: (key: string) => void }) {
  useKeyboard(onInput);
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
});

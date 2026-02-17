import { useCallback, useEffect } from 'react';
import { WORD_LENGTH } from '@/constants';

/** Keys that the game consumes; we prevent them from activating focused buttons (e.g. theme toggle). */
function isGameKey(key: string): boolean {
  const k = key.toUpperCase();
  return (
    k === 'ENTER' || k === 'BACKSPACE' || (k.length === 1 && /^[A-Z]$/.test(k))
  );
}

export const useKeyboard = (
  handleInput: (key: string) => void | Promise<void>,
  disabled = false,
) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle input if keyboard is disabled
      if (disabled) {
        return;
      }
      // Handle meta keys (Command, Control, Alt) to allow browser shortcuts
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const key = event.key.toUpperCase();
      if (isGameKey(key)) {
        event.preventDefault();
        event.stopPropagation();
      }
      handleInput(key);
    },
    [handleInput, disabled],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      // Don't handle paste if keyboard is disabled
      if (disabled) {
        return;
      }
      const text = event.clipboardData?.getData('text') ?? '';
      const letters = text
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, WORD_LENGTH);
      for (const letter of letters) {
        handleInput(letter);
      }
    },
    [handleInput, disabled],
  );

  useEffect(() => {
    // Capture phase so we run before focused elements (e.g. theme button) receive the key
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleKeyDown, handlePaste]);
};

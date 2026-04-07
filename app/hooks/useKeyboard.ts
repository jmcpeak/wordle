import { useCallback, useEffect } from 'react';
import { WORD_LENGTH } from '@/constants';

/** Keys that the game consumes; we prevent them from activating focused buttons (e.g. theme toggle). */
function isGameKey(key: string): boolean {
  if (key === '.') return true;
  const k = key.toUpperCase();
  return (
    k === 'ENTER' || k === 'BACKSPACE' || (k.length === 1 && /^[A-Z]$/.test(k))
  );
}

function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
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
      if (isEditableElement(event.target)) {
        return;
      }
      if (!isGameKey(event.key)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      const key = event.key === '.' ? 'PLACEHOLDER' : event.key.toUpperCase();
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
      if (isEditableElement(event.target)) {
        return;
      }
      const text = event.clipboardData?.getData('text') ?? '';
      const letters = text
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, WORD_LENGTH);
      if (letters.length > 0) {
        event.preventDefault();
      }
      // handleInput is async but resolves synchronously for letter keys (no
      // await is hit), so each call completes before the next loop iteration
      // reads the updated store. Safe only because letters never trigger the
      // async validation path — only ENTER does.
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

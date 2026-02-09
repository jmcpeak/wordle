import { useCallback, useEffect } from 'react';

export const useKeyboard = (handleInput: (key: string) => void) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Handle meta keys (Command, Control, Alt) to allow browser shortcuts
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      handleInput(event.key.toUpperCase());
    },
    [handleInput],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData('text') ?? '';
      const letters = text.toUpperCase().replace(/[^A-Z]/g, '');
      for (const letter of letters) {
        handleInput(letter);
      }
    },
    [handleInput],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleKeyDown, handlePaste]);
};

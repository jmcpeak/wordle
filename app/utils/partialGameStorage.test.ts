import { afterEach, describe, expect, it } from 'vitest';
import {
  clearPartialGameFromStorage,
  loadPartialGameFromStorage,
  localGuessesExtendServer,
  PARTIAL_GAME_STORAGE_KEY,
  savePartialGameToStorage,
} from '@/utils/partialGameStorage';

describe('partialGameStorage', () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it('round-trips a valid partial game', () => {
    savePartialGameToStorage('CRANE', ['SLATE']);
    expect(loadPartialGameFromStorage()).toEqual({
      solution: 'CRANE',
      guesses: ['SLATE'],
    });
  });

  it('allows zero guesses for a freshly started word', () => {
    savePartialGameToStorage('APPLE', []);
    expect(loadPartialGameFromStorage()).toEqual({
      solution: 'APPLE',
      guesses: [],
    });
  });

  it('rejects invalid or completed games', () => {
    window.localStorage.setItem(
      PARTIAL_GAME_STORAGE_KEY,
      JSON.stringify({ solution: 'NO', guesses: [] }),
    );
    expect(loadPartialGameFromStorage()).toBeNull();

    savePartialGameToStorage('APPLE', ['APPLE']);
    expect(loadPartialGameFromStorage()).toBeNull();
  });

  it('clears stored games', () => {
    savePartialGameToStorage('CRANE', ['SLATE']);
    clearPartialGameFromStorage();
    expect(loadPartialGameFromStorage()).toBeNull();
  });

  it('detects when local guesses extend the server list', () => {
    expect(localGuessesExtendServer(['SLATE', 'BRAIN'], ['SLATE'])).toBe(true);
    expect(localGuessesExtendServer(['SLATE'], ['SLATE'])).toBe(false);
    expect(localGuessesExtendServer(['BRAIN'], ['SLATE'])).toBe(false);
  });
});

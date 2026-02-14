import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GAME_STATE,
  SUBMISSION_STATUS,
  WIN_ANIMATION_DURATION_MS,
} from '@/constants';
import { createGameActions, type GameStore } from '@/store/gameActions';

function createTestStore(overrides: Partial<GameStore> = {}) {
  let state: GameStore = {
    solution: '',
    guesses: [],
    currentGuess: '',
    gameState: GAME_STATE.LOADING,
    hasInitialized: false,
    message: '',
    messageSeverity: 'info',
    letterStatuses: {},
    submissionStatus: SUBMISSION_STATUS.IDLE,
    isSubmitting: false,
    fetchWord: async () => {},
    handleInput: async () => {},
    handleRestart: () => {},
    clearMessage: () => {},
    ...overrides,
  };

  const setState = (partial: Partial<GameStore>) => {
    state = { ...state, ...partial };
  };

  const getState = () => state;
  const actions = createGameActions(setState as never, getState as never);
  state = { ...state, ...actions };

  return {
    actions,
    getState,
  };
}

describe('createGameActions', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('fetchWord sets a playable state when API returns a word', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ word: 'APPLE' }),
      }),
    );
    const { actions, getState } = createTestStore();

    await actions.fetchWord();

    expect(getState().solution).toBe('APPLE');
    expect(getState().gameState).toBe(GAME_STATE.PLAYING);
    expect(getState().hasInitialized).toBe(true);
  });

  it('fetchWord reports a no-valid-word message after repeated failures', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord();

    expect(fetchMock).toHaveBeenCalledTimes(10);
    expect(getState().gameState).toBe(GAME_STATE.ERROR);
    expect(getState().message).toBe('message.noValidWord');
  });

  it('handleInput submits a valid winning guess', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isValid: true }),
      }),
    );
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      solution: 'APPLE',
      currentGuess: 'APPLE',
      guesses: [],
    });

    await actions.handleInput('ENTER');

    expect(getState().guesses).toEqual(['APPLE']);
    expect(getState().currentGuess).toBe('');
    expect(getState().gameState).toBe(GAME_STATE.WON);
    expect(getState().submissionStatus).toBe(SUBMISSION_STATUS.SUCCESS);

    // Win message is delayed until after the animation completes.
    expect(getState().message).toBe('');
    vi.advanceTimersByTime(WIN_ANIMATION_DURATION_MS);
    expect(getState().message).toBe('message.youWon');

    vi.useRealTimers();
  });
});

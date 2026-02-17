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

    // Win message should not be set (no snackbar for wins)
    expect(getState().message).toBe('');
    vi.advanceTimersByTime(WIN_ANIMATION_DURATION_MS);
    expect(getState().message).toBe('');

    vi.useRealTimers();
  });

  it('handleInput updates letter status to present when status is present and not already correct', async () => {
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
      currentGuess: 'PLANE', // P, L, A are present, E is correct
      guesses: [],
      letterStatuses: {},
    });

    await actions.handleInput('ENTER');

    expect(getState().letterStatuses.P).toBe('present');
    expect(getState().letterStatuses.L).toBe('present');
    expect(getState().letterStatuses.A).toBe('present');
    expect(getState().letterStatuses.E).toBe('correct');
  });

  it('handleInput does not update letter status to present if already correct', async () => {
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
      currentGuess: 'APART', // A is correct, P is present
      guesses: [],
      letterStatuses: { P: 'correct' }, // P is already correct
    });

    await actions.handleInput('ENTER');

    // P should remain correct, not be downgraded to present
    expect(getState().letterStatuses.P).toBe('correct');
  });

  it('handleInput updates letter status to absent when status is absent and not already correct or present', async () => {
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
      currentGuess: 'CRANE', // C, R, N are absent
      guesses: [],
      letterStatuses: {},
    });

    await actions.handleInput('ENTER');

    expect(getState().letterStatuses.C).toBe('absent');
    expect(getState().letterStatuses.R).toBe('absent');
    expect(getState().letterStatuses.N).toBe('absent');
  });

  it('handleInput does not update letter status to absent if already correct', async () => {
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
      currentGuess: 'CRANE', // C is absent, but A is correct
      guesses: [],
      letterStatuses: { C: 'correct' }, // C is already correct
    });

    await actions.handleInput('ENTER');

    // C should remain correct, not be downgraded to absent
    expect(getState().letterStatuses.C).toBe('correct');
  });

  it('handleInput does not update letter status to absent if already present', async () => {
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
      currentGuess: 'CRANE', // C is absent
      guesses: [],
      letterStatuses: { C: 'present' }, // C is already present
    });

    await actions.handleInput('ENTER');

    // C should remain present, not be downgraded to absent
    expect(getState().letterStatuses.C).toBe('present');
  });

  it('handleInput handles BACKSPACE to remove last character', async () => {
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      currentGuess: 'APPLE',
    });

    await actions.handleInput('BACKSPACE');

    expect(getState().currentGuess).toBe('APPL');
  });

  it('handleInput handles BACKSPACE on empty guess', async () => {
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      currentGuess: '',
    });

    await actions.handleInput('BACKSPACE');

    expect(getState().currentGuess).toBe('');
  });

  it('handleInput adds letter when key is A-Z and guess is not full', async () => {
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      currentGuess: 'APP',
    });

    await actions.handleInput('L');

    expect(getState().currentGuess).toBe('APPL');
  });

  it('handleInput does not add letter when guess is already full', async () => {
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      currentGuess: 'APPLE',
    });

    await actions.handleInput('X');

    expect(getState().currentGuess).toBe('APPLE');
  });

  it('handleInput ignores non-letter keys', async () => {
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      currentGuess: 'APP',
    });

    await actions.handleInput('!');
    await actions.handleInput('@');
    await actions.handleInput('1');

    expect(getState().currentGuess).toBe('APP');
  });

  it('handleInput handles loss when max guesses reached', async () => {
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
      currentGuess: 'CRANE',
      guesses: ['WORDS', 'THINK', 'MUSIC', 'DANCE', 'QUICK'], // 5 guesses already
    });

    await actions.handleInput('ENTER');

    expect(getState().guesses).toHaveLength(6);
    expect(getState().gameState).toBe(GAME_STATE.LOST);
    expect(getState().submissionStatus).toBe(SUBMISSION_STATUS.SUCCESS);
  });
});

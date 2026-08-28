import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  GAME_STATE,
  SUBMISSION_STATUS,
  WIN_ANIMATION_DURATION_MS,
} from '@/constants';
import { EN_US_FALLBACK_TRANSLATIONS } from '@/store/enUsFallbackTranslations';
import { createGameActions, type GameStore } from '@/store/gameActions';
import { partialGameFetchCalls } from '@/testUtils/fetchMockCalls';
import {
  loadPartialGameFromStorage,
  PARTIAL_GAME_STORAGE_KEY,
  savePartialGameToStorage,
} from '@/utils/partialGameStorage';

function createTestStore(overrides: Partial<GameStore> = {}) {
  let state: GameStore = {
    solution: '',
    guesses: [],
    currentGuess: '',
    gameState: GAME_STATE.LOADING,
    hasInitialized: false,
    message: '',
    messageSeverity: 'info',
    retryAction: null,
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
    window.localStorage.clear();
  });

  it('fetchWord sets a playable state when API returns a word', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ word: 'APPLE' }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord();

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cache: 'no-store' }),
    );
    expect(getState().solution).toBe('APPLE');
    expect(getState().gameState).toBe(GAME_STATE.PLAYING);
    expect(getState().hasInitialized).toBe(true);
  });

  it('fetchWord redirects to sign-in when the partial-game API returns 401', async () => {
    const replace = vi.fn();
    vi.stubGlobal('location', { replace });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    });
    vi.stubGlobal('fetch', fetchMock);
    savePartialGameToStorage('CRANE', ['SLATE']);
    const { actions, getState } = createTestStore();

    await actions.fetchWord();

    expect(replace).toHaveBeenCalledWith('/signin');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(getState().gameState).toBe(GAME_STATE.PLAYING);
    expect(getState().solution).toBe('CRANE');
  });

  it('fetchWord applies an RSC seed without network calls', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord({
      solution: 'CRANE',
      guesses: ['SLATE'],
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getState().solution).toBe('CRANE');
    expect(getState().guesses).toEqual(['SLATE']);
    expect(getState().gameState).toBe(GAME_STATE.PLAYING);
    expect(getState().hasInitialized).toBe(true);
    expect(loadPartialGameFromStorage()).toEqual({
      solution: 'CRANE',
      guesses: ['SLATE'],
    });
  });

  it('fetchWord with empty RSC seed clears stale localStorage', async () => {
    savePartialGameToStorage('CRANE', ['SLATE']);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord({ solution: 'APPLE', guesses: [] });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(getState().solution).toBe('APPLE');
    expect(getState().guesses).toEqual([]);
    expect(loadPartialGameFromStorage()).toEqual({
      solution: 'APPLE',
      guesses: [],
    });
  });

  it('fetchWord RSC seed prefers local guesses that extend the server game', async () => {
    savePartialGameToStorage('CRANE', ['SLATE', 'BRAIN']);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord({
      solution: 'CRANE',
      guesses: ['SLATE'],
    });

    expect(getState().guesses).toEqual(['SLATE', 'BRAIN']);
    const saveCalls = partialGameFetchCalls(fetchMock.mock.calls, {
      method: 'POST',
    });
    expect(saveCalls).toHaveLength(1);
  });

  it('fetchWord restores a partial game when one exists', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        game: { solution: 'CRANE', guesses: ['SLATE', 'BRAIN'] },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord();

    expect(getState().solution).toBe('CRANE');
    expect(getState().guesses).toEqual(['SLATE', 'BRAIN']);
    expect(getState().gameState).toBe(GAME_STATE.PLAYING);
    expect(getState().hasInitialized).toBe(true);
    expect(getState().letterStatuses).toHaveProperty('S');
    // Should only call partial-game endpoint, not word endpoint
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(loadPartialGameFromStorage()).toEqual({
      solution: 'CRANE',
      guesses: ['SLATE', 'BRAIN'],
    });
  });

  it('fetchWord paints instantly from localStorage before the server responds', async () => {
    savePartialGameToStorage('CRANE', ['SLATE']);

    let resolvePartial: ((value: unknown) => void) | undefined;
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePartial = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    const promise = actions.fetchWord();

    expect(getState().solution).toBe('CRANE');
    expect(getState().guesses).toEqual(['SLATE']);
    expect(getState().gameState).toBe(GAME_STATE.PLAYING);
    expect(getState().hasInitialized).toBe(true);

    resolvePartial?.({
      ok: true,
      json: async () => ({
        game: { solution: 'CRANE', guesses: ['SLATE'] },
      }),
    });
    await promise;
  });

  it('fetchWord prefers local guesses that extend the same server game', async () => {
    savePartialGameToStorage('CRANE', ['SLATE', 'BRAIN']);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        game: { solution: 'CRANE', guesses: ['SLATE'] },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord();

    expect(getState().guesses).toEqual(['SLATE', 'BRAIN']);
    const saveCalls = partialGameFetchCalls(fetchMock.mock.calls, {
      method: 'POST',
    });
    expect(saveCalls).toHaveLength(1);
  });

  it('fetchWord keeps the cached game when the server is unreachable', async () => {
    savePartialGameToStorage('CRANE', ['SLATE']);

    const fetchMock = vi
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord();

    expect(getState().solution).toBe('CRANE');
    expect(getState().guesses).toEqual(['SLATE']);
    expect(getState().gameState).toBe(GAME_STATE.PLAYING);
    // Should not fall through to /api/word retries while a cached game exists
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fetchWord clears stale localStorage when the server has no partial game', async () => {
    savePartialGameToStorage('CRANE', ['SLATE']);

    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ game: null }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ word: 'APPLE' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord();

    expect(getState().solution).toBe('APPLE');
    expect(getState().guesses).toEqual([]);
    expect(window.localStorage.getItem(PARTIAL_GAME_STORAGE_KEY)).toContain(
      'APPLE',
    );
  });

  it('fetchWord falls through to word API when no partial game exists', async () => {
    let callCount = 0;
    const fetchMock = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ game: null }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ word: 'APPLE' }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    await actions.fetchWord();

    expect(getState().solution).toBe('APPLE');
    expect(getState().gameState).toBe(GAME_STATE.PLAYING);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('fetchWord reports a no-valid-word message after repeated failures', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore();

    const promise = actions.fetchWord();
    // Advance past all exponential backoff delays (500ms * 1..10 = 27.5s)
    await vi.advanceTimersByTimeAsync(30_000);
    await promise;

    // 1 call for partial-game + 10 retries for word API
    expect(fetchMock).toHaveBeenCalledTimes(11);
    expect(getState().gameState).toBe(GAME_STATE.ERROR);
    expect(getState().message).toBe('message.noValidWord');
    vi.useRealTimers();
  });

  it('handleInput shows couldNotValidateWord when validate fetch fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      solution: 'APPLE',
      currentGuess: 'CRANE',
      guesses: [],
    });

    await actions.handleInput('ENTER');

    expect(getState().message).toBe(
      EN_US_FALLBACK_TRANSLATIONS['message.couldNotValidateWord'],
    );
    expect(getState().messageSeverity).toBe('error');
    expect(getState().retryAction).toBe('submitGuess');
    expect(getState().submissionStatus).toBe(SUBMISSION_STATUS.ERROR);
    expect(getState().guesses).toEqual([]);
  });

  it('handleInput shows couldNotValidateWord when validate response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          isValid: false,
          error: 'Validation service timed out',
        }),
      }),
    );
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      solution: 'APPLE',
      currentGuess: 'CRANE',
      guesses: [],
    });

    await actions.handleInput('ENTER');

    expect(getState().message).toBe(
      EN_US_FALLBACK_TRANSLATIONS['message.couldNotValidateWord'],
    );
    expect(getState().messageSeverity).toBe('error');
    expect(getState().retryAction).toBe('submitGuess');
    expect(getState().guesses).toEqual([]);
  });

  it('handleInput clears retryAction for invalid words', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ isValid: false }),
      }),
    );
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      solution: 'APPLE',
      currentGuess: 'CRANE',
      guesses: [],
      retryAction: 'submitGuess',
    });

    await actions.handleInput('ENTER');

    expect(getState().message).toBe('message.notValidWord');
    expect(getState().retryAction).toBeNull();
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
    expect(getState().retryAction).toBeNull();
    expect(getState().message).toBe('Genius!');
    expect(getState().messageSeverity).toBe('info');
    vi.advanceTimersByTime(WIN_ANIMATION_DURATION_MS);
    expect(getState().message).toBe('Genius!');

    vi.useRealTimers();
  });

  it('handleInput sets congratulations copy from the guess count', async () => {
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
      guesses: ['WORDS', 'PLANT'],
    });

    await actions.handleInput('ENTER');

    expect(getState().gameState).toBe(GAME_STATE.WON);
    expect(getState().message).toBe('Impressive!');
    expect(getState().messageSeverity).toBe('info');
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

  it('handleInput saves partial game after a valid non-winning guess', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      solution: 'APPLE',
      currentGuess: 'CRANE',
      guesses: [],
    });

    await actions.handleInput('ENTER');

    const saveCalls = partialGameFetchCalls(fetchMock.mock.calls);
    expect(saveCalls).toHaveLength(1);
    const firstCall = saveCalls[0];
    expect(firstCall).toBeDefined();
    const [, init] = firstCall as [string, RequestInit];
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body.solution).toBe('APPLE');
    expect(body.guesses).toEqual(['CRANE']);
  });

  it('handleInput does not save partial game on a winning guess', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      solution: 'APPLE',
      currentGuess: 'APPLE',
      guesses: [],
    });

    await actions.handleInput('ENTER');

    const saveCalls = partialGameFetchCalls(fetchMock.mock.calls);
    expect(saveCalls).toHaveLength(0);
  });

  it('handleInput does not save partial game on a losing guess', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isValid: true }),
    });
    vi.stubGlobal('fetch', fetchMock);
    const { actions } = createTestStore({
      gameState: GAME_STATE.PLAYING,
      solution: 'APPLE',
      currentGuess: 'CRANE',
      guesses: ['WORDS', 'THINK', 'MUSIC', 'DANCE', 'QUICK'],
    });

    await actions.handleInput('ENTER');

    const saveCalls = partialGameFetchCalls(fetchMock.mock.calls);
    expect(saveCalls).toHaveLength(0);
  });

  it('handleRestart deletes the partial game and shows loading until a word arrives', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { actions, getState } = createTestStore({
      gameState: GAME_STATE.WON,
      solution: 'APPLE',
      guesses: ['APPLE'],
      hasInitialized: true,
    });

    let resolvePartial:
      | ((value: { ok: boolean; json: () => Promise<{ game: null }> }) => void)
      | undefined;
    const partialPromise = new Promise<{
      ok: boolean;
      json: () => Promise<{ game: null }>;
    }>((resolve) => {
      resolvePartial = resolve;
    });

    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') {
        return Promise.resolve({ ok: true, json: async () => ({}) });
      }
      if (url.includes('/api/partial-game')) {
        return partialPromise;
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ word: 'CRANE' }),
      });
    });

    actions.handleRestart();

    expect(getState().gameState).toBe(GAME_STATE.LOADING);
    expect(getState().hasInitialized).toBe(false);
    expect(getState().solution).toBe('');
    expect(getState().guesses).toEqual([]);

    expect(resolvePartial).toBeTypeOf('function');
    if (resolvePartial == null) {
      throw new Error('expected partial-game promise resolver');
    }
    resolvePartial({
      ok: true,
      json: async () => ({ game: null }),
    });

    await vi.waitFor(() => {
      expect(getState().gameState).toBe(GAME_STATE.PLAYING);
    });

    expect(getState().hasInitialized).toBe(true);
    expect(getState().solution).toBe('CRANE');

    const deleteCalls = partialGameFetchCalls(fetchMock.mock.calls, {
      method: 'DELETE',
    });
    expect(deleteCalls).toHaveLength(1);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useStatsStore } from '@/store/statsStore';

const EMPTY_STATS = {
  gamesWon: 0,
  gamesLost: 0,
  guessDistribution: {},
  recentGames: [],
};

function jsonResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => data,
  };
}

describe('statsStore request ordering', () => {
  beforeEach(() => {
    useStatsStore.getState().clearStats();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not restore a previous user response after stats are cleared', async () => {
    let resolveLoad!: (response: ReturnType<typeof jsonResponse>) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<ReturnType<typeof jsonResponse>>((resolve) => {
            resolveLoad = resolve;
          }),
      ),
    );

    const load = useStatsStore.getState().loadStats();
    useStatsStore.getState().clearStats();
    resolveLoad(jsonResponse({ ...EMPTY_STATS, gamesWon: 9 }));
    await load;

    expect(useStatsStore.getState()).toMatchObject({
      ...EMPTY_STATS,
      isLoaded: false,
    });
  });

  it('does not let an older GET overwrite a completed mutation', async () => {
    let resolveLoad!: (response: ReturnType<typeof jsonResponse>) => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<ReturnType<typeof jsonResponse>>((resolve) => {
            resolveLoad = resolve;
          }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          ...EMPTY_STATS,
          gamesWon: 1,
          guessDistribution: { 2: 1 },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const load = useStatsStore.getState().loadStats();
    await useStatsStore.getState().addWin(2, 'CRANE');
    resolveLoad(jsonResponse(EMPTY_STATS));
    await load;

    expect(useStatsStore.getState()).toMatchObject({
      gamesWon: 1,
      guessDistribution: { 2: 1 },
      isLoaded: true,
    });
  });

  it('normalizes malformed API values instead of trusting a record cast', () => {
    useStatsStore.getState().setFromApiResponse({
      gamesWon: Number.NaN,
      gamesLost: -2,
      guessDistribution: {
        0: 99,
        1: '4',
        2: 3,
        7: 50,
      },
      recentGames: [
        { id: 1, word: 'CRANE', won: true, guesses: 2 },
        { id: 2, word: 'bad', won: false, guesses: 99 },
      ],
    });

    expect(useStatsStore.getState()).toMatchObject({
      gamesWon: 0,
      gamesLost: 0,
      guessDistribution: { 1: 0, 2: 3 },
      recentGames: [{ id: 1, word: 'CRANE', won: true, guesses: 2 }],
      isLoaded: true,
    });
  });
});

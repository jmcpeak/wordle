import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/api/stats/route';
import { auth } from '@/auth';
import { MAX_GUESSES, STATS_ACTIONS } from '@/constants';
import {
  addLoss,
  addWin,
  ensureUserExists,
  getStats,
  resetStats,
} from '@/db/stats';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db/stats', () => ({
  addLoss: vi.fn(),
  addWin: vi.fn(),
  ensureUserExists: vi.fn(),
  getStats: vi.fn(),
  resetStats: vi.fn(),
}));

const authMock = vi.mocked(auth);
const addLossMock = vi.mocked(addLoss);
const addWinMock = vi.mocked(addWin);
const ensureUserExistsMock = vi.mocked(ensureUserExists);
const getStatsMock = vi.mocked(getStats);
const resetStatsMock = vi.mocked(resetStats);

describe('/api/stats route', () => {
  beforeEach(() => {
    authMock.mockResolvedValue({
      user: { id: 'user-1', name: 'Test User', email: 'test@example.com' },
      expires: '2099-01-01T00:00:00.000Z',
    });
    getStatsMock.mockResolvedValue({
      gamesWon: 4,
      gamesLost: 1,
      guessDistribution: { 3: 2, 4: 2 },
      recentGames: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 JSON when unauthenticated', async () => {
    authMock.mockResolvedValue(null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns the current stats for authenticated users', async () => {
    const response = await GET();

    expect(response.status).toBe(200);
    expect(getStatsMock).toHaveBeenCalledWith('user-1');
    await expect(response.json()).resolves.toEqual({
      gamesWon: 4,
      gamesLost: 1,
      guessDistribution: { 3: 2, 4: 2 },
      recentGames: [],
    });
  });

  it('rejects malformed JSON bodies', async () => {
    const request = new Request('http://localhost/api/stats', {
      method: 'POST',
      body: '{invalid',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid JSON body',
    });
    expect(addWinMock).not.toHaveBeenCalled();
    expect(addLossMock).not.toHaveBeenCalled();
    expect(resetStatsMock).not.toHaveBeenCalled();
  });

  it('rejects invalid actions', async () => {
    const request = new Request('http://localhost/api/stats', {
      method: 'POST',
      body: JSON.stringify({ action: 'cheatMode' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid stats action',
    });
    expect(addWinMock).not.toHaveBeenCalled();
  });

  it('rejects invalid win guess counts', async () => {
    const request = new Request('http://localhost/api/stats', {
      method: 'POST',
      body: JSON.stringify({
        action: STATS_ACTIONS.ADD_WIN,
        guesses: MAX_GUESSES + 1,
        word: 'CRANE',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid win guess count',
    });
    expect(addWinMock).not.toHaveBeenCalled();
  });

  it('rejects wins with an invalid word', async () => {
    const request = new Request('http://localhost/api/stats', {
      method: 'POST',
      body: JSON.stringify({
        action: STATS_ACTIONS.ADD_WIN,
        guesses: 3,
        word: 'NO',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid word' });
    expect(addWinMock).not.toHaveBeenCalled();
  });

  it('rejects losses with an invalid word', async () => {
    const request = new Request('http://localhost/api/stats', {
      method: 'POST',
      body: JSON.stringify({ action: STATS_ACTIONS.ADD_LOSS }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Invalid word' });
    expect(addLossMock).not.toHaveBeenCalled();
  });

  it('records valid wins and returns refreshed stats', async () => {
    const request = new Request('http://localhost/api/stats', {
      method: 'POST',
      body: JSON.stringify({
        action: STATS_ACTIONS.ADD_WIN,
        guesses: 3,
        word: 'CRANE',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(ensureUserExistsMock).toHaveBeenCalledWith(
      'user-1',
      'Test User',
      'test@example.com',
    );
    expect(addWinMock).toHaveBeenCalledWith('user-1', 3, 'CRANE');
    expect(getStatsMock).toHaveBeenCalledWith('user-1');
    await expect(response.json()).resolves.toEqual({
      gamesWon: 4,
      gamesLost: 1,
      guessDistribution: { 3: 2, 4: 2 },
      recentGames: [],
    });
  });

  it('records valid losses and returns refreshed stats', async () => {
    const request = new Request('http://localhost/api/stats', {
      method: 'POST',
      body: JSON.stringify({
        action: STATS_ACTIONS.ADD_LOSS,
        word: 'SLATE',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(addLossMock).toHaveBeenCalledWith('user-1', 'SLATE');
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, GET, POST } from '@/api/partial-game/route';
import { auth } from '@/auth';
import {
  deletePartialGame,
  ensureUserExists,
  getPartialGame,
  savePartialGame,
} from '@/db/stats';
import { mockAuthSession } from '@/testUtils/mockAuthSession';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db/stats', () => ({
  deletePartialGame: vi.fn(),
  ensureUserExists: vi.fn(),
  getPartialGame: vi.fn(),
  savePartialGame: vi.fn(),
}));

const authMock = vi.mocked(auth);
const getPartialGameMock = vi.mocked(getPartialGame);
const savePartialGameMock = vi.mocked(savePartialGame);
const deletePartialGameMock = vi.mocked(deletePartialGame);
const ensureUserExistsMock = vi.mocked(ensureUserExists);

describe('/api/partial-game route', () => {
  beforeEach(() => {
    mockAuthSession(authMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- GET ---

  it('GET returns 401 when unauthenticated', async () => {
    mockAuthSession(authMock, null);
    const response = await GET();
    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('GET returns null game when no partial game exists', async () => {
    getPartialGameMock.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(getPartialGameMock).toHaveBeenCalledWith('user-1');
    await expect(response.json()).resolves.toEqual({ game: null });
  });

  it('GET returns the saved partial game', async () => {
    getPartialGameMock.mockResolvedValue({
      solution: 'CRANE',
      guesses: ['SLATE', 'BRAIN'],
    });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      game: { solution: 'CRANE', guesses: ['SLATE', 'BRAIN'] },
    });
  });

  it('GET returns 500 when DB throws', async () => {
    getPartialGameMock.mockRejectedValue(new Error('DB down'));
    const response = await GET();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to load partial game',
    });
  });

  // --- POST ---

  it('POST returns 401 when unauthenticated', async () => {
    mockAuthSession(authMock, null);
    const request = new Request('http://localhost/api/partial-game', {
      method: 'POST',
      body: JSON.stringify({ solution: 'CRANE', guesses: ['SLATE'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it('POST rejects malformed JSON', async () => {
    const request = new Request('http://localhost/api/partial-game', {
      method: 'POST',
      body: '{invalid',
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid JSON body',
    });
  });

  it('POST rejects invalid solution (too short)', async () => {
    const request = new Request('http://localhost/api/partial-game', {
      method: 'POST',
      body: JSON.stringify({ solution: 'HI', guesses: ['SLATE'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid solution',
    });
  });

  it('POST rejects invalid solution (lowercase)', async () => {
    const request = new Request('http://localhost/api/partial-game', {
      method: 'POST',
      body: JSON.stringify({ solution: 'crane', guesses: ['SLATE'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid solution',
    });
  });

  it('POST rejects empty guesses array', async () => {
    const request = new Request('http://localhost/api/partial-game', {
      method: 'POST',
      body: JSON.stringify({ solution: 'CRANE', guesses: [] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid guesses',
    });
  });

  it('POST rejects guesses with invalid word length', async () => {
    const request = new Request('http://localhost/api/partial-game', {
      method: 'POST',
      body: JSON.stringify({ solution: 'CRANE', guesses: ['HI'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid guesses',
    });
  });

  it('POST saves a valid partial game', async () => {
    const request = new Request('http://localhost/api/partial-game', {
      method: 'POST',
      body: JSON.stringify({ solution: 'CRANE', guesses: ['SLATE', 'BRAIN'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(ensureUserExistsMock).toHaveBeenCalledWith(
      'user-1',
      'Test User',
      'test@example.com',
    );
    expect(savePartialGameMock).toHaveBeenCalledWith('user-1', 'CRANE', [
      'SLATE',
      'BRAIN',
    ]);
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('POST returns 500 when DB throws', async () => {
    savePartialGameMock.mockRejectedValue(new Error('DB down'));
    const request = new Request('http://localhost/api/partial-game', {
      method: 'POST',
      body: JSON.stringify({ solution: 'CRANE', guesses: ['SLATE'] }),
      headers: { 'Content-Type': 'application/json' },
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to save partial game',
    });
  });

  // --- DELETE ---

  it('DELETE returns 401 when unauthenticated', async () => {
    mockAuthSession(authMock, null);
    const response = await DELETE();
    expect(response.status).toBe(401);
  });

  it('DELETE removes the partial game', async () => {
    const response = await DELETE();
    expect(response.status).toBe(200);
    expect(deletePartialGameMock).toHaveBeenCalledWith('user-1');
    await expect(response.json()).resolves.toEqual({ success: true });
  });

  it('DELETE returns 500 when DB throws', async () => {
    deletePartialGameMock.mockRejectedValue(new Error('DB down'));
    const response = await DELETE();
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: 'Failed to delete partial game',
    });
  });
});

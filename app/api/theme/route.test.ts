import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/api/theme/route';
import { auth } from '@/auth';
import { THEME_MODES } from '@/constants';
import { ensureUserExists, getTheme, setTheme } from '@/db/stats';
import { mockAuthSession } from '@/testUtils/mockAuthSession';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/db/stats', () => ({
  ensureUserExists: vi.fn(),
  getTheme: vi.fn(),
  setTheme: vi.fn(),
}));

const authMock = vi.mocked(auth);
const ensureUserExistsMock = vi.mocked(ensureUserExists);
const getThemeMock = vi.mocked(getTheme);
const setThemeMock = vi.mocked(setTheme);

describe('/api/theme route', () => {
  beforeEach(() => {
    mockAuthSession(authMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 JSON when unauthenticated', async () => {
    mockAuthSession(authMock, null);

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
  });

  it('returns the current theme for authenticated users', async () => {
    getThemeMock.mockResolvedValue(THEME_MODES.DARK);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(getThemeMock).toHaveBeenCalledWith('user-1');
    await expect(response.json()).resolves.toEqual({ theme: THEME_MODES.DARK });
  });

  it('rejects malformed JSON bodies', async () => {
    const request = new Request('http://localhost/api/theme', {
      method: 'POST',
      body: '{invalid',
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid JSON body',
    });
    expect(setThemeMock).not.toHaveBeenCalled();
  });

  it('rejects invalid theme values', async () => {
    const request = new Request('http://localhost/api/theme', {
      method: 'POST',
      body: JSON.stringify({ theme: 'sepia' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'Invalid theme value',
    });
    expect(setThemeMock).not.toHaveBeenCalled();
  });

  it('persists valid theme values', async () => {
    const request = new Request('http://localhost/api/theme', {
      method: 'POST',
      body: JSON.stringify({ theme: THEME_MODES.LIGHT }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(ensureUserExistsMock).toHaveBeenCalledWith(
      'user-1',
      'Test User',
      'test@example.com',
    );
    expect(setThemeMock).toHaveBeenCalledWith('user-1', THEME_MODES.LIGHT);
    await expect(response.json()).resolves.toEqual({
      theme: THEME_MODES.LIGHT,
    });
  });
});

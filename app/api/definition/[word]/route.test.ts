import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/api/definition/[word]/route';

const fetchMock = vi.fn();

function makeRequest() {
  return new Request('http://localhost/api/definition/mocha');
}

function makeUpstreamResponse(
  body: unknown,
  init?: { status?: number; ok?: boolean },
): Response {
  const status = init?.status ?? 200;
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('/api/definition/[word] route', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('returns 400 for an invalid word', async () => {
    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: 'has spaces' }),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalidWord' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns 400 for an empty word', async () => {
    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: '' }),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalidWord' });
  });

  it('returns 200 with normalized entries from the upstream API', async () => {
    const upstreamPayload = [
      {
        word: 'mocha',
        phonetic: '/ˈmɒkə/',
        meanings: [
          {
            partOfSpeech: 'noun',
            definitions: [{ definition: 'A coffee drink with chocolate.' }],
          },
        ],
      },
    ];
    fetchMock.mockResolvedValueOnce(makeUpstreamResponse(upstreamPayload));

    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: 'Mocha' }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      entries: upstreamPayload,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.dictionaryapi.dev/api/v2/entries/en/mocha',
      expect.objectContaining({
        headers: { Accept: 'application/json' },
        next: { revalidate: 86_400 },
      }),
    );
  });

  it('forwards 404 from upstream as notFound', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{}', {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: 'qwxyz' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'notFound' });
  });

  it('returns 404 notFound when upstream returns an empty array', async () => {
    fetchMock.mockResolvedValueOnce(makeUpstreamResponse([]));

    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: 'mocha' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'notFound' });
  });

  it('returns 502 upstream for non-OK upstream responses', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response('{}', {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: 'mocha' }),
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'upstream' });
  });

  it('returns 502 upstream when fetch throws', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: 'mocha' }),
    });

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({ error: 'upstream' });
  });
});

import { describe, expect, it } from 'vitest';
import { GET } from '@/api/definition/[word]/route';

function makeRequest() {
  return new Request('http://localhost/api/definition/mocha');
}

describe('/api/definition/[word] route', () => {
  it('returns 400 for an invalid word', async () => {
    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: 'has spaces' }),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalidWord' });
  });

  it('returns 400 for an empty word', async () => {
    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: '' }),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalidWord' });
  });

  it('returns 200 with local dictionary entries and cache headers', async () => {
    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: 'Mocha' }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=86400, stale-while-revalidate=604800',
    );
    const body = (await response.json()) as {
      entries: Array<{
        word: string;
        meanings: Array<{ definitions: Array<{ definition: string }> }>;
      }>;
    };
    expect(body.entries.length).toBeGreaterThan(0);
    expect(body.entries[0]?.word).toBe('mocha');
    expect(
      body.entries[0]?.meanings?.[0]?.definitions?.[0]?.definition,
    ).toBeTruthy();
  });

  it('returns 404 notFound for unknown words', async () => {
    const response = await GET(makeRequest() as never, {
      params: Promise.resolve({ word: 'qwxyz' }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: 'notFound' });
  });
});

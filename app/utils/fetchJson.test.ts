import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchJson } from '@/utils/fetchJson';

describe('fetchJson', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('aborts a request that exceeds its deadline', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener(
              'abort',
              () => reject(init.signal?.reason),
              { once: true },
            );
          }),
      ),
    );

    const request = fetchJson('/slow', undefined, { timeoutMs: 25 });
    const rejection = expect(request).rejects.toMatchObject({
      name: 'TimeoutError',
    });
    await vi.advanceTimersByTimeAsync(25);

    await rejection;
  });

  it('forwards an existing abort signal', async () => {
    const source = new AbortController();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener(
              'abort',
              () => reject(init.signal?.reason),
              { once: true },
            );
          }),
      ),
    );

    const request = fetchJson('/cancelled', { signal: source.signal });
    source.abort(new DOMException('Cancelled', 'AbortError'));

    await expect(request).rejects.toMatchObject({ name: 'AbortError' });
  });
});

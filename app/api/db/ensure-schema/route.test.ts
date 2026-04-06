import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET, POST } from '@/api/db/ensure-schema/route';
import { ensureSchema } from '@/db/schema';

vi.mock('@/db/schema', () => ({
  ensureSchema: vi.fn(),
}));

const ensureSchemaMock = vi.mocked(ensureSchema);

describe('/api/db/ensure-schema route', () => {
  const originalSecret = process.env.DB_INIT_SECRET;

  beforeEach(() => {
    process.env.DB_INIT_SECRET = 'top-secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
    if (originalSecret === undefined) {
      delete process.env.DB_INIT_SECRET;
    } else {
      process.env.DB_INIT_SECRET = originalSecret;
    }
  });

  it('rejects GET requests', async () => {
    const response = await GET();

    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toEqual({
      error: 'Method not allowed. Use POST.',
    });
  });

  it('does not accept the secret from the query string', async () => {
    const request = new Request(
      'http://localhost/api/db/ensure-schema?secret=top-secret',
      {
        method: 'POST',
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Unauthorized' });
    expect(ensureSchemaMock).not.toHaveBeenCalled();
  });

  it('accepts the secret from the Authorization header', async () => {
    const request = new Request('http://localhost/api/db/ensure-schema', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer top-secret',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(ensureSchemaMock).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('accepts the secret from the JSON body', async () => {
    const request = new Request('http://localhost/api/db/ensure-schema', {
      method: 'POST',
      body: JSON.stringify({ secret: 'top-secret' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(ensureSchemaMock).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });
});

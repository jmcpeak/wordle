import { afterEach, describe, expect, it, vi } from 'vitest';
import { THEME_MODES } from '@/constants';
import { useThemeStore } from '@/store/themeStore';

function successResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
  };
}

describe('themeStore persistence ordering', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('serializes rapid selections and keeps the latest mode', async () => {
    let resolveFirst!: (response: ReturnType<typeof successResponse>) => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<ReturnType<typeof successResponse>>((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValueOnce(successResponse());
    vi.stubGlobal('fetch', fetchMock);
    useThemeStore.getState().initializeMode(THEME_MODES.SYSTEM);

    const first = useThemeStore.getState().setMode(THEME_MODES.DARK);
    const second = useThemeStore.getState().setMode(THEME_MODES.LIGHT);

    expect(useThemeStore.getState().mode).toBe(THEME_MODES.LIGHT);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    resolveFirst(successResponse());
    await Promise.all([first, second]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      fetchMock.mock.calls.map(([, init]) => JSON.parse(init?.body as string)),
    ).toEqual([{ theme: THEME_MODES.DARK }, { theme: THEME_MODES.LIGHT }]);
    expect(useThemeStore.getState().mode).toBe(THEME_MODES.LIGHT);
  });

  it('does not let an older failed request roll back a newer selection', async () => {
    let rejectFirst!: (error: Error) => void;
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            rejectFirst = reject;
          }),
      )
      .mockResolvedValueOnce(successResponse());
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    useThemeStore.getState().initializeMode(THEME_MODES.SYSTEM);

    const first = useThemeStore.getState().setMode(THEME_MODES.DARK);
    const second = useThemeStore.getState().setMode(THEME_MODES.LIGHT);
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    rejectFirst(new Error('offline'));
    await Promise.all([first, second]);

    expect(useThemeStore.getState().mode).toBe(THEME_MODES.LIGHT);
  });
});

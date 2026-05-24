type FetchCall = [string, RequestInit?];

function fetchCallUrl(call: unknown[]): string | undefined {
  const url = call[0];
  return typeof url === 'string' ? url : undefined;
}

export function partialGameFetchCalls(
  calls: unknown[][],
  options?: { method?: string },
): FetchCall[] {
  return calls.filter((call): call is FetchCall => {
    const url = fetchCallUrl(call);
    if (!url?.includes('/api/partial-game')) {
      return false;
    }
    if (options?.method === undefined) {
      return true;
    }
    const init = call[1];
    return (
      init != null &&
      typeof init === 'object' &&
      'method' in init &&
      init.method === options.method
    );
  });
}

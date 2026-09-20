const DEFAULT_TIMEOUT_MS = 15_000;

type FetchJsonOptions = {
  parseJsonWhenNotOk?: boolean;
  timeoutMs?: number;
};

/**
 * Fetches a URL and parses JSON when appropriate.
 * By default, the body is parsed only when `response.ok` (non-JSON error bodies are skipped).
 * Set `parseJsonWhenNotOk` when the API returns JSON for error statuses (e.g. 400 with a body).
 */
export async function fetchJson(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: FetchJsonOptions,
): Promise<{ response: Response; data: unknown }> {
  const controller = new AbortController();
  const sourceSignal = init?.signal;
  const abortFromSource = () => controller.abort(sourceSignal?.reason);
  if (sourceSignal?.aborted) abortFromSource();
  else sourceSignal?.addEventListener('abort', abortFromSource, { once: true });

  const timeoutId = setTimeout(
    () =>
      controller.abort(new DOMException('Request timed out', 'TimeoutError')),
    options?.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  let response: Response;
  try {
    response = await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
    sourceSignal?.removeEventListener('abort', abortFromSource);
  }
  const shouldParse = response.ok || options?.parseJsonWhenNotOk === true;
  if (!shouldParse) {
    return { response, data: undefined };
  }
  try {
    const data = await response.json();
    return { response, data };
  } catch {
    throw new Error('Invalid JSON');
  }
}

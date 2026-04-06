/**
 * Fetches a URL and parses JSON when appropriate.
 * By default, the body is parsed only when `response.ok` (non-JSON error bodies are skipped).
 * Set `parseJsonWhenNotOk` when the API returns JSON for error statuses (e.g. 400 with a body).
 */
export async function fetchJson(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { parseJsonWhenNotOk?: boolean },
): Promise<{ response: Response; data: unknown }> {
  const response = await fetch(input, init);
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

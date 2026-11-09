// fetch() with a time limit and friendly errors.
export class LookupError extends Error {}

export async function getJson<T>(url: string, timeoutMs = 12000): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new LookupError("You're offline. Connect to the internet to look up books.");
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new LookupError(`The book service answered with an error (${res.status}).`);
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof LookupError) throw e;
    throw new LookupError('Could not reach the book service. Please try again.');
  } finally {
    clearTimeout(timer);
  }
}

/** Pull a 4-digit year out of text like "March 3, 1999". */
export function parseYear(text?: string): number | undefined {
  const m = text?.match(/\b(1[5-9]\d\d|20\d\d)\b/);
  return m ? Number(m[1]) : undefined;
}

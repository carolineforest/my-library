// ISBN helpers: clean up, validate, and convert between ISBN-10 and ISBN-13.

/** Remove spaces/dashes; returns digits (and a trailing X for ISBN-10). */
export function cleanIsbn(raw: string | undefined | null): string {
  return (raw ?? '').toUpperCase().replace(/[^0-9X]/g, '');
}

export function isValidIsbn13(isbn: string): boolean {
  if (!/^\d{13}$/.test(isbn)) return false;
  const sum = [...isbn].reduce((s, ch, i) => s + Number(ch) * (i % 2 ? 3 : 1), 0);
  return sum % 10 === 0;
}

export function isValidIsbn10(isbn: string): boolean {
  if (!/^\d{9}[\dX]$/.test(isbn)) return false;
  const sum = [...isbn].reduce((s, ch, i) => s + (ch === 'X' ? 10 : Number(ch)) * (10 - i), 0);
  return sum % 11 === 0;
}

export function isbn10to13(isbn10: string): string | undefined {
  if (!isValidIsbn10(isbn10)) return undefined;
  const core = '978' + isbn10.slice(0, 9);
  const sum = [...core].reduce((s, ch, i) => s + Number(ch) * (i % 2 ? 3 : 1), 0);
  return core + ((10 - (sum % 10)) % 10);
}

export function isbn13to10(isbn13: string): string | undefined {
  if (!isValidIsbn13(isbn13) || !isbn13.startsWith('978')) return undefined;
  const core = isbn13.slice(3, 12);
  const sum = [...core].reduce((s, ch, i) => s + Number(ch) * (10 - i), 0);
  const check = (11 - (sum % 11)) % 11;
  return core + (check === 10 ? 'X' : String(check));
}

/** Given any ISBN-ish text, return both forms where possible. */
export function normalizeIsbn(raw: string | undefined | null): { isbn13?: string; isbn10?: string } {
  const c = cleanIsbn(raw);
  if (isValidIsbn13(c)) return { isbn13: c, isbn10: isbn13to10(c) };
  if (isValidIsbn10(c)) return { isbn10: c, isbn13: isbn10to13(c) };
  return {};
}

/** True if the text looks like an ISBN someone typed or scanned. */
export function looksLikeIsbn(raw: string): boolean {
  return Boolean(normalizeIsbn(raw).isbn13 || normalizeIsbn(raw).isbn10);
}

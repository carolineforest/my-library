// Decides whether a book "seems to be" one I already have.
// Match rule: same ISBN, or same title + same author (ignoring case/punctuation).
import type { Book } from './models';
import { authorKey, titleKey } from '../utils/text';
import { normalizeIsbn } from '../utils/isbn';

export interface BookIdentity {
  title: string;
  authors?: string[];
  isbn13?: string;
  isbn10?: string;
}

export function isSameBook(a: BookIdentity, b: BookIdentity): boolean {
  const ia = normalizeIsbn(a.isbn13 || a.isbn10);
  const ib = normalizeIsbn(b.isbn13 || b.isbn10);
  if (ia.isbn13 && ib.isbn13 && ia.isbn13 === ib.isbn13) return true;
  const ta = titleKey(a.title);
  if (!ta || ta !== titleKey(b.title)) return false;
  const aa = authorKey(a.authors);
  const ab = authorKey(b.authors);
  // If either has no author, a matching title alone is enough to warn.
  return !aa || !ab || aa === ab;
}

export function findMatches(candidate: BookIdentity, books: Book[]): Book[] {
  return books.filter((b) => isSameBook(candidate, b));
}

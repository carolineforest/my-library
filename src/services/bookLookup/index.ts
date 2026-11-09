// One place for "find a book online". Tries Open Library first, then Google Books.
// Screens should import from here, not from the individual services.
import type { Book } from '../../data/models';
import type { FoundBook } from './types';
import { LookupError } from './http';
import {
  listOpenLibraryEditions,
  lookupOpenLibraryIsbn,
  olCoverByIsbn,
  searchOpenLibrary,
  searchOpenLibraryByTitleAuthor,
} from './openLibrary';
import { lookupGoogleIsbn, searchGoogleBooks } from './googleBooks';
import { normalizeIsbn } from '../../utils/isbn';
import { authorKey, titleKey } from '../../utils/text';

export type { FoundBook } from './types';
export { LookupError } from './http';

/** Find one exact book by ISBN (used by the barcode scanner). */
export async function lookupIsbn(raw: string): Promise<FoundBook | undefined> {
  const { isbn13, isbn10 } = normalizeIsbn(raw);
  const isbn = isbn13 ?? isbn10;
  if (!isbn) return undefined;
  const [ol, gb] = await Promise.all([lookupOpenLibraryIsbn(isbn), lookupGoogleIsbn(isbn)]);
  if (!ol && !gb) return undefined;
  // Combine: Open Library first, fill any gaps from Google.
  const merged = mergeFound(ol, gb);
  merged.isbn13 ??= isbn13;
  merged.isbn10 ??= isbn10;
  return merged;
}

export function mergeFound(primary?: FoundBook, backup?: FoundBook): FoundBook {
  if (!primary) return backup!;
  if (!backup) return primary;
  const out: FoundBook = { ...primary };
  for (const [k, v] of Object.entries(backup) as [keyof FoundBook, unknown][]) {
    const cur = out[k];
    const empty = cur === undefined || cur === '' || (Array.isArray(cur) && cur.length === 0);
    // Open Library's "cover by ISBN" guess is weaker than a real Google cover.
    const weakCover = k === 'coverUrl' && typeof cur === 'string' && cur.includes('/b/isbn/');
    if ((empty || weakCover) && v !== undefined) (out as unknown as Record<string, unknown>)[k] = v;
  }
  return out;
}

/** Search by title, author, or ISBN text. */
export async function searchBooks(query: string): Promise<FoundBook[]> {
  const q = query.trim();
  if (!q) return [];
  const ids = normalizeIsbn(q);
  if (ids.isbn13 || ids.isbn10) {
    const one = await lookupIsbn(q);
    return one ? [one] : [];
  }
  try {
    const ol = await searchOpenLibrary(q);
    if (ol.length) return ol;
  } catch (e) {
    // fall through to Google
    if (!(e instanceof LookupError)) throw e;
  }
  return searchGoogleBooks(q);
}

type BookRef = Pick<Book, 'title' | 'authors' | 'isbn13' | 'isbn10' | 'openLibraryWorkKey'>;

/** Other covers for this book: other editions on Open Library + Google Books results. */
export async function findCoverOptions(book: BookRef): Promise<string[]> {
  const editions = await findEditions(book).catch(() => [] as FoundBook[]);
  const urls = editions.map((e) => e.coverUrl).filter((u): u is string => Boolean(u));
  if (book.isbn13) urls.unshift(olCoverByIsbn(book.isbn13));
  return [...new Set(urls)];
}

/** Other editions of this book (formats, publishers, years) from both catalogs. */
export async function findEditions(book: BookRef): Promise<FoundBook[]> {
  const author = book.authors[0];
  let workKey = book.openLibraryWorkKey;
  const tasks: Promise<FoundBook[]>[] = [];
  if (!workKey) {
    // Find the work by searching for the title and author.
    const hits = await searchOpenLibraryByTitleAuthor(book.title.split(':')[0], author, 5).catch(() => []);
    workKey = hits.find((h) => sameWork(h, book))?.openLibraryWorkKey;
  }
  if (workKey) tasks.push(listOpenLibraryEditions(workKey).catch(() => []));
  const gq = `intitle:${book.title.split(':')[0]}` + (author ? `+inauthor:${author.split(' ').pop()}` : '');
  tasks.push(searchGoogleBooks(gq, 20).catch(() => []));
  const results = (await Promise.all(tasks)).flat().filter((f) => sameWork(f, book));
  // Remove duplicates (same ISBN listed in both catalogs).
  const seen = new Set<string>();
  return results.filter((f) => {
    const k = f.isbn13 ?? f.key;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function sameWork(f: FoundBook, book: BookRef): boolean {
  if (titleKey(f.title) !== titleKey(book.title)) return false;
  const a = authorKey(book.authors);
  return !a || !f.authors.length || authorKey(f.authors) === a;
}

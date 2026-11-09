// Open Library (openlibrary.org): free, no key, allows requests from browsers.
// Main source for book details, covers and other editions.
import type { FoundBook } from './types';
import { getJson, parseYear } from './http';
import { toFormat } from './formats';
import { normalizeIsbn } from '../../utils/isbn';

const OL = 'https://openlibrary.org';

export const olCoverById = (id: number, size: 'M' | 'L' = 'L') => `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`;
export const olCoverByIsbn = (isbn: string) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg?default=false`;

interface SearchDoc {
  key: string;
  title: string;
  author_name?: string[];
  first_publish_year?: number;
  isbn?: string[];
  cover_i?: number;
  number_of_pages_median?: number;
  publisher?: string[];
  cover_edition_key?: string;
}

const SEARCH_FIELDS = 'key,title,author_name,first_publish_year,isbn,cover_i,number_of_pages_median,publisher,cover_edition_key';

export function docToFound(d: SearchDoc): FoundBook {
  const isbn13 = d.isbn?.find((i) => i.length === 13 && (i.startsWith('978') || i.startsWith('979')));
  const ids = normalizeIsbn(isbn13 ?? d.isbn?.[0]);
  return {
    key: 'ol:' + d.key,
    source: 'openlibrary',
    title: d.title,
    authors: d.author_name ?? [],
    ...ids,
    publisher: d.publisher?.[0],
    year: d.first_publish_year,
    pageCount: d.number_of_pages_median,
    coverUrl: d.cover_i ? olCoverById(d.cover_i) : undefined,
    openLibraryWorkKey: d.key,
    openLibraryEditionKey: d.cover_edition_key ? `/books/${d.cover_edition_key}` : undefined,
  };
}

export async function searchOpenLibrary(query: string, limit = 20): Promise<FoundBook[]> {
  const url = `${OL}/search.json?q=${encodeURIComponent(query)}&limit=${limit}&fields=${SEARCH_FIELDS}`;
  const data = await getJson<{ docs: SearchDoc[] }>(url);
  return data.docs.map(docToFound);
}

/** Search by title + author fields (more precise; used for covers/editions). */
export async function searchOpenLibraryByTitleAuthor(title: string, author?: string, limit = 10): Promise<FoundBook[]> {
  let url = `${OL}/search.json?title=${encodeURIComponent(title)}&limit=${limit}&fields=${SEARCH_FIELDS}`;
  if (author) url += `&author=${encodeURIComponent(author)}`;
  const data = await getJson<{ docs: SearchDoc[] }>(url);
  return data.docs.map(docToFound);
}

export interface OLEdition {
  key: string;
  title: string;
  subtitle?: string;
  authors?: { key: string }[];
  publishers?: string[];
  publish_date?: string;
  number_of_pages?: number;
  covers?: number[];
  works?: { key: string }[];
  physical_format?: string;
  isbn_13?: string[];
  isbn_10?: string[];
  description?: string | { value: string };
}

export function editionToFound(e: OLEdition, authors: string[] = []): FoundBook {
  const ids = normalizeIsbn(e.isbn_13?.[0] ?? e.isbn_10?.[0]);
  const cover = e.covers?.find((c) => c > 0);
  return {
    key: 'ol:' + e.key,
    source: 'openlibrary',
    title: e.subtitle ? `${e.title}: ${e.subtitle}` : e.title,
    authors,
    ...ids,
    publisher: e.publishers?.[0],
    year: parseYear(e.publish_date),
    pageCount: e.number_of_pages,
    description: textOf(e.description),
    coverUrl: cover ? olCoverById(cover) : undefined,
    format: toFormat(e.physical_format),
    openLibraryWorkKey: e.works?.[0]?.key,
    openLibraryEditionKey: e.key,
  };
}

function textOf(d: string | { value: string } | undefined) {
  return typeof d === 'string' ? d : d?.value;
}

/** Look up one exact edition by ISBN (what scanning uses). */
export async function lookupOpenLibraryIsbn(isbn: string): Promise<FoundBook | undefined> {
  let edition: OLEdition;
  try {
    edition = await getJson<OLEdition>(`${OL}/isbn/${isbn}.json`);
  } catch {
    return undefined; // not found (404) or unreachable: let the fallback try
  }
  const workKey = edition.works?.[0]?.key;
  const [authorNames, work] = await Promise.all([
    Promise.all(
      (edition.authors ?? []).map((a) =>
        getJson<{ name?: string }>(`${OL}${a.key}.json`).then((x) => x.name ?? '').catch(() => ''),
      ),
    ),
    workKey
      ? getJson<{ description?: string | { value: string }; authors?: { author: { key: string } }[]; covers?: number[] }>(
          `${OL}${workKey}.json`,
        ).catch(() => undefined)
      : undefined,
  ]);
  let names = authorNames.filter(Boolean);
  // Some editions only list authors on the "work"; fetch those if needed.
  if (!names.length && work?.authors?.length) {
    names = (
      await Promise.all(
        work.authors.map((a) => getJson<{ name?: string }>(`${OL}${a.author.key}.json`).then((x) => x.name ?? '').catch(() => '')),
      )
    ).filter(Boolean);
  }
  const found = editionToFound(edition, names);
  found.description ??= textOf(work?.description);
  if (!found.coverUrl) {
    const workCover = work?.covers?.find((c) => c > 0);
    found.coverUrl = workCover ? olCoverById(workCover) : olCoverByIsbn(isbn);
  }
  return found;
}

/** All editions of a work (different formats, publishers, years). */
export async function listOpenLibraryEditions(workKey: string, limit = 100): Promise<FoundBook[]> {
  const data = await getJson<{ entries: OLEdition[] }>(`${OL}${workKey}/editions.json?limit=${limit}`);
  return data.entries.map((e) => editionToFound(e));
}

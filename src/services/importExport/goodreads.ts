// Understands the Goodreads "Export Library" CSV file and turns its rows into books.
import type { BookList, NewBook, ReadingStatus } from '../../data/models';
import { parseCsvObjects } from './csv';
import { normalizeIsbn } from '../../utils/isbn';
import { toFormat } from '../bookLookup/formats';
import { olCoverByIsbn } from '../bookLookup/openLibrary';
import { newRead } from '../../data/reading';

export interface GoodreadsRow {
  rowId: string;
  title: string;
  authors: string[];
  isbn13?: string;
  isbn10?: string;
  rating?: number;
  publisher?: string;
  binding?: string;
  pages?: number;
  year?: number;
  dateRead?: string; // YYYY-MM-DD
  dateAdded?: string; // YYYY-MM-DD
  /** Goodreads' main shelf: read, currently-reading, to-read (or a custom exclusive shelf). */
  exclusiveShelf: string;
  /** Other shelves, which can become tags. */
  shelves: string[];
  review?: string;
  privateNotes?: string;
}

export interface ImportOptions {
  status: boolean;
  rating: boolean;
  dateRead: boolean;
  notes: boolean;
  shelvesAsTags: boolean;
  /** Where "to-read" books go. */
  toReadDestination: 'toBuy' | 'owned';
}

export const DEFAULT_IMPORT_OPTIONS: ImportOptions = {
  status: true,
  rating: true,
  dateRead: true,
  notes: true,
  shelvesAsTags: true,
  toReadDestination: 'toBuy',
};

const BUILT_IN_SHELVES = new Set(['read', 'currently-reading', 'to-read']);

export class NotGoodreadsFileError extends Error {}

/** Goodreads writes ISBNs like ="0441013597" so spreadsheets keep the zeros. */
function cleanCell(v: string | undefined): string {
  return (v ?? '').replace(/^="?/, '').replace(/"$/, '').trim();
}

/** "2021/03/14" -> "2021-03-14" */
function grDate(v: string | undefined): string | undefined {
  const m = cleanCell(v).match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : undefined;
}

const num = (v: string | undefined) => {
  const n = Number(cleanCell(v));
  return cleanCell(v) && !isNaN(n) && n > 0 ? n : undefined;
};

export function parseGoodreadsCsv(text: string): GoodreadsRow[] {
  const objs = parseCsvObjects(text);
  if (!objs.length || !('Title' in objs[0]) || !('Exclusive Shelf' in objs[0])) {
    throw new NotGoodreadsFileError(
      "This doesn't look like a Goodreads export. In Goodreads, go to My Books → Import and Export → Export Library, then pick that file.",
    );
  }
  return objs
    .filter((o) => cleanCell(o['Title']))
    .map((o, i) => {
      const ids = normalizeIsbn(cleanCell(o['ISBN13']) || cleanCell(o['ISBN']));
      const additional = cleanCell(o['Additional Authors'])
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const shelves = cleanCell(o['Bookshelves'])
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && !BUILT_IN_SHELVES.has(s));
      const rating = num(o['My Rating']);
      return {
        rowId: cleanCell(o['Book Id']) || String(i),
        title: cleanCell(o['Title']),
        authors: [cleanCell(o['Author']), ...additional].filter(Boolean),
        ...ids,
        rating: rating && rating <= 5 ? rating : undefined,
        publisher: cleanCell(o['Publisher']) || undefined,
        binding: cleanCell(o['Binding']) || undefined,
        pages: num(o['Number of Pages']),
        year: num(o['Original Publication Year']) ?? num(o['Year Published']),
        dateRead: grDate(o['Date Read']),
        dateAdded: grDate(o['Date Added']),
        exclusiveShelf: cleanCell(o['Exclusive Shelf']) || 'read',
        shelves,
        review: cleanCell(o['My Review']).replace(/<br\s*\/?>/gi, '\n') || undefined,
        privateNotes: cleanCell(o['Private Notes']) || undefined,
      };
    });
}

/** Which list a row will land on with these options. */
export function destinationOf(row: GoodreadsRow, opts: ImportOptions): BookList {
  return row.exclusiveShelf === 'to-read' && opts.toReadDestination === 'toBuy' ? 'toBuy' : 'owned';
}

function statusOf(shelf: string): ReadingStatus {
  if (shelf === 'read') return 'read';
  if (shelf === 'currently-reading') return 'reading';
  if (shelf === 'to-read') return 'want';
  return 'none';
}

export function goodreadsRowToBook(row: GoodreadsRow, opts: ImportOptions): NewBook {
  const list = destinationOf(row, opts);
  const owned = list === 'owned';
  const notes = [row.review, row.privateNotes].filter(Boolean).join('\n\n');
  const coverUrl = row.isbn13 ? olCoverByIsbn(row.isbn13) : undefined;
  return {
    list,
    title: row.title,
    authors: row.authors,
    isbn13: row.isbn13,
    isbn10: row.isbn10,
    publisher: row.publisher,
    year: row.year,
    pageCount: row.pages,
    format: owned ? (toFormat(row.binding) ?? 'Paperback') : 'Paperback',
    coverUrl,
    originalCoverUrl: coverUrl,
    status: owned && opts.status ? statusOf(row.exclusiveShelf) : 'none',
    rating: opts.rating ? row.rating : undefined,
    reads: opts.dateRead && row.dateRead ? [newRead({ finished: row.dateRead })] : [],
    notes: opts.notes && notes ? notes : undefined,
    tags: opts.shelvesAsTags ? row.shelves.map(prettyShelf) : [],
  };
}

/** "science-fiction" -> "Science Fiction" */
export function prettyShelf(s: string): string {
  return s
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

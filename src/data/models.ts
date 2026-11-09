// The shapes of everything the app saves. If you add a field here that must be
// stored or searched, also check db.ts (indexes) and backup.ts (export/import).

/** Which list a book lives on. */
export type BookList = 'owned' | 'toBuy';

export type ReadingStatus = 'none' | 'want' | 'reading' | 'read';

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  none: 'No status',
  want: 'Want to Read',
  reading: 'Currently Reading',
  read: 'Read',
};

export const FORMATS = [
  'Paperback',
  'Hardcover',
  'Mass Market Paperback',
  'Trade Paperback',
  'Ebook',
  'Audiobook',
  'Other',
] as const;
export type BookFormat = (typeof FORMATS)[number];

/** One reading of a book. A book read twice has two of these. Dates are "YYYY-MM-DD". */
export interface ReadEntry {
  id: string;
  started?: string;
  finished?: string;
}

export interface Book {
  id: string;
  list: BookList;
  title: string;
  authors: string[];
  isbn13?: string;
  isbn10?: string;
  publisher?: string;
  year?: number;
  pageCount?: number;
  format: BookFormat;
  description?: string;

  /** The cover shown now (a web address), unless customCoverId is set. */
  coverUrl?: string;
  /** The cover the book had when first added, so "Reset Cover" can go back. */
  originalCoverUrl?: string;
  /** A photo I uploaded myself (stored in the `covers` table). Wins over coverUrl. */
  customCoverId?: string;

  /** Where the book physically sits, e.g. "Living room, top shelf". */
  location?: string;
  /** Shelves / tags, e.g. ["Fiction", "Signed"]. */
  tags: string[];

  status: ReadingStatus;
  /** 1-5 stars, or undefined for no rating. */
  rating?: number;
  notes?: string;
  reads: ReadEntry[];

  /** Ids from the online catalogs, used to look up other editions and covers. */
  openLibraryWorkKey?: string;
  openLibraryEditionKey?: string;
  googleVolumeId?: string;

  /** ISO timestamps. */
  dateAdded: string;
  updatedAt: string;
}

/** One time I lent a book to someone. Open loans have no returnedDate. */
export interface Loan {
  id: string;
  bookId: string;
  /** Name as I typed it. */
  person: string;
  /** Lower-cased, trimmed name, so "Anna" and "anna " count as one person. */
  personKey: string;
  lentDate: string; // YYYY-MM-DD
  returnedDate?: string; // YYYY-MM-DD
}

/** A cover photo I uploaded (books with no online cover). */
export interface CoverImage {
  id: string;
  blob: Blob;
}

/** A shelf/tag I created. Tags used on books also appear even if not saved here. */
export interface Tag {
  name: string;
}

/** Small app settings stored as key/value pairs. */
export interface Setting {
  key: string;
  value: unknown;
}

/** Fields the user fills in when adding a book; the rest get defaults. */
export type NewBook = Partial<Omit<Book, 'id' | 'dateAdded' | 'updatedAt'>> & {
  title: string;
  list: BookList;
};

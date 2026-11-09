// The common shape for a book found online, whichever service it came from.
import type { BookFormat } from '../../data/models';

export interface FoundBook {
  /** Unique within one result list. */
  key: string;
  source: 'openlibrary' | 'google';
  title: string;
  authors: string[];
  isbn13?: string;
  isbn10?: string;
  publisher?: string;
  year?: number;
  pageCount?: number;
  description?: string;
  coverUrl?: string;
  format?: BookFormat;
  openLibraryWorkKey?: string;
  openLibraryEditionKey?: string;
  googleVolumeId?: string;
}

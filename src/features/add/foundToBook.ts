// Turns a book found online into a new book record for My Library, To Buy, or the Reading Log.
import type { BookList, NewBook } from '../../data/models';
import type { FoundBook } from '../../services/bookLookup';
import { newRead } from '../../data/reading';
import { today } from '../../utils/dates';

export function foundToNewBook(f: FoundBook, list: BookList): NewBook {
  return {
    list,
    title: f.title,
    authors: f.authors,
    isbn13: f.isbn13,
    isbn10: f.isbn10,
    publisher: f.publisher,
    year: f.year,
    pageCount: f.pageCount,
    description: f.description,
    coverUrl: f.coverUrl,
    originalCoverUrl: f.coverUrl,
    // To Buy always starts as Paperback (I can pick another edition later).
    // Reading Log books are usually digital, so they start as Ebook.
    format: list === 'toBuy' ? 'Paperback' : list === 'readLog' ? 'Ebook' : (f.format ?? 'Paperback'),
    // A book added to the Reading Log is logged as read today (dates can be changed after).
    ...(list === 'readLog' ? readToday() : {}),
    openLibraryWorkKey: f.openLibraryWorkKey,
    openLibraryEditionKey: f.openLibraryEditionKey,
    googleVolumeId: f.googleVolumeId,
  };
}

/** Reading info for a book logged as "finished today". */
export function readToday(): Pick<NewBook, 'status' | 'reads'> {
  return { status: 'read', reads: [newRead({ finished: today() })] };
}

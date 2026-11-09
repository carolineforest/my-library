// Turns a book found online into a new book record for my library or To Buy list.
import type { BookList, NewBook } from '../../data/models';
import type { FoundBook } from '../../services/bookLookup';

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
    format: list === 'toBuy' ? 'Paperback' : (f.format ?? 'Paperback'),
    openLibraryWorkKey: f.openLibraryWorkKey,
    openLibraryEditionKey: f.openLibraryEditionKey,
    googleVolumeId: f.googleVolumeId,
  };
}

// The on-phone database (IndexedDB, through the Dexie library).
//
// NEVER change an existing version() block once real data exists. To change
// what's stored, add a NEW version with an .upgrade() that converts old data.
// Example:
//   db.version(2).stores({ books: '...new indexes...' }).upgrade(tx =>
//     tx.table('books').toCollection().modify(b => { b.newField = 'default'; }));
import Dexie, { type Table } from 'dexie';
import type { Book, CoverImage, Loan, Setting, Tag } from './models';

export class LibraryDB extends Dexie {
  books!: Table<Book, string>;
  loans!: Table<Loan, string>;
  covers!: Table<CoverImage, string>;
  tags!: Table<Tag, string>;
  settings!: Table<Setting, string>;

  constructor(name = 'my-library') {
    super(name);
    // Only fields listed here can be searched quickly; all fields are saved.
    this.version(1).stores({
      books: 'id, list, title, isbn13, isbn10, status, dateAdded, *tags, location',
      loans: 'id, bookId, personKey, lentDate',
      covers: 'id',
      tags: 'name',
      settings: 'key',
    });
  }
}

export const db = new LibraryDB();

/** Ask the browser to keep our data even when the phone is low on space. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (navigator.storage?.persist) {
      if (await navigator.storage.persisted()) return true;
      return await navigator.storage.persist();
    }
  } catch {
    /* not supported: nothing to do */
  }
  return false;
}

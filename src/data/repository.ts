// THE ONLY PLACE that reads or writes saved data. Screens call these functions
// (usually through hooks.ts) and never touch the database directly. To move to a
// cloud database later, re-implement these functions; screens stay the same.
import { db } from './db';
import type { Book, BookList, CoverImage, Loan, NewBook, Setting, Tag } from './models';
import { findMatches, type BookIdentity } from './duplicates';
import { newId } from '../utils/ids';
import { today } from '../utils/dates';
import { normalizeIsbn } from '../utils/isbn';
import { simplify } from '../utils/text';

// ---------- Books ----------

export async function listBooks(list?: BookList): Promise<Book[]> {
  return list ? db.books.where('list').equals(list).toArray() : db.books.toArray();
}

export async function getBook(id: string): Promise<Book | undefined> {
  return db.books.get(id);
}

/** Fill in defaults and tidy fields so every saved book has the same shape. */
export function buildBook(input: NewBook, now = new Date().toISOString()): Book {
  const isbns = normalizeIsbn(input.isbn13 || input.isbn10);
  return {
    format: 'Paperback',
    tags: [],
    reads: [],
    status: 'none',
    ...input,
    title: input.title.trim(),
    authors: (input.authors ?? []).map((a) => a.trim()).filter(Boolean),
    isbn13: isbns.isbn13 ?? input.isbn13,
    isbn10: isbns.isbn10 ?? input.isbn10,
    originalCoverUrl: input.originalCoverUrl ?? input.coverUrl,
    location: input.location?.trim() || undefined,
    id: newId(),
    dateAdded: now,
    updatedAt: now,
  };
}

export async function addBook(input: NewBook): Promise<Book> {
  const book = buildBook(input);
  await db.books.add(book);
  return book;
}

export async function addBooks(inputs: NewBook[]): Promise<number> {
  const books = inputs.map((i) => buildBook(i));
  await db.books.bulkAdd(books);
  return books.length;
}

export async function updateBook(id: string, changes: Partial<Book>): Promise<void> {
  await db.books.update(id, { ...changes, updatedAt: new Date().toISOString() });
}

/** Delete a book and everything attached to it (loans, uploaded cover). */
export async function deleteBook(id: string): Promise<void> {
  await db.transaction('rw', db.books, db.loans, db.covers, async () => {
    const book = await db.books.get(id);
    if (book?.customCoverId) await db.covers.delete(book.customCoverId);
    await db.loans.where('bookId').equals(id).delete();
    await db.books.delete(id);
  });
}

/** Books on a list that seem to be the same as `candidate`. */
export async function findDuplicates(candidate: BookIdentity, list?: BookList): Promise<Book[]> {
  return findMatches(candidate, await listBooks(list));
}

/** "I Bought It": move a To Buy book into My Library. */
export async function markBought(id: string, extra: Partial<Book> = {}): Promise<void> {
  const book = await db.books.get(id);
  if (!book) return;
  await updateBook(id, {
    status: book.status === 'none' ? 'want' : book.status,
    ...extra,
    list: 'owned',
    dateAdded: new Date().toISOString(),
  });
}

// ---------- Covers I uploaded ----------

export async function saveCoverImage(blob: Blob): Promise<string> {
  const id = newId();
  await db.covers.add({ id, blob });
  return id;
}

export async function getCoverImage(id: string): Promise<Blob | undefined> {
  return (await db.covers.get(id))?.blob;
}

export async function deleteCoverImage(id: string): Promise<void> {
  await db.covers.delete(id);
}

// ---------- Loans ----------

export function personKey(name: string): string {
  return simplify(name);
}

export async function listLoans(): Promise<Loan[]> {
  return db.loans.toArray();
}

export async function loansForBook(bookId: string): Promise<Loan[]> {
  const loans = await db.loans.where('bookId').equals(bookId).toArray();
  return loans.sort((a, b) => b.lentDate.localeCompare(a.lentDate));
}

export async function activeLoans(): Promise<Loan[]> {
  return (await db.loans.toArray()).filter((l) => !l.returnedDate);
}

export async function lendBook(bookId: string, person: string, lentDate = today()): Promise<Loan> {
  const loan: Loan = {
    id: newId(),
    bookId,
    person: person.trim(),
    personKey: personKey(person),
    lentDate,
  };
  await db.transaction('rw', db.loans, async () => {
    // A book can only be out with one person at a time.
    const open = (await db.loans.where('bookId').equals(bookId).toArray()).filter((l) => !l.returnedDate);
    if (open.length) throw new Error('This book is already on loan.');
    await db.loans.add(loan);
  });
  return loan;
}

export async function returnBook(loanId: string, returnedDate = today()): Promise<void> {
  await db.loans.update(loanId, { returnedDate });
}

export async function updateLoan(loanId: string, changes: Partial<Loan>): Promise<void> {
  if (changes.person) changes.personKey = personKey(changes.person);
  await db.loans.update(loanId, changes);
}

export async function deleteLoan(loanId: string): Promise<void> {
  await db.loans.delete(loanId);
}

/** Distinct names I have lent to (most recent spelling wins). */
export async function listPeopleNames(): Promise<string[]> {
  const loans = (await db.loans.toArray()).sort((a, b) => a.lentDate.localeCompare(b.lentDate));
  const byKey = new Map<string, string>();
  for (const l of loans) byKey.set(l.personKey, l.person);
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

// ---------- Shelves / tags and locations ----------

/** All tag names: ones I created plus any used on books. */
export async function listTags(): Promise<string[]> {
  const saved = (await db.tags.toArray()).map((t) => t.name);
  const used = (await db.books.orderBy('tags').uniqueKeys()) as string[];
  return uniqueSorted([...saved, ...used]);
}

export async function createTag(name: string): Promise<void> {
  const clean = name.trim();
  if (clean) await db.tags.put({ name: clean });
}

export async function renameTag(oldName: string, newName: string): Promise<void> {
  const clean = newName.trim();
  if (!clean || clean === oldName) return;
  await db.transaction('rw', db.books, db.tags, async () => {
    await db.tags.delete(oldName);
    await db.tags.put({ name: clean });
    await db.books
      .where('tags')
      .equals(oldName)
      .modify((b) => {
        b.tags = uniqueSorted(b.tags.map((t) => (t === oldName ? clean : t)));
      });
  });
}

export async function deleteTag(name: string): Promise<void> {
  await db.transaction('rw', db.books, db.tags, async () => {
    await db.tags.delete(name);
    await db.books
      .where('tags')
      .equals(name)
      .modify((b) => {
        b.tags = b.tags.filter((t) => t !== name);
      });
  });
}

export async function listLocations(): Promise<string[]> {
  const keys = (await db.books.orderBy('location').uniqueKeys()) as string[];
  return uniqueSorted(keys.filter(Boolean));
}

// ---------- Settings ----------

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key);
  return row === undefined ? fallback : (row.value as T);
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value });
}

// ---------- Whole-library export / restore (used by Backup) ----------

export interface AllData {
  books: Book[];
  loans: Loan[];
  covers: CoverImage[];
  tags: Tag[];
  settings: Setting[];
}

export async function exportAllData(): Promise<AllData> {
  return db.transaction('r', [db.books, db.loans, db.covers, db.tags, db.settings], async () => ({
    books: await db.books.toArray(),
    loans: await db.loans.toArray(),
    covers: await db.covers.toArray(),
    tags: await db.tags.toArray(),
    settings: await db.settings.toArray(),
  }));
}

/** Replace everything with the backup's contents (all or nothing). */
export async function replaceAllData(data: AllData): Promise<void> {
  await db.transaction('rw', [db.books, db.loans, db.covers, db.tags, db.settings], async () => {
    await Promise.all([db.books.clear(), db.loans.clear(), db.covers.clear(), db.tags.clear()]);
    await db.books.bulkAdd(data.books);
    await db.loans.bulkAdd(data.loans);
    await db.covers.bulkAdd(data.covers);
    await db.tags.bulkAdd(data.tags);
    // Keep this phone's "last backup" date; restore the rest of the settings.
    await db.settings.bulkPut(data.settings.filter((s) => s.key !== 'lastBackup'));
  });
}

// ---------- helpers ----------

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: 'base' }),
  );
}

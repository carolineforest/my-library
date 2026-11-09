// Number crunching for the Stats tab (pure functions, tested).
// A "read" counts when it has a finished date; re-reads count again.
import type { Book, Loan } from '../../data/models';

export interface YearStats {
  year: number;
  books: number;
  pages: number;
  /** Index 0 = January. */
  months: { books: number; pages: number }[];
}

export interface Totals {
  owned: number;
  read: number;
  unread: number;
  onLoan: number;
  toBuy: number;
}

function finishedReads(books: Book[]) {
  return books.flatMap((b) =>
    b.reads.filter((r) => r.finished).map((r) => ({ date: r.finished!, pages: b.pageCount ?? 0 })),
  );
}

export function yearStats(books: Book[], year: number): YearStats {
  const months = Array.from({ length: 12 }, () => ({ books: 0, pages: 0 }));
  for (const r of finishedReads(books)) {
    if (Number(r.date.slice(0, 4)) !== year) continue;
    const m = months[Number(r.date.slice(5, 7)) - 1];
    if (!m) continue;
    m.books++;
    m.pages += r.pages;
  }
  return {
    year,
    books: months.reduce((s, m) => s + m.books, 0),
    pages: months.reduce((s, m) => s + m.pages, 0),
    months,
  };
}

/** Books and pages per year, oldest first, only years that have reads. */
export function perYear(books: Book[]): { year: number; books: number; pages: number }[] {
  const map = new Map<number, { year: number; books: number; pages: number }>();
  for (const r of finishedReads(books)) {
    const y = Number(r.date.slice(0, 4));
    const e = map.get(y) ?? { year: y, books: 0, pages: 0 };
    e.books++;
    e.pages += r.pages;
    map.set(y, e);
  }
  return [...map.values()].sort((a, b) => a.year - b.year);
}

export function totals(books: Book[], loans: Loan[]): Totals {
  const owned = books.filter((b) => b.list === 'owned');
  const read = owned.filter((b) => b.status === 'read' || b.reads.some((r) => r.finished)).length;
  const ownedIds = new Set(owned.map((b) => b.id));
  return {
    owned: owned.length,
    read,
    unread: owned.length - read,
    onLoan: loans.filter((l) => !l.returnedDate && ownedIds.has(l.bookId)).length,
    toBuy: books.length - owned.length,
  };
}

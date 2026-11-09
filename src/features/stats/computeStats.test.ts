import { describe, expect, it } from 'vitest';
import { buildBook } from '../../data/repository';
import { perYear, totals, yearStats } from './computeStats';

const books = [
  buildBook({ title: 'A', list: 'owned', pageCount: 100, status: 'read', reads: [{ id: '1', finished: '2024-01-10' }, { id: '2', finished: '2025-03-01' }] }),
  buildBook({ title: 'B', list: 'owned', pageCount: 300, status: 'read', reads: [{ id: '3', finished: '2024-01-20' }] }),
  buildBook({ title: 'C', list: 'owned', status: 'want' }),
  buildBook({ title: 'D', list: 'toBuy' }),
  buildBook({ title: 'E', list: 'readLog', format: 'Ebook', pageCount: 50, status: 'read', reads: [{ id: '4', finished: '2024-02-05' }] }),
];

describe('stats', () => {
  it('counts books and pages per month for a year', () => {
    const s = yearStats(books, 2024);
    expect(s.books).toBe(3);
    expect(s.pages).toBe(450);
    expect(s.fromLog).toBe(1);
    expect(s.months[1]).toEqual({ books: 1, pages: 50 });
    expect(s.months[0]).toEqual({ books: 2, pages: 400 });
  });
  it('counts per year including re-reads', () => {
    expect(perYear(books)).toEqual([
      { year: 2024, books: 3, pages: 450 },
      { year: 2025, books: 1, pages: 100 },
    ]);
  });
  it('totals owned, read, unread, on loan', () => {
    const t = totals(books, [{ id: 'l', bookId: books[0].id, person: 'x', personKey: 'x', lentDate: '2024-01-01' }]);
    // Reading Log books are never counted as owned.
    expect(t).toEqual({ owned: 3, read: 2, unread: 1, onLoan: 1, toBuy: 1, readLog: 1 });
  });
});

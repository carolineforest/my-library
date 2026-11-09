import { describe, expect, it } from 'vitest';
import { buildBook } from '../../data/repository';
import type { Loan } from '../../data/models';
import { applyQuery, EMPTY_QUERY } from './libraryQuery';

const books = [
  buildBook({ title: 'The Hobbit', authors: ['J. R. R. Tolkien'], list: 'owned', status: 'read', tags: ['Fiction'], reads: [{ id: '1', finished: '2020-01-01' }] }, '2024-01-01'),
  buildBook({ title: 'Meditations', authors: ['Marcus Aurelius'], list: 'owned', status: 'want', tags: ['Philosophy'], location: 'Study' }, '2024-02-01'),
  buildBook({ title: 'Anna Karenina', authors: ['Leo Tolstoy'], list: 'owned', status: 'read', reads: [{ id: '2', finished: '2023-05-01' }] }, '2024-03-01'),
];
const titles = (bs: { title: string }[]) => bs.map((b) => b.title);

describe('applyQuery', () => {
  it('sorts by date added (newest first) by default', () => {
    expect(titles(applyQuery(books, EMPTY_QUERY, new Map()))).toEqual(['Anna Karenina', 'Meditations', 'The Hobbit']);
  });
  it('sorts by title ignoring "The"', () => {
    expect(titles(applyQuery(books, { ...EMPTY_QUERY, sortBy: 'title' }, new Map()))).toEqual(['Anna Karenina', 'The Hobbit', 'Meditations']);
  });
  it('sorts by author last name and by date read', () => {
    expect(titles(applyQuery(books, { ...EMPTY_QUERY, sortBy: 'author' }, new Map()))).toEqual(['Meditations', 'The Hobbit', 'Anna Karenina']);
    expect(titles(applyQuery(books, { ...EMPTY_QUERY, sortBy: 'dateRead' }, new Map()))[0]).toBe('Anna Karenina');
  });
  it('searches title and author', () => {
    expect(titles(applyQuery(books, { ...EMPTY_QUERY, text: 'tolk' }, new Map()))).toEqual(['The Hobbit']);
    expect(titles(applyQuery(books, { ...EMPTY_QUERY, text: 'marcus med' }, new Map()))).toEqual(['Meditations']);
  });
  it('filters by status, tag, location, and on loan', () => {
    expect(applyQuery(books, { ...EMPTY_QUERY, status: 'read' }, new Map())).toHaveLength(2);
    expect(titles(applyQuery(books, { ...EMPTY_QUERY, status: 'unread' }, new Map()))).toEqual(['Meditations']);
    expect(titles(applyQuery(books, { ...EMPTY_QUERY, tag: 'Fiction' }, new Map()))).toEqual(['The Hobbit']);
    expect(titles(applyQuery(books, { ...EMPTY_QUERY, location: 'Study' }, new Map()))).toEqual(['Meditations']);
    const loans = new Map<string, Loan>([[books[2].id, { id: 'l', bookId: books[2].id, person: 'Sam', personKey: 'sam', lentDate: '2024-01-01' }]]);
    expect(titles(applyQuery(books, { ...EMPTY_QUERY, onLoan: true }, loans))).toEqual(['Anna Karenina']);
  });
});

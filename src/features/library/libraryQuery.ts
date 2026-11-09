// Search, filter and sort rules for the Library list (pure functions, easy to test).
import type { Book, Loan, ReadingStatus } from '../../data/models';
import { lastFinished } from '../../data/reading';
import { authorSortKey, simplify, titleSortKey } from '../../utils/text';

export type SortBy = 'dateAdded' | 'title' | 'author' | 'dateRead';

export const SORT_LABELS: Record<SortBy, string> = {
  dateAdded: 'Date added',
  title: 'Title',
  author: 'Author',
  dateRead: 'Date read',
};

export interface LibraryQuery {
  text: string;
  sortBy: SortBy;
  status?: ReadingStatus | 'unread';
  tag?: string;
  location?: string;
  onLoan?: boolean;
}

export const EMPTY_QUERY: LibraryQuery = { text: '', sortBy: 'dateAdded' };

export function countActiveFilters(q: LibraryQuery): number {
  return [q.status, q.tag, q.location, q.onLoan].filter(Boolean).length;
}

export function applyQuery(books: Book[], q: LibraryQuery, loans: Map<string, Loan>): Book[] {
  const words = simplify(q.text).split(' ').filter(Boolean);
  const result = books.filter((b) => {
    if (words.length) {
      const hay = simplify(b.title + ' ' + b.authors.join(' '));
      if (!words.every((w) => hay.includes(w))) return false;
    }
    if (q.status === 'unread' ? b.status === 'read' : q.status && b.status !== q.status) return false;
    if (q.tag && !b.tags.includes(q.tag)) return false;
    if (q.location && b.location !== q.location) return false;
    if (q.onLoan && !loans.has(b.id)) return false;
    return true;
  });
  return sortBooks(result, q.sortBy);
}

export function sortBooks(books: Book[], sortBy: SortBy): Book[] {
  const copy = [...books];
  switch (sortBy) {
    case 'title':
      return copy.sort((a, b) => titleSortKey(a.title).localeCompare(titleSortKey(b.title)));
    case 'author':
      return copy.sort(
        (a, b) =>
          authorSortKey(a.authors).localeCompare(authorSortKey(b.authors)) ||
          titleSortKey(a.title).localeCompare(titleSortKey(b.title)),
      );
    case 'dateRead':
      // Most recently finished first; never-finished books go last.
      return copy.sort((a, b) => (lastFinished(b) ?? '').localeCompare(lastFinished(a) ?? ''));
    default:
      return copy.sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
  }
}

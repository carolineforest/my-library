// React hooks that give screens live data: when anything changes in the
// database, screens using these hooks update automatically.
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import * as repo from './repository';
import type { Book, BookList, Loan } from './models';

export function useBooks(list?: BookList): Book[] | undefined {
  return useLiveQuery(() => repo.listBooks(list), [list]);
}

/** undefined = still loading, null = not found. */
export function useBook(id: string | undefined): Book | null | undefined {
  return useLiveQuery(async () => (id ? ((await repo.getBook(id)) ?? null) : null), [id]);
}

export function useLoans(): Loan[] | undefined {
  return useLiveQuery(() => repo.listLoans(), []);
}

export function useBookLoans(bookId: string | undefined): Loan[] | undefined {
  return useLiveQuery(() => (bookId ? repo.loansForBook(bookId) : []), [bookId]);
}

/** Map of bookId -> open loan, for "On Loan" badges. */
export function useActiveLoanMap(): Map<string, Loan> {
  const loans = useLiveQuery(() => repo.activeLoans(), []);
  return new Map((loans ?? []).map((l) => [l.bookId, l]));
}

export function useTags(): string[] {
  return useLiveQuery(() => repo.listTags(), []) ?? [];
}

export function useLocations(): string[] {
  return useLiveQuery(() => repo.listLocations(), []) ?? [];
}

export function usePeopleNames(): string[] {
  return useLiveQuery(() => repo.listPeopleNames(), []) ?? [];
}

export function useSetting<T>(key: string, fallback: T): T {
  return useLiveQuery(() => repo.getSetting(key, fallback), [key]) ?? fallback;
}

/** Turns an uploaded cover (stored as a file) into a temporary address an <img> can show. */
export function useCoverImageUrl(coverId: string | undefined): string | undefined {
  const blob = useLiveQuery(() => (coverId ? repo.getCoverImage(coverId) : undefined), [coverId]);
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    if (!blob) {
      setUrl(undefined);
      return;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

/** Books in My Library that look like the same book (for "You already own this"). */
export function useOwnedMatches(book: Book | null | undefined): Book[] {
  return (
    useLiveQuery(
      async () => (book ? (await repo.findDuplicates(book, 'owned')).filter((b) => b.id !== book.id) : []),
      [book?.id, book?.title, book?.isbn13],
    ) ?? []
  );
}

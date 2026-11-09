// Pure helpers for reading info (statuses, reads, "date read").
import type { Book, ReadEntry } from './models';
import { newId } from '../utils/ids';

/** Latest finished date across all reads, or undefined. */
export function lastFinished(book: Pick<Book, 'reads'>): string | undefined {
  return book.reads
    .map((r) => r.finished)
    .filter((d): d is string => Boolean(d))
    .sort()
    .pop();
}

/** Every finished date (one per completed read). */
export function finishedDates(book: Pick<Book, 'reads'>): string[] {
  return book.reads.map((r) => r.finished).filter((d): d is string => Boolean(d));
}

export function newRead(partial: Partial<ReadEntry> = {}): ReadEntry {
  return { id: newId(), ...partial };
}

/** The read currently in progress (started, not finished), if any. */
export function currentRead(book: Pick<Book, 'reads'>): ReadEntry | undefined {
  return [...book.reads].reverse().find((r) => r.started && !r.finished);
}

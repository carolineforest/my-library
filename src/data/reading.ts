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

/**
 * What happens to the reading log when I change status:
 * - Currently Reading: starts a new read today (unless one is already in progress).
 * - Read: finishes the read in progress today, or logs a read finished today.
 * - Want to Read / none: the log is left alone.
 */
export function applyStatus(
  book: Pick<Book, 'reads' | 'status'>,
  status: Book['status'],
  day: string,
): Pick<Book, 'status' | 'reads'> {
  const reads = book.reads.map((r) => ({ ...r }));
  if (status === 'reading' && !currentRead({ reads })) {
    reads.push(newRead({ started: day }));
  }
  if (status === 'read') {
    const open = [...reads].reverse().find((r) => r.started && !r.finished);
    if (open) open.finished = day;
    else if (!reads.some((r) => r.finished)) reads.push(newRead({ finished: day }));
  }
  return { status, reads };
}

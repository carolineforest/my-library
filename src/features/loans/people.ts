// Groups loans by person for the People view (pure function, tested).
import type { Book, Loan } from '../../data/models';

export interface PersonSummary {
  key: string;
  name: string;
  current: Loan[];
  past: Loan[];
  lastLent: string;
}

export function summarizePeople(loans: Loan[]): PersonSummary[] {
  const map = new Map<string, PersonSummary>();
  for (const l of [...loans].sort((a, b) => a.lentDate.localeCompare(b.lentDate))) {
    const p = map.get(l.personKey) ?? { key: l.personKey, name: l.person, current: [], past: [], lastLent: l.lentDate };
    p.name = l.person; // latest spelling
    p.lastLent = l.lentDate;
    (l.returnedDate ? p.past : p.current).push(l);
    map.set(l.personKey, p);
  }
  // People who have books now first, then most recent.
  return [...map.values()].sort(
    (a, b) => Number(b.current.length > 0) - Number(a.current.length > 0) || b.lastLent.localeCompare(a.lastLent),
  );
}

export function bookById(books: Book[] | undefined): Map<string, Book> {
  return new Map((books ?? []).map((b) => [b.id, b]));
}

// Before saving a new book, check whether it already seems to be in my
// library (or already on the list I'm adding to) and ask before adding it again.
import { useState, type ReactNode } from 'react';
import { LIST_LABELS, type Book, type BookList } from '../../data/models';
import type { BookIdentity } from '../../data/duplicates';
import { findDuplicates } from '../../data/repository';
import { Sheet } from '../../components/Sheet';
import { Cover } from '../../components/Cover';
import { href } from '../../app/router';
import { joinAuthors } from '../../utils/text';

interface Pending {
  owned: Book[];
  /** Matches on the list I'm adding to (To Buy or Reading Log). */
  sameList: Book[];
  list: BookList;
  proceed: () => void;
}

export function useDuplicateGuard(): {
  guard: (candidate: BookIdentity, list: BookList, proceed: () => void) => Promise<void>;
  dialog: ReactNode;
} {
  const [pending, setPending] = useState<Pending | null>(null);

  async function guard(candidate: BookIdentity, list: BookList, proceed: () => void) {
    const owned = await findDuplicates(candidate, 'owned');
    const sameList = list === 'owned' ? [] : await findDuplicates(candidate, list);
    if (owned.length === 0 && sameList.length === 0) proceed();
    else setPending({ owned, sameList, list, proceed });
  }

  const dialog = pending && (
    <Sheet title={pending.owned.length ? 'You already own this' : `Already in your ${LIST_LABELS[pending.list]}`} onClose={() => setPending(null)}>
      <p className="muted">
        {pending.owned.length
          ? 'This looks like a book that is already in My Library:'
          : `This looks like a book that is already in your ${LIST_LABELS[pending.list]}:`}
      </p>
      {pending.list === 'readLog' && (
        <p className="small muted">
          {pending.owned.length
            ? 'To log reading your own copy, open it and use the Reading section instead. Add it here only if you read a different copy, like the ebook.'
            : 'To log reading it again, open it and tap “Log another read”.'}
        </p>
      )}
      <ul className="book-list">
        {[...pending.owned, ...pending.sameList].map((b) => (
          <li key={b.id}>
            <a className="book-row" href={href('/book/' + b.id)} onClick={() => setPending(null)}>
              <Cover book={b} />
              <div className="book-row-body">
                <div className="book-row-title">{b.title}</div>
                <div className="book-row-sub">
                  {joinAuthors(b.authors)} · {LIST_LABELS[b.list]}
                  {b.format ? ` · ${b.format}` : ''}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ul>
      <div className="stack" style={{ marginTop: 16 }}>
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            const go = pending.proceed;
            setPending(null);
            go();
          }}
        >
          Add it anyway
        </button>
        <button type="button" className="btn btn-block" onClick={() => setPending(null)}>
          Cancel
        </button>
      </div>
    </Sheet>
  );

  return { guard, dialog };
}

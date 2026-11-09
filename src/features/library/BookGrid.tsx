// Shows a set of books as a cover grid or a list. Used by Library and To Buy.
import type { Book, Loan } from '../../data/models';
import { READING_STATUS_LABELS } from '../../data/models';
import { Cover } from '../../components/Cover';
import { StarsSmall } from '../../components/Stars';
import { href } from '../../app/router';
import { joinAuthors } from '../../utils/text';

export type ViewMode = 'grid' | 'list';

interface BookGridProps {
  books: Book[];
  view: ViewMode;
  loans?: Map<string, Loan>;
}

export function BookGrid({ books, view, loans }: BookGridProps) {
  if (view === 'list') {
    return (
      <ul className="book-list">
        {books.map((b) => {
          const loan = loans?.get(b.id);
          return (
            <li key={b.id}>
              <a className="book-row" href={href('/book/' + b.id)}>
                <Cover book={b} />
                <div className="book-row-body">
                  <div className="book-row-title">{b.title}</div>
                  <div className="book-row-sub">{joinAuthors(b.authors)}</div>
                  <div className="row-wrap" style={{ marginTop: 4 }}>
                    {loan && <span className="badge badge-loan">On Loan to {loan.person}</span>}
                    {b.list === 'owned' && b.status !== 'none' && (
                      <span className="badge">{READING_STATUS_LABELS[b.status]}</span>
                    )}
                    <StarsSmall value={b.rating} />
                  </div>
                </div>
              </a>
            </li>
          );
        })}
      </ul>
    );
  }
  return (
    <div className="cover-grid">
      {books.map((b) => {
        const loan = loans?.get(b.id);
        return (
          <a key={b.id} className="grid-item" href={href('/book/' + b.id)}>
            <Cover book={b} badge={loan ? `On Loan to ${loan.person}` : undefined} />
            <div className="grid-title">{b.title}</div>
            <div className="grid-author">{joinAuthors(b.authors)}</div>
          </a>
        );
      })}
    </div>
  );
}

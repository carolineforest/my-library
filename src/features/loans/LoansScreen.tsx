// The "Loans" tab: books out on loan right now, and everyone I've lent to.
import { useState } from 'react';
import { useBooks, useLoans } from '../../data/hooks';
import type { Book, Loan } from '../../data/models';
import { EmptyState } from '../../components/EmptyState';
import { Cover } from '../../components/Cover';
import { Icon } from '../../components/Icon';
import { href, navigate } from '../../app/router';
import { daysBetween, formatDate } from '../../utils/dates';
import { joinAuthors } from '../../utils/text';
import { ReturnSheet } from './LendSheet';
import { bookById, summarizePeople } from './people';

export function LoansScreen({ view }: { view?: string }) {
  const loans = useLoans();
  const books = useBooks();
  const byId = bookById(books);
  const tab = view === 'people' ? 'people' : 'out';
  const [returning, setReturning] = useState<{ book: Book; loan: Loan }>();

  if (!loans || !books) return <div className="page" />;
  const out = loans.filter((l) => !l.returnedDate && byId.has(l.bookId)).sort((a, b) => a.lentDate.localeCompare(b.lentDate));
  const people = summarizePeople(loans.filter((l) => byId.has(l.bookId)));

  return (
    <div className="page">
      <header className="page-header">
        <h1>Loans</h1>
      </header>
      <div className="segmented" role="group" aria-label="Loans view" style={{ marginBottom: 16 }}>
        <button type="button" aria-pressed={tab === 'out'} onClick={() => navigate('/loans', { replace: true })}>
          On Loan ({out.length})
        </button>
        <button type="button" aria-pressed={tab === 'people'} onClick={() => navigate('/loans/people', { replace: true })}>
          People ({people.length})
        </button>
      </div>

      {tab === 'out' &&
        (out.length === 0 ? (
          <EmptyState
            art="loan"
            title="Everything's on the shelf"
            message="When you lend a book, open it in your library and tap “Loan”. It will show up here."
          />
        ) : (
          <ul className="book-list">
            {out.map((l) => {
              const book = byId.get(l.bookId)!;
              const days = daysBetween(l.lentDate);
              return (
                <li key={l.id} className="book-row" style={{ cursor: 'default' }}>
                  <a href={href('/book/' + book.id)} style={{ width: 52, flex: 'none' }} aria-label={book.title}>
                    <Cover book={book} />
                  </a>
                  <div className="book-row-body">
                    <a className="book-row-title" href={href('/book/' + book.id)} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {book.title}
                    </a>
                    <div className="book-row-sub">{joinAuthors(book.authors)}</div>
                    <div className="small" style={{ marginTop: 2 }}>
                      <a href={href('/loans/person/' + encodeURIComponent(l.personKey))}>{l.person}</a>
                      <span className="muted">
                        {' '}
                        · since {formatDate(l.lentDate)} ({days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'}`})
                      </span>
                    </div>
                  </div>
                  <button type="button" className="btn btn-sm btn-soft" onClick={() => setReturning({ book, loan: l })}>
                    Return
                  </button>
                </li>
              );
            })}
          </ul>
        ))}

      {tab === 'people' &&
        (people.length === 0 ? (
          <EmptyState art="loan" title="No one yet" message="People you lend books to will be listed here with their history." />
        ) : (
          <ul className="book-list">
            {people.map((p) => (
              <li key={p.key}>
                <a className="book-row" href={href('/loans/person/' + encodeURIComponent(p.key))}>
                  <span className="avatar" aria-hidden>
                    {p.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="book-row-body">
                    <div className="book-row-title">{p.name}</div>
                    <div className="book-row-sub">
                      {p.current.length > 0 ? `Has ${p.current.length} now · ` : ''}
                      {p.current.length + p.past.length} borrowed in total
                    </div>
                  </div>
                  <Icon name="chevron" />
                </a>
              </li>
            ))}
          </ul>
        ))}

      {returning && <ReturnSheet book={returning.book} loan={returning.loan} onClose={() => setReturning(undefined)} />}
    </div>
  );
}

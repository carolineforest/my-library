// One person's page: what they have now and everything they borrowed before.
import { useBooks, useLoans } from '../../data/hooks';
import type { Loan } from '../../data/models';
import { Cover } from '../../components/Cover';
import { Icon } from '../../components/Icon';
import { goBack, href } from '../../app/router';
import { formatDate } from '../../utils/dates';
import { bookById, summarizePeople } from './people';

export function PersonScreen({ personKey }: { personKey?: string }) {
  const loans = useLoans();
  const books = useBooks();
  if (!loans || !books) return <div className="page" />;
  const byId = bookById(books);
  const person = summarizePeople(loans.filter((l) => byId.has(l.bookId))).find((p) => p.key === personKey);

  const row = (l: Loan) => {
    const book = byId.get(l.bookId)!;
    return (
      <li key={l.id}>
        <a className="book-row" href={href('/book/' + book.id)}>
          <Cover book={book} />
          <div className="book-row-body">
            <div className="book-row-title">{book.title}</div>
            <div className="book-row-sub">
              Lent {formatDate(l.lentDate)}
              {l.returnedDate ? ` · Returned ${formatDate(l.returnedDate)}` : ''}
            </div>
          </div>
        </a>
      </li>
    );
  };

  return (
    <div className="page">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => goBack('/loans/people')} aria-label="Back">
          <Icon name="back" />
        </button>
        <h1>{person?.name ?? 'Person'}</h1>
      </header>
      {!person && <p className="muted">No loans found for this person.</p>}
      {person && (
        <>
          <section className="section">
            <h2 className="section-title">Has now</h2>
            {person.current.length ? (
              <ul className="book-list">{person.current.map(row)}</ul>
            ) : (
              <p className="muted">Nothing at the moment.</p>
            )}
          </section>
          <section className="section">
            <h2 className="section-title">Borrowed before</h2>
            {person.past.length ? (
              <ul className="book-list">{[...person.past].reverse().map(row)}</ul>
            ) : (
              <p className="muted">Nothing returned yet.</p>
            )}
          </section>
        </>
      )}
    </div>
  );
}

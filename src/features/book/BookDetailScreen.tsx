// A single book's page: big cover, details, and actions.
import { useState } from 'react';
import { useBook, useBookLoans, useOwnedMatches } from '../../data/hooks';
import { deleteBook, markBought } from '../../data/repository';
import { Cover } from '../../components/Cover';
import { Icon } from '../../components/Icon';
import { Sheet } from '../../components/Sheet';
import { EmptyState } from '../../components/EmptyState';
import { showToast } from '../../components/Toast';
import { goBack, href, navigate } from '../../app/router';
import { joinAuthors } from '../../utils/text';
import { formatDate } from '../../utils/dates';
import { ChangeCoverSheet } from './ChangeCoverSheet';
import { ReadingSection } from './ReadingSection';
import { LendSheet, ReturnSheet } from '../loans/LendSheet';
import { LoanHistory } from '../loans/LoanHistory';
import { ToBuyActions } from '../toBuy/ToBuyActions';
import { BoughtSheet } from '../toBuy/BoughtSheet';
import { LIST_HOME, READING_STATUS_LABELS } from '../../data/models';
import { StarsSmall } from '../../components/Stars';
import './book.css';

export function BookDetailScreen({ id }: { id?: string }) {
  const book = useBook(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [changingCover, setChangingCover] = useState(false);
  const [loanPanel, setLoanPanel] = useState(false);
  const [justBought, setJustBought] = useState(false);
  const loans = useBookLoans(id);
  const activeLoan = loans?.find((l) => !l.returnedDate);
  // On To Buy / Reading Log books, point out if I already own a physical copy.
  const ownedMatches = useOwnedMatches(book && book.list !== 'owned' ? book : null);

  if (book === undefined) return <div className="page" />;
  if (book === null)
    return (
      <div className="page">
        <EmptyState
          title="Book not found"
          message="It may have been deleted."
          action={
            <a className="btn btn-primary" href={href('/library')}>
              Back to Library
            </a>
          }
        />
      </div>
    );

  const backTo = LIST_HOME[book.list];
  const tracksReading = book.list === 'owned' || book.list === 'readLog';

  return (
    <div className="page book-page">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => goBack(backTo)} aria-label="Back">
          <Icon name="back" />
        </button>
        <span className="spacer" />
        <a className="icon-btn" href={href('/edit/' + book.id)} aria-label="Edit book">
          <Icon name="edit" />
        </a>
      </header>

      <div className="book-hero">
        <div className="book-hero-cover">
          <Cover book={book} eager badge={activeLoan ? `On Loan to ${activeLoan.person}` : undefined} />
        </div>
        <div className="book-hero-text">
          <h1>{book.title}</h1>
          {book.authors.length > 0 && <p className="book-authors">{joinAuthors(book.authors)}</p>}
          <div className="row-wrap">
            {book.list === 'toBuy' && <span className="badge badge-accent">To Buy</span>}
            {book.list === 'readLog' && <span className="badge badge-accent">Reading Log</span>}
            {book.list !== 'owned' && <span className="badge">{book.format}</span>}
            {tracksReading && book.status !== 'none' && (
              <span className="badge">{READING_STATUS_LABELS[book.status]}</span>
            )}
          </div>
          <StarsSmall value={book.rating} />
        </div>
      </div>

      {activeLoan && (
        <p className="notice notice-secondary section" role="status">
          <Icon name="loan" />
          <span>
            <strong>On Loan to {activeLoan.person}</strong> since {formatDate(activeLoan.lentDate)}
          </span>
        </p>
      )}

      {ownedMatches.length > 0 && (
        <p className="notice section" role="status">
          <Icon name="info" />
          <span>
            <strong>You already own this.</strong>{' '}
            <a href={href('/book/' + ownedMatches[0].id)}>
              See your {ownedMatches[0].format.toLowerCase()} copy
            </a>
          </span>
        </p>
      )}

      {book.list === 'toBuy' && <ToBuyActions book={book} onChangeCover={() => setChangingCover(true)} onBought={() => setJustBought(true)} />}

      {book.list === 'readLog' && (
        <div className="book-actions section">
          <button
            type="button"
            className="btn"
            onClick={async () => {
              // Bought a physical copy: move it into My Library, keeping its reading history.
              await markBought(book.id, { format: 'Paperback' });
              setJustBought(true);
            }}
          >
            <Icon name="library" /> I Own a Copy Now
          </button>
          <button type="button" className="btn" onClick={() => setChangingCover(true)}>
            <Icon name="image" /> Change Cover
          </button>
        </div>
      )}

      {book.list === 'owned' && (
        <div className="book-actions section">
          <button type="button" className={`btn ${activeLoan ? 'btn-secondary' : ''}`} onClick={() => setLoanPanel(true)}>
            <Icon name="loan" /> {activeLoan ? 'Return to Shelf' : 'Loan'}
          </button>
          <button type="button" className="btn" onClick={() => setChangingCover(true)}>
            <Icon name="image" /> Change Cover
          </button>
        </div>
      )}

      {book.list === 'owned' && (
        <section className="section card" aria-label="Location and shelves">
          {book.location && (
            <p>
              <a className="row" href={href('/library?location=' + encodeURIComponent(book.location))}>
                <Icon name="pin" /> {book.location}
              </a>
            </p>
          )}
          {book.tags.length > 0 && (
            <div className="row-wrap">
              {book.tags.map((t) => (
                <a key={t} className="chip" href={href('/library?tag=' + encodeURIComponent(t))}>
                  <Icon name="tag" /> {t}
                </a>
              ))}
            </div>
          )}
          {!book.location && book.tags.length === 0 && (
            <a className="row" href={href('/edit/' + book.id)}>
              <Icon name="plus" /> Add a location and shelves
            </a>
          )}
        </section>
      )}

      {tracksReading && <ReadingSection book={book} />}

      {book.description && (
        <section className="section">
          <h2 className="section-title">About this book</h2>
          <p className="book-description">{book.description}</p>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Details</h2>
        <dl className="details">
          {book.isbn13 && (<><dt>ISBN-13</dt><dd>{book.isbn13}</dd></>)}
          {book.isbn10 && (<><dt>ISBN-10</dt><dd>{book.isbn10}</dd></>)}
          {book.publisher && (<><dt>Publisher</dt><dd>{book.publisher}</dd></>)}
          {book.year && (<><dt>Year</dt><dd>{book.year}</dd></>)}
          {book.pageCount && (<><dt>Pages</dt><dd>{book.pageCount}</dd></>)}
          <dt>Format</dt>
          <dd>{book.format}</dd>
          <dt>Added</dt>
          <dd>{formatDate(book.dateAdded)}</dd>
        </dl>
      </section>

      {loans && <LoanHistory loans={loans} />}

      <section className="section">
        <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirmDelete(true)}>
          <Icon name="trash" /> Delete this book
        </button>
      </section>

      {loanPanel &&
        (activeLoan ? (
          <ReturnSheet book={book} loan={activeLoan} onClose={() => setLoanPanel(false)} />
        ) : (
          <LendSheet book={book} onClose={() => setLoanPanel(false)} />
        ))}
      {justBought && <BoughtSheet book={book} onClose={() => setJustBought(false)} />}
      {changingCover && <ChangeCoverSheet book={book} onClose={() => setChangingCover(false)} />}
      {confirmDelete && (
        <Sheet title="Delete this book?" onClose={() => setConfirmDelete(false)}>
          <p>
            “{book.title}” and its reading and loan history will be removed from this phone. This can't be undone.
          </p>
          <div className="stack">
            <button
              type="button"
              className="btn btn-primary btn-block"
              style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              onClick={async () => {
                await deleteBook(book.id);
                showToast('Book deleted');
                navigate(backTo, { replace: true });
              }}
            >
              Delete
            </button>
            <button type="button" className="btn btn-block" onClick={() => setConfirmDelete(false)}>
              Cancel
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

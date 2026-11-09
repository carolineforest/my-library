// A single book's page: big cover, details, and actions.
import { useState } from 'react';
import { useBook } from '../../data/hooks';
import { deleteBook } from '../../data/repository';
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
import { READING_STATUS_LABELS } from '../../data/models';
import { StarsSmall } from '../../components/Stars';
import './book.css';

export function BookDetailScreen({ id }: { id?: string }) {
  const book = useBook(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [changingCover, setChangingCover] = useState(false);

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

  const backTo = book.list === 'toBuy' ? '/tobuy' : '/library';

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
          <Cover book={book} eager />
        </div>
        <div className="book-hero-text">
          <h1>{book.title}</h1>
          {book.authors.length > 0 && <p className="book-authors">{joinAuthors(book.authors)}</p>}
          <div className="row-wrap">
            {book.list === 'toBuy' && <span className="badge badge-accent">To Buy</span>}
            {book.list === 'owned' && book.status !== 'none' && (
              <span className="badge">{READING_STATUS_LABELS[book.status]}</span>
            )}
          </div>
          <StarsSmall value={book.rating} />
        </div>
      </div>

      <div className="book-actions section">
        <button type="button" className="btn" onClick={() => setChangingCover(true)}>
          <Icon name="image" /> Change Cover
        </button>
      </div>

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

      {book.list === 'owned' && <ReadingSection book={book} />}

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

      <section className="section">
        <button type="button" className="btn btn-danger btn-block" onClick={() => setConfirmDelete(true)}>
          <Icon name="trash" /> Delete this book
        </button>
      </section>

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

// The Reading Log (#/stats/log): books I read but don't own physically
// (ebooks, audiobooks, borrowed books). They count in Stats, never in My Library.
import { useState } from 'react';
import { useBooks } from '../../data/hooks';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { goBack, href } from '../../app/router';
import { BookGrid } from '../library/BookGrid';
import { useViewMode } from '../library/useViewMode';
import { ViewToggle } from '../library/ViewToggle';
import { applyQuery, EMPTY_QUERY } from '../library/libraryQuery';

export function ReadingLogScreen() {
  const books = useBooks('readLog');
  const [view, setView] = useViewMode('readLog');
  const [text, setText] = useState('');
  // Most recently finished first.
  const shown = books ? applyQuery(books, { ...EMPTY_QUERY, text, sortBy: 'dateRead' }, new Map()) : [];

  return (
    <div className="page">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => goBack('/stats')} aria-label="Back to Stats">
          <Icon name="back" />
        </button>
        <h1>Reading Log</h1>
        {books && books.length > 0 && <ViewToggle view={view} onChange={setView} />}
        <a className="add-btn" href={href('/add?list=readLog')} aria-label="Log a book I read">
          <Icon name="plus" />
        </a>
      </header>
      <p className="small muted" style={{ marginTop: -4, marginBottom: 14 }}>
        Books you read but don't own as a physical copy. They count in your Stats, not in My Library.
      </p>

      {books && books.length === 0 && (
        <EmptyState
          title="Nothing logged yet"
          message="Finished an ebook, audiobook or borrowed book? Log it here so it counts toward your reading goal."
          action={
            <a className="btn btn-primary" href={href('/add?list=readLog')}>
              <Icon name="plus" /> Log a book I read
            </a>
          }
        />
      )}

      {books && books.length > 0 && (
        <>
          <div className="search-box" style={{ marginBottom: 16 }}>
            <Icon name="search" />
            <input
              className="input"
              type="search"
              placeholder="Search title or author"
              aria-label="Search my reading log"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          {shown.length === 0 ? (
            <p className="muted center" style={{ padding: 32 }}>
              No books match.
            </p>
          ) : (
            <BookGrid books={shown} view={view} />
          )}
        </>
      )}
    </div>
  );
}

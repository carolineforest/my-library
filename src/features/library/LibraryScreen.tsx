// The "Library" tab: every book I own, as a cover grid or list,
// with search, sort and filters. Filters can be preset from the address,
// e.g. #/library?tag=Fiction or #/library?onLoan=1.
import { useState } from 'react';
import { useBooks, useActiveLoanMap, useLocations, useTags } from '../../data/hooks';
import { READING_STATUS_LABELS } from '../../data/models';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { href } from '../../app/router';
import { BookGrid } from './BookGrid';
import { useViewMode } from './useViewMode';
import { ViewToggle } from './ViewToggle';
import { FilterSheet } from './FilterSheet';
import { applyQuery, countActiveFilters, EMPTY_QUERY, SORT_LABELS, type LibraryQuery, type SortBy } from './libraryQuery';
import { BackupReminder } from '../settings/BackupReminder';

function initialQuery(params: Record<string, string>): LibraryQuery {
  let sortBy: SortBy = 'dateAdded';
  try {
    const saved = localStorage.getItem('library:sort') as SortBy | null;
    if (saved && saved in SORT_LABELS) sortBy = saved;
  } catch {
    /* ignore */
  }
  return {
    ...EMPTY_QUERY,
    sortBy,
    tag: params.tag,
    location: params.location,
    status: params.status as LibraryQuery['status'],
    onLoan: params.onLoan ? true : undefined,
  };
}

export function LibraryScreen({ params = {} }: { params?: Record<string, string> }) {
  const books = useBooks('owned');
  const loans = useActiveLoanMap();
  const tags = useTags();
  const locations = useLocations();
  const [view, setView] = useViewMode('library');
  const [query, setQueryState] = useState(() => initialQuery(params));
  const [showFilters, setShowFilters] = useState(false);

  const setQuery = (q: LibraryQuery) => {
    setQueryState(q);
    try {
      localStorage.setItem('library:sort', q.sortBy);
    } catch {
      /* ignore */
    }
  };

  const shown = books ? applyQuery(books, query, loans) : [];
  const filterCount = countActiveFilters(query);
  const activeChips: { label: string; clear: Partial<LibraryQuery> }[] = [
    query.status && { label: query.status === 'unread' ? 'Not read yet' : READING_STATUS_LABELS[query.status], clear: { status: undefined } },
    query.onLoan && { label: 'On loan', clear: { onLoan: undefined } },
    query.tag && { label: query.tag, clear: { tag: undefined } },
    query.location && { label: query.location, clear: { location: undefined } },
  ].filter(Boolean) as { label: string; clear: Partial<LibraryQuery> }[];

  return (
    <div className="page">
      <header className="page-header">
        <h1>My Library</h1>
        {books && books.length > 0 && <ViewToggle view={view} onChange={setView} />}
        <a className="add-btn" href={href('/add?list=owned')} aria-label="Add a book">
          <Icon name="plus" />
        </a>
      </header>

      <BackupReminder />

      {books && books.length === 0 && (
        <EmptyState
          title="Your shelves are empty"
          message="Scan your first book's barcode, search for it, or type it in."
          action={
            <div className="stack">
              <a className="btn btn-primary" href={href('/add?list=owned&mode=scan')}>
                <Icon name="scan" /> Scan your first book
              </a>
              <a className="btn" href={href('/settings')}>
                Import from Goodreads
              </a>
            </div>
          }
        />
      )}

      {books && books.length > 0 && (
        <>
          <div className="row" style={{ marginBottom: 10 }}>
            <div className="search-box" style={{ flex: 1 }}>
              <Icon name="search" />
              <input
                className="input"
                type="search"
                placeholder="Search title or author"
                aria-label="Search my library"
                value={query.text}
                onChange={(e) => setQuery({ ...query, text: e.target.value })}
              />
            </div>
            <button
              type="button"
              className={`icon-btn ${filterCount ? 'active' : ''}`}
              onClick={() => setShowFilters(true)}
              aria-label={`Sort and filter${filterCount ? `, ${filterCount} filters on` : ''}`}
            >
              <Icon name="filter" />
            </button>
          </div>

          <div className="chips-scroll" style={{ marginBottom: 16 }}>
            <button type="button" className="chip" onClick={() => setShowFilters(true)}>
              <Icon name="sort" /> {SORT_LABELS[query.sortBy]}
            </button>
            {activeChips.map((c) => (
              <button
                key={c.label}
                type="button"
                className="chip"
                aria-pressed="true"
                aria-label={`Remove filter ${c.label}`}
                onClick={() => setQuery({ ...query, ...c.clear })}
              >
                {c.label} <Icon name="close" />
              </button>
            ))}
            <span className="chip" style={{ cursor: 'default', border: 'none', background: 'none' }} aria-live="polite">
              {shown.length} {shown.length === 1 ? 'book' : 'books'}
            </span>
          </div>

          {shown.length === 0 ? (
            <p className="muted center" style={{ padding: 32 }}>
              No books match. Try a different search or clear the filters.
            </p>
          ) : (
            <BookGrid books={shown} view={view} loans={loans} />
          )}
        </>
      )}

      {showFilters && (
        <FilterSheet query={query} onChange={setQuery} tags={tags} locations={locations} onClose={() => setShowFilters(false)} />
      )}
    </div>
  );
}

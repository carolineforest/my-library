// The "Library" tab: every book I own, as a cover grid or list.
import { useBooks, useActiveLoanMap } from '../../data/hooks';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { href } from '../../app/router';
import { BookGrid } from './BookGrid';
import { useViewMode } from './useViewMode';
import { ViewToggle } from './ViewToggle';

export function LibraryScreen() {
  const books = useBooks('owned');
  const loans = useActiveLoanMap();
  const [view, setView] = useViewMode('library');

  const sorted = [...(books ?? [])].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));

  return (
    <div className="page">
      <header className="page-header">
        <h1>My Library</h1>
        {sorted.length > 0 && <ViewToggle view={view} onChange={setView} />}
        <a className="add-btn" href={href('/add?list=owned')} aria-label="Add a book">
          <Icon name="plus" />
        </a>
      </header>

      {books && books.length === 0 && (
        <EmptyState
          title="Your shelves are empty"
          message="Add your first book: scan its barcode, search for it, or type it in."
          action={
            <a className="btn btn-primary" href={href('/add?list=owned')}>
              <Icon name="plus" /> Add your first book
            </a>
          }
        />
      )}
      {sorted.length > 0 && <BookGrid books={sorted} view={view} loans={loans} />}
    </div>
  );
}

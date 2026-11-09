// The "To Buy" tab: books I want to buy.
import { useBooks } from '../../data/hooks';
import { EmptyState } from '../../components/EmptyState';
import { Icon } from '../../components/Icon';
import { href } from '../../app/router';
import { BookGrid } from '../library/BookGrid';
import { useViewMode } from '../library/useViewMode';
import { ViewToggle } from '../library/ViewToggle';

export function ToBuyScreen() {
  const books = useBooks('toBuy');
  const [view, setView] = useViewMode('tobuy');
  const sorted = [...(books ?? [])].sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));

  return (
    <div className="page">
      <header className="page-header">
        <h1>To Buy</h1>
        {sorted.length > 0 && <ViewToggle view={view} onChange={setView} />}
        <a className="add-btn" href={href('/add?list=toBuy&mode=search')} aria-label="Add a book to buy">
          <Icon name="plus" />
        </a>
      </header>
      {books && books.length === 0 && (
        <EmptyState
          art="bag"
          title="Nothing on your list yet"
          message="Spotted a book you want? Scan it in the shop or search for it, and compare prices later."
          action={
            <a className="btn btn-primary" href={href('/add?list=toBuy&mode=search')}>
              <Icon name="plus" /> Add a book to buy
            </a>
          }
        />
      )}
      {sorted.length > 0 && <BookGrid books={sorted} view={view} />}
    </div>
  );
}

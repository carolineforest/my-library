// "Search" tab of Add a Book: type a title or author, see results with covers.
import { useState } from 'react';
import { searchBooks, type FoundBook } from '../../services/bookLookup';
import { Cover } from '../../components/Cover';
import { Icon } from '../../components/Icon';
import { joinAuthors } from '../../utils/text';

export function SearchPanel({ onPick }: { onPick: (found: FoundBook) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FoundBook[]>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setBusy(true);
    setError('');
    try {
      setResults(await searchBooks(query));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <form onSubmit={run} className="row" role="search">
        <div className="search-box" style={{ flex: 1 }}>
          <Icon name="search" />
          <input
            className="input"
            type="search"
            enterKeyHint="search"
            placeholder="Title, author, or ISBN"
            aria-label="Search for a book"
            value={query}
            autoFocus
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={busy || !query.trim()}>
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      {results && results.length === 0 && !busy && (
        <p className="muted center">No books found. Try fewer words, or use “Type it in”.</p>
      )}
      {results && results.length > 0 && (
        <ul className="book-list" aria-label="Search results">
          {results.map((f) => (
            <li key={f.key}>
              <button type="button" className="book-row" onClick={() => onPick(f)}>
                <Cover book={f} />
                <div className="book-row-body">
                  <div className="book-row-title">{f.title}</div>
                  <div className="book-row-sub">{joinAuthors(f.authors) || 'Unknown author'}</div>
                  {f.year && <div className="book-row-sub">{f.year}</div>}
                </div>
                <Icon name="plus" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

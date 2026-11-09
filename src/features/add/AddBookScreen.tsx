// "Add a book" screen with three ways to add: Scan, Search, or type it in.
// `list` decides where the book goes: My Library ("owned") or To Buy.
import type { BookList } from '../../data/models';
import { goBack, navigate } from '../../app/router';
import { Icon } from '../../components/Icon';
import { showToast } from '../../components/Toast';
import { BookForm } from '../book/BookForm';
import { useDuplicateGuard } from './useDuplicateGuard';
import { saveNewBook } from './saveBook';

type Mode = 'scan' | 'search' | 'manual';

export function AddBookScreen({ list, mode: modeParam }: { list: BookList; mode?: string }) {
  const mode: Mode = modeParam === 'scan' || modeParam === 'search' ? modeParam : 'manual';
  const { guard, dialog } = useDuplicateGuard();
  const backTo = list === 'toBuy' ? '/tobuy' : '/library';

  return (
    <div className="page">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => goBack(backTo)} aria-label="Back">
          <Icon name="back" />
        </button>
        <h1>{list === 'toBuy' ? 'Add to To Buy' : 'Add a Book'}</h1>
      </header>

      <div className="segmented" role="group" aria-label="How to add" style={{ marginBottom: 20 }}>
        {(['scan', 'search', 'manual'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => navigate(`/add?list=${list}&mode=${m}`, { replace: true })}
          >
            {m === 'scan' ? 'Scan' : m === 'search' ? 'Search' : 'Type it in'}
          </button>
        ))}
      </div>

      {mode === 'manual' && (
        <BookForm
          allowCoverUpload
          showShelving={list === 'owned'}
          initial={{ format: 'Paperback' }}
          submitLabel={list === 'toBuy' ? 'Add to To Buy' : 'Add to My Library'}
          onSubmit={({ fields, coverFile }) =>
            guard(fields, list, async () => {
              const book = await saveNewBook({ ...fields, list }, coverFile);
              showToast(`Added “${book.title}”`);
              navigate('/book/' + book.id, { replace: true });
            })
          }
        />
      )}
      {mode !== 'manual' && <p className="muted">Coming in the next phase.</p>}
      {dialog}
    </div>
  );
}

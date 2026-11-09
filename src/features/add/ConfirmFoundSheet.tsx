// "Is this the book?" panel shown after a scan or search, before saving.
import type { BookList } from '../../data/models';
import { ADD_BUTTON, DEFAULT_FORMAT } from './labels';
import type { FoundBook } from '../../services/bookLookup';
import { Sheet } from '../../components/Sheet';
import { Cover } from '../../components/Cover';
import { joinAuthors } from '../../utils/text';

interface Props {
  found: FoundBook;
  list: BookList;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}

export function ConfirmFoundSheet({ found, list, onConfirm, onCancel, busy }: Props) {
  const facts = [found.year, found.publisher, list === 'owned' ? found.format : DEFAULT_FORMAT[list], found.pageCount && `${found.pageCount} pages`]
    .filter(Boolean)
    .join(' · ');
  return (
    <Sheet title="Is this your book?" onClose={onCancel}>
      <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
        <div style={{ width: 120, flex: 'none' }}>
          <Cover book={found} eager />
        </div>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ overflowWrap: 'anywhere' }}>{found.title}</h3>
          <p className="muted">{joinAuthors(found.authors) || 'Unknown author'}</p>
          {facts && <p className="small muted">{facts}</p>}
          {found.isbn13 && <p className="small muted">ISBN {found.isbn13}</p>}
        </div>
      </div>
      {list === 'readLog' && (
        <p className="small muted" style={{ marginTop: 12 }}>
          It will be logged as read today. You can change the dates, format and rating on the next screen.
        </p>
      )}
      <div className="stack" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-primary btn-block" onClick={onConfirm} disabled={busy}>
          {ADD_BUTTON[list]}
        </button>
        <button type="button" className="btn btn-block" onClick={onCancel}>
          Not this one
        </button>
      </div>
    </Sheet>
  );
}

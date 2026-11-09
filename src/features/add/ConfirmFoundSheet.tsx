// "Is this the book?" panel shown after a scan or search, before saving.
import type { BookList } from '../../data/models';
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
  const facts = [found.year, found.publisher, list === 'toBuy' ? 'Paperback' : found.format, found.pageCount && `${found.pageCount} pages`]
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
      <div className="stack" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-primary btn-block" onClick={onConfirm} disabled={busy}>
          {list === 'toBuy' ? 'Add to To Buy' : 'Add to My Library'}
        </button>
        <button type="button" className="btn btn-block" onClick={onCancel}>
          Not this one
        </button>
      </div>
    </Sheet>
  );
}

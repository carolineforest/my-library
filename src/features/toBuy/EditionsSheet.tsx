// "See Other Editions": browse formats/publishers/years and switch this book to one.
import { useEffect, useState } from 'react';
import type { Book, BookFormat } from '../../data/models';
import { findEditions, type FoundBook } from '../../services/bookLookup';
import { updateBook } from '../../data/repository';
import { Sheet } from '../../components/Sheet';
import { Cover } from '../../components/Cover';
import { showToast } from '../../components/Toast';

export function EditionsSheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const [editions, setEditions] = useState<FoundBook[]>();
  const [error, setError] = useState('');
  const [format, setFormat] = useState<BookFormat | 'all'>('all');

  useEffect(() => {
    findEditions(book)
      .then(setEditions)
      .catch((e: Error) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  const formats = [...new Set((editions ?? []).map((e) => e.format).filter((f): f is BookFormat => Boolean(f)))];
  const shown = (editions ?? [])
    .filter((e) => format === 'all' || e.format === format)
    // Editions with a cover and an ISBN are most useful, so list them first.
    .sort((a, b) => Number(Boolean(b.coverUrl && b.isbn13)) - Number(Boolean(a.coverUrl && a.isbn13)) || (b.year ?? 0) - (a.year ?? 0));

  async function choose(e: FoundBook) {
    await updateBook(book.id, {
      isbn13: e.isbn13,
      isbn10: e.isbn10,
      publisher: e.publisher ?? book.publisher,
      year: e.year ?? book.year,
      pageCount: e.pageCount ?? book.pageCount,
      format: e.format ?? book.format,
      coverUrl: e.coverUrl ?? book.coverUrl,
      originalCoverUrl: e.coverUrl ?? book.originalCoverUrl,
      openLibraryEditionKey: e.openLibraryEditionKey,
      googleVolumeId: e.googleVolumeId ?? book.googleVolumeId,
    });
    showToast('Edition switched');
    onClose();
  }

  return (
    <Sheet title="Other Editions" onClose={onClose}>
      {formats.length > 1 && (
        <div className="chips-scroll" style={{ marginBottom: 12 }}>
          {(['all', ...formats] as const).map((f) => (
            <button key={f} type="button" className="chip" aria-pressed={format === f} onClick={() => setFormat(f)}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      )}
      {!editions && !error && <p className="muted center">Looking for editions…</p>}
      {error && <p className="notice">{error}</p>}
      {editions && shown.length === 0 && <p className="muted center">No other editions found online.</p>}
      <ul className="book-list">
        {shown.map((e) => {
          const current = Boolean(e.isbn13 && e.isbn13 === book.isbn13);
          return (
            <li key={e.key}>
              <button type="button" className="book-row" onClick={() => choose(e)} aria-current={current || undefined}>
                <Cover book={e} />
                <div className="book-row-body">
                  <div className="book-row-title">
                    {e.format ?? 'Format unknown'}
                    {current && <span className="badge badge-accent" style={{ marginLeft: 6 }}>Current</span>}
                  </div>
                  <div className="book-row-sub">{[e.publisher, e.year].filter(Boolean).join(' · ') || e.title}</div>
                  {e.isbn13 && <div className="book-row-sub">ISBN {e.isbn13}</div>}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Sheet>
  );
}

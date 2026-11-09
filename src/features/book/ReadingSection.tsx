// Reading info on a book's page: status, stars, each read's dates, and notes.
import { useEffect, useState } from 'react';
import type { Book, ReadEntry, ReadingStatus } from '../../data/models';
import { updateBook } from '../../data/repository';
import { applyStatus, newRead } from '../../data/reading';
import { Stars } from '../../components/Stars';
import { Icon } from '../../components/Icon';
import { today } from '../../utils/dates';

const STATUSES: { value: ReadingStatus; label: string }[] = [
  { value: 'want', label: 'Want to Read' },
  { value: 'reading', label: 'Reading' },
  { value: 'read', label: 'Read' },
];

export function ReadingSection({ book }: { book: Book }) {
  const [notes, setNotes] = useState(book.notes ?? '');
  useEffect(() => setNotes(book.notes ?? ''), [book.id, book.notes]);

  const setStatus = (s: ReadingStatus) =>
    // Tapping the current status again clears it.
    updateBook(book.id, s === book.status ? { status: 'none' } : applyStatus(book, s, today()));

  const setReads = (reads: ReadEntry[]) => updateBook(book.id, { reads });
  const changeRead = (id: string, patch: Partial<ReadEntry>) =>
    setReads(book.reads.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <section className="section card" aria-labelledby="reading-title">
      <h2 id="reading-title" className="section-title">
        Reading
      </h2>
      <div className="segmented" role="group" aria-label="Reading status">
        {STATUSES.map((s) => (
          <button key={s.value} type="button" aria-pressed={book.status === s.value} onClick={() => setStatus(s.value)}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="row" style={{ marginTop: 12, justifyContent: 'center' }}>
        <Stars value={book.rating} onChange={(rating) => updateBook(book.id, { rating })} />
      </div>

      {book.reads.length > 0 && (
        <ul className="history" aria-label="Reads" style={{ marginTop: 8 }}>
          {book.reads.map((r, i) => (
            <li key={r.id} style={{ flexWrap: 'wrap' }}>
              <strong style={{ width: '100%' }}>
                {book.reads.length > 1 ? `Read ${i + 1}` : 'Dates'}
              </strong>
              <label className="field" style={{ flex: 1, margin: 0 }}>
                <span className="field-label">Started</span>
                <input className="input" type="date" value={r.started ?? ''} onChange={(e) => changeRead(r.id, { started: e.target.value || undefined })} />
              </label>
              <label className="field" style={{ flex: 1, margin: 0 }}>
                <span className="field-label">Finished</span>
                <input className="input" type="date" value={r.finished ?? ''} onChange={(e) => changeRead(r.id, { finished: e.target.value || undefined })} />
              </label>
              <button
                type="button"
                className="icon-btn"
                style={{ alignSelf: 'flex-end' }}
                aria-label={`Remove read ${i + 1}`}
                onClick={() => setReads(book.reads.filter((x) => x.id !== r.id))}
              >
                <Icon name="trash" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        style={{ marginTop: 6 }}
        onClick={() =>
          updateBook(book.id, {
            reads: [...book.reads, newRead({ started: today() })],
            status: 'reading',
          })
        }
      >
        <Icon name="plus" /> {book.reads.length ? 'Log another read' : 'Log a read'}
      </button>

      <div className="field" style={{ marginTop: 12 }}>
        <label className="field-label" htmlFor="notes">
          My notes
        </label>
        <textarea
          id="notes"
          className="textarea"
          value={notes}
          placeholder="Thoughts, quotes, review…"
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (book.notes ?? '') && updateBook(book.id, { notes: notes.trim() || undefined })}
        />
      </div>
    </section>
  );
}

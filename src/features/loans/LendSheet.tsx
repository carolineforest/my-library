// Panels for lending a book ("Loan") and getting it back ("Return to Shelf").
import { useState } from 'react';
import type { Book, Loan } from '../../data/models';
import { lendBook, returnBook } from '../../data/repository';
import { usePeopleNames } from '../../data/hooks';
import { Sheet } from '../../components/Sheet';
import { SuggestInput } from '../../components/SuggestInput';
import { showToast } from '../../components/Toast';
import { formatDate, today } from '../../utils/dates';

export function LendSheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const names = usePeopleNames();
  const [person, setPerson] = useState('');
  const [date, setDate] = useState(today());
  const [error, setError] = useState('');

  async function save() {
    if (!person.trim()) {
      setError('Type who you are lending it to.');
      return;
    }
    try {
      await lendBook(book.id, person, date || today());
      showToast(`Lent to ${person.trim()}`);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <Sheet title={`Lend “${book.title}”`} onClose={onClose}>
      <form
        className="stack"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <SuggestInput label="Lending to" value={person} onChange={setPerson} suggestions={names} placeholder="Name" autoFocus />
        <div className="field">
          <label className="field-label" htmlFor="lent-date">
            Date lent
          </label>
          <input id="lent-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {error && (
          <p role="alert" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-secondary btn-block">
          Lend Book
        </button>
      </form>
    </Sheet>
  );
}

export function ReturnSheet({ book, loan, onClose }: { book: Book; loan: Loan; onClose: () => void }) {
  const [date, setDate] = useState(today());
  return (
    <Sheet title="Return to Shelf" onClose={onClose}>
      <p>
        “{book.title}” has been with <strong>{loan.person}</strong> since {formatDate(loan.lentDate)}.
      </p>
      <div className="field">
        <label className="field-label" htmlFor="ret-date">
          Date returned
        </label>
        <input id="ret-date" className="input" type="date" value={date} min={loan.lentDate} onChange={(e) => setDate(e.target.value)} />
      </div>
      <button
        type="button"
        className="btn btn-secondary btn-block"
        style={{ marginTop: 16 }}
        onClick={async () => {
          await returnBook(loan.id, date || today());
          showToast('Back on the shelf');
          onClose();
        }}
      >
        Return to Shelf
      </button>
    </Sheet>
  );
}

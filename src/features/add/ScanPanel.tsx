// "Scan" tab of Add a Book: camera scanner plus a box to type an ISBN.
import { lazy, Suspense, useState } from 'react';
import { lookupIsbn, type FoundBook } from '../../services/bookLookup';
import { Icon } from '../../components/Icon';
import { looksLikeIsbn } from '../../utils/isbn';

// The barcode library is big, so it only loads when the Scan tab is opened.
const BarcodeScanner = lazy(() => import('../scan/BarcodeScanner').then((m) => ({ default: m.BarcodeScanner })));

interface Props {
  /** Called with the found book so the screen can confirm and save it. */
  onFound: (found: FoundBook) => void;
  /** Nothing found online: offer manual entry with the ISBN filled in. */
  onNotFound: (isbn: string) => void;
  paused: boolean;
}

export function ScanPanel({ onFound, onNotFound, paused }: Props) {
  const [typed, setTyped] = useState('');
  const [status, setStatus] = useState<{ busy: boolean; message?: string; isbn?: string }>({ busy: false });

  async function look(isbn: string) {
    setStatus({ busy: true, message: `Looking up ${isbn}…` });
    try {
      const found = await lookupIsbn(isbn);
      if (found) {
        setStatus({ busy: false });
        onFound(found);
      } else {
        setStatus({ busy: false, message: `No book found online for ISBN ${isbn}.`, isbn });
      }
    } catch (e) {
      setStatus({ busy: false, message: (e as Error).message });
    }
  }

  return (
    <div className="stack">
      <Suspense fallback={<div className="scanner" aria-busy="true" />}>
        <BarcodeScanner onIsbn={look} paused={paused || status.busy} />
      </Suspense>
      {status.message && (
        <div className="notice" role="status">
          <Icon name="info" />
          <div>
            {status.message}
            {status.isbn && (
              <div style={{ marginTop: 8 }}>
                <button type="button" className="btn btn-sm btn-soft" onClick={() => onNotFound(status.isbn!)}>
                  Type in the details instead
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          if (looksLikeIsbn(typed)) look(typed);
          else setStatus({ busy: false, message: 'That doesn’t look like an ISBN. It has 10 or 13 digits.' });
        }}
      >
        <input
          className="input"
          inputMode="numeric"
          placeholder="Or type the ISBN"
          aria-label="ISBN"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={!typed.trim() || status.busy}>
          Look up
        </button>
      </form>
    </div>
  );
}

// "Add a book" screen with three ways to add: Scan, Search, or type it in.
// `list` decides where the book goes: My Library ("owned"), To Buy, or the Reading Log.
import { useState } from 'react';
import { LIST_HOME, type BookList } from '../../data/models';
import { ADD_BUTTON, ADD_TITLE, DEFAULT_FORMAT } from './labels';
import type { FoundBook } from '../../services/bookLookup';
import { goBack, navigate } from '../../app/router';
import { Icon } from '../../components/Icon';
import { showToast } from '../../components/Toast';
import { BookForm } from '../book/BookForm';
import { useDuplicateGuard } from './useDuplicateGuard';
import { saveNewBook } from './saveBook';
import { foundToNewBook, readToday } from './foundToBook';
import { ConfirmFoundSheet } from './ConfirmFoundSheet';
import { ScanPanel } from './ScanPanel';
import { SearchPanel } from './SearchPanel';

type Mode = 'scan' | 'search' | 'manual';

export function AddBookScreen({ list, mode: modeParam, isbn }: { list: BookList; mode?: string; isbn?: string }) {
  // Reading Log books are often ebooks (no barcode), so that list starts on Search.
  const fallbackMode: Mode = list === 'readLog' ? 'search' : 'scan';
  const mode: Mode = modeParam === 'manual' || modeParam === 'search' || modeParam === 'scan' ? modeParam : fallbackMode;
  const { guard, dialog } = useDuplicateGuard();
  const [found, setFound] = useState<FoundBook>();
  const backTo = LIST_HOME[list];
  const switchTo = (m: Mode, extra = '') => navigate(`/add?list=${list}&mode=${m}${extra}`, { replace: true });

  function confirmFound() {
    if (!found) return;
    const f = found;
    setFound(undefined);
    guard(f, list, async () => {
      const book = await saveNewBook(foundToNewBook(f, list));
      showToast(`Added “${book.title}”`);
      // While scanning, stay on the scanner so I can scan the next book.
      if (mode !== 'scan') navigate('/book/' + book.id, { replace: true });
    });
  }

  return (
    <div className="page">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => goBack(backTo)} aria-label="Back">
          <Icon name="back" />
        </button>
        <h1>{ADD_TITLE[list]}</h1>
      </header>

      {list === 'readLog' && (
        <p className="small muted" style={{ marginTop: -4 }}>
          For books you read but don't own as a physical copy (ebooks, audiobooks, borrowed books). They count in your
          Stats but don't appear in My Library.
        </p>
      )}

      <div className="segmented" role="group" aria-label="How to add" style={{ marginBottom: 20 }}>
        {(['scan', 'search', 'manual'] as Mode[]).map((m) => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchTo(m)}>
            {m === 'scan' ? 'Scan' : m === 'search' ? 'Search' : 'Type it in'}
          </button>
        ))}
      </div>

      {mode === 'scan' && (
        <ScanPanel
          onFound={setFound}
          onNotFound={(code) => switchTo('manual', `&isbn=${code}`)}
          paused={Boolean(found || dialog)}
        />
      )}
      {mode === 'search' && <SearchPanel onPick={setFound} />}
      {mode === 'manual' && (
        <BookForm
          key={isbn}
          allowCoverUpload
          showShelving={list === 'owned'}
          initial={{ format: DEFAULT_FORMAT[list], isbn13: isbn }}
          submitLabel={ADD_BUTTON[list]}
          onSubmit={({ fields, coverFile }) =>
            guard(fields, list, async () => {
              const book = await saveNewBook({ ...fields, list, ...(list === 'readLog' ? readToday() : {}) }, coverFile);
              showToast(`Added “${book.title}”`);
              navigate('/book/' + book.id, { replace: true });
            })
          }
        />
      )}

      {found && <ConfirmFoundSheet found={found} list={list} onConfirm={confirmFound} onCancel={() => setFound(undefined)} />}
      {dialog}
    </div>
  );
}

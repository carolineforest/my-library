// "Add a book" screen with three ways to add: Scan, Search, or type it in.
// `list` decides where the book goes: My Library ("owned") or To Buy.
import { useState } from 'react';
import type { BookList } from '../../data/models';
import type { FoundBook } from '../../services/bookLookup';
import { goBack, navigate } from '../../app/router';
import { Icon } from '../../components/Icon';
import { showToast } from '../../components/Toast';
import { BookForm } from '../book/BookForm';
import { useDuplicateGuard } from './useDuplicateGuard';
import { saveNewBook } from './saveBook';
import { foundToNewBook } from './foundToBook';
import { ConfirmFoundSheet } from './ConfirmFoundSheet';
import { ScanPanel } from './ScanPanel';
import { SearchPanel } from './SearchPanel';

type Mode = 'scan' | 'search' | 'manual';

export function AddBookScreen({ list, mode: modeParam, isbn }: { list: BookList; mode?: string; isbn?: string }) {
  const mode: Mode = modeParam === 'manual' || modeParam === 'search' ? modeParam : 'scan';
  const { guard, dialog } = useDuplicateGuard();
  const [found, setFound] = useState<FoundBook>();
  const backTo = list === 'toBuy' ? '/tobuy' : '/library';
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
        <h1>{list === 'toBuy' ? 'Add to To Buy' : 'Add a Book'}</h1>
      </header>

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
          initial={{ format: 'Paperback', isbn13: isbn }}
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

      {found && <ConfirmFoundSheet found={found} list={list} onConfirm={confirmFound} onCancel={() => setFound(undefined)} />}
      {dialog}
    </div>
  );
}

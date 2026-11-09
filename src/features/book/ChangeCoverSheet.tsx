// "Change Cover": shows covers of other editions found online; tap one to use it.
import { useEffect, useState } from 'react';
import type { Book } from '../../data/models';
import { findCoverOptions } from '../../services/bookLookup';
import { deleteCoverImage, updateBook } from '../../data/repository';
import { Sheet } from '../../components/Sheet';
import { showToast } from '../../components/Toast';

export function ChangeCoverSheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const [options, setOptions] = useState<string[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    findCoverOptions(book)
      .then((urls) => alive && setOptions(urls))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
    // Only search once when the panel opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id]);

  async function choose(url: string | undefined) {
    // Picking an online cover replaces an uploaded photo.
    if (book.customCoverId) await deleteCoverImage(book.customCoverId);
    await updateBook(book.id, { coverUrl: url, customCoverId: undefined });
    showToast(url === book.originalCoverUrl ? 'Original cover restored' : 'Cover changed');
    onClose();
  }

  const canReset = Boolean(book.originalCoverUrl) && book.coverUrl !== book.originalCoverUrl;

  return (
    <Sheet title="Change Cover" onClose={onClose}>
      {book.customCoverId && <p className="small muted">Choosing a cover here will replace the photo you added.</p>}
      {canReset && (
        <button type="button" className="btn btn-soft btn-block" style={{ marginBottom: 16 }} onClick={() => choose(book.originalCoverUrl)}>
          Reset to original cover
        </button>
      )}
      {!options && !error && <p className="muted center">Looking for covers…</p>}
      {error && <p className="notice">{error}</p>}
      {options && <CoverChoices urls={options} current={book.coverUrl} onPick={choose} />}
    </Sheet>
  );
}

/** Grid of cover images; hides any that fail to load or are blank. */
function CoverChoices({ urls, current, onPick }: { urls: string[]; current?: string; onPick: (u: string) => void }) {
  const [broken, setBroken] = useState<Set<string>>(new Set());
  const visible = urls.filter((u) => !broken.has(u));
  const hide = (u: string) => setBroken((s) => new Set(s).add(u));
  if (visible.length === 0) return <p className="muted center">No other covers found online for this book.</p>;
  return (
    <div className="cover-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))' }}>
      {visible.map((u) => (
        <button
          key={u}
          type="button"
          className="grid-item"
          onClick={() => onPick(u)}
          aria-label={u === current ? 'Current cover' : 'Use this cover'}
          aria-pressed={u === current}
        >
          <div className="cover" style={u === current ? { outline: '3px solid var(--color-accent)', outlineOffset: 3 } : undefined}>
            <img
              src={u}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => hide(u)}
              onLoad={(e) => e.currentTarget.naturalWidth < 5 && hide(u)}
            />
          </div>
        </button>
      ))}
    </div>
  );
}

// Shows a book cover. Order of preference: a photo I uploaded, then the online
// cover, then a generated "cloth-bound" placeholder with the title.
import { useEffect, useState } from 'react';
import type { Book } from '../data/models';
import { useCoverImageUrl } from '../data/hooks';
import { joinAuthors } from '../utils/text';

// Placeholder colors: muted cloth-binding tones that sit well with the theme.
const CLOTH = ['#8c4a2f', '#3f6b5c', '#5b4a7a', '#7a5b2e', '#2f5470', '#7a3b4a', '#4f6b3a'];

function pickColor(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return CLOTH[h % CLOTH.length];
}

interface CoverProps {
  book: Pick<Book, 'title' | 'authors' | 'coverUrl' | 'customCoverId'>;
  /** Optional badge text shown across the bottom, e.g. "On Loan to Sam". */
  badge?: string;
  badgeClass?: string;
  /** Load the image right away instead of when scrolled into view. */
  eager?: boolean;
}

/** If a cover failed (e.g. the service was busy), drop the saved copy so it's retried later. */
function forgetCachedCover(url: string) {
  if (typeof caches === 'undefined' || url.startsWith('blob:')) return;
  caches.open('book-covers').then((c) => c.delete(url)).catch(() => {});
}

export function Cover({ book, badge, badgeClass = 'badge-loan', eager }: CoverProps) {
  const customUrl = useCoverImageUrl(book.customCoverId);
  const src = customUrl ?? book.coverUrl;
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  return (
    <div className="cover-wrap">
      <div className="cover">
        {src && !failed ? (
          <img
            src={src}
            alt=""
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => {
              setFailed(true);
              forgetCachedCover(src);
            }}
            onLoad={(e) => {
              // Some services send a tiny 1x1 image when they have no cover.
              if (e.currentTarget.naturalWidth < 5) setFailed(true);
            }}
          />
        ) : (
          <div className="cover-placeholder" style={{ background: pickColor(book.title) }} aria-hidden>
            <span className="ph-title">{book.title}</span>
            <span className="ph-author">{joinAuthors(book.authors)}</span>
          </div>
        )}
      </div>
      {badge && <span className={`badge cover-badge ${badgeClass}`}>{badge}</span>}
    </div>
  );
}

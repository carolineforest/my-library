// Buttons shown on a To Buy book's page.
import { useState } from 'react';
import type { Book } from '../../data/models';
import { Icon } from '../../components/Icon';
import { PriceSheet } from './PriceSheet';
import { EditionsSheet } from './EditionsSheet';
import { buyNow } from './BoughtSheet';

type Panel = 'prices' | 'editions' | null;

interface Props {
  book: Book;
  onChangeCover: () => void;
  /** Called after the book moved to My Library (the page then asks for location/tags). */
  onBought: () => void;
}

export function ToBuyActions({ book, onChangeCover, onBought }: Props) {
  const [panel, setPanel] = useState<Panel>(null);
  return (
    <>
      <div className="stack section">
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={async () => {
            await buyNow(book);
            onBought();
          }}
        >
          <Icon name="check" /> I Bought It
        </button>
        <div className="book-actions">
          <button type="button" className="btn btn-secondary" onClick={() => setPanel('prices')}>
            <Icon name="bag" /> Compare Prices
          </button>
          <button type="button" className="btn" onClick={() => setPanel('editions')}>
            <Icon name="swap" /> Other Editions
          </button>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onChangeCover}>
          <Icon name="image" /> Change Cover
        </button>
      </div>
      {panel === 'prices' && <PriceSheet book={book} onClose={() => setPanel(null)} />}
      {panel === 'editions' && <EditionsSheet book={book} onClose={() => setPanel(null)} />}
    </>
  );
}

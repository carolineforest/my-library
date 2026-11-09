// "Compare Prices": store links (always), plus live prices once a provider is connected.
import { useEffect, useState } from 'react';
import type { Book } from '../../data/models';
import { storeLinks } from '../../services/prices/storeLinks';
import { priceProvider, sortOffers, type PriceOffer } from '../../services/prices/PriceProvider';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';

export function PriceSheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const links = storeLinks(book);
  return (
    <Sheet title="Compare Prices" onClose={onClose}>
      {priceProvider.isAvailable && <LivePrices book={book} />}
      <p className="small muted">
        {book.isbn13 || book.isbn10
          ? `Each store opens a search for ISBN ${book.isbn13 ?? book.isbn10} (${book.format}).`
          : 'This book has no ISBN, so stores will search by title and author.'}
      </p>
      <ul className="book-list">
        {links.map((l) => (
          <li key={l.name}>
            <a className="book-row" href={l.url} target="_blank" rel="noopener noreferrer">
              <div className="book-row-body">
                <div className="book-row-title">{l.name}</div>
              </div>
              <Icon name="external" />
            </a>
          </li>
        ))}
      </ul>
    </Sheet>
  );
}

function LivePrices({ book }: { book: Book }) {
  const [offers, setOffers] = useState<PriceOffer[]>();
  const [error, setError] = useState('');
  useEffect(() => {
    priceProvider
      .getPrices(book)
      .then((o) => setOffers(sortOffers(o)))
      .catch(() => setError('Live prices are unavailable right now.'));
  }, [book]);
  const money = (n: number, c: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency: c }).format(n);
  return (
    <section style={{ marginBottom: 16 }}>
      <h3 className="section-title">Prices</h3>
      {error && <p className="muted">{error}</p>}
      {!offers && !error && <p className="muted">Loading prices…</p>}
      {offers && (
        <ul className="history">
          {offers.map((o, i) => (
            <li key={i}>
              <a href={o.url} target="_blank" rel="noopener noreferrer" style={{ flex: 1 }}>
                {o.store}
              </a>
              <span className="badge">{o.condition === 'new' ? 'New' : 'Used'}</span>
              <span>
                <strong>{money(o.price, o.currency)}</strong>
                <span className="muted">
                  {o.shipping === undefined ? '' : o.shipping === 0 ? ' + free shipping' : ` + ${money(o.shipping, o.currency)} shipping`}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="small muted">Prices from {priceProvider.name}</p>
    </section>
  );
}

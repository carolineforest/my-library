import { describe, expect, it } from 'vitest';
import { storeLinks } from './storeLinks';
import { sortOffers } from './PriceProvider';

describe('prices', () => {
  it('builds ISBN links for all six stores', () => {
    const links = storeLinks({ title: 'Dune', authors: ['Frank Herbert'], isbn13: '9780441013593' });
    expect(links.map((l) => l.name)).toEqual(['Amazon', 'Bookshop.org', 'Barnes & Noble', 'ThriftBooks', 'AbeBooks', 'BookFinder.com']);
    expect(links.every((l) => l.url.includes('9780441013593'))).toBe(true);
  });
  it('falls back to title + author', () => {
    expect(storeLinks({ title: 'Dune', authors: ['Frank Herbert'] })[0].url).toContain('Dune%20Frank%20Herbert');
  });
  it('sorts offers cheapest first including shipping', () => {
    const o = sortOffers([
      { store: 'A', price: 10, currency: 'USD', condition: 'new', shipping: 5, url: '' },
      { store: 'B', price: 12, currency: 'USD', condition: 'used', shipping: 0, url: '' },
    ]);
    expect(o[0].store).toBe('B');
  });
});

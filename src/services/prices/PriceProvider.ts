// "Compare Prices" layer 2 (prepared, not switched on yet): live prices.
//
// HOW TO FINISH LATER
// 1. Pick a price service with an official API (no web scraping).
// 2. Put its secret API key in a small serverless function (e.g. Cloudflare
//    Worker or Netlify Function) — NEVER in this app, because the site is public.
// 3. Write a provider like the example at the bottom that calls that function,
//    and set `priceProvider` to it. The Compare Prices panel then shows the
//    prices automatically, cheapest first.

export interface PriceOffer {
  store: string;
  /** Price of the book itself. */
  price: number;
  currency: string; // e.g. "USD"
  condition: 'new' | 'used';
  /** Shipping cost if known (undefined = unknown, 0 = free). */
  shipping?: number;
  url: string;
}

export interface PriceQuery {
  title: string;
  authors: string[];
  isbn13?: string;
  isbn10?: string;
}

export interface PriceProvider {
  /** Shown under the prices, e.g. "Prices from ExampleService". */
  name: string;
  /** False = not set up, so the app hides the live prices area. */
  isAvailable: boolean;
  getPrices(book: PriceQuery): Promise<PriceOffer[]>;
}

/** Placeholder used until a real price service is connected. */
export const noPriceProvider: PriceProvider = {
  name: 'Not connected',
  isAvailable: false,
  async getPrices() {
    return [];
  },
};

/** The provider the app uses. Swap this when a live service is ready. */
export const priceProvider: PriceProvider = noPriceProvider;

/** Cheapest first, counting shipping when it's known. */
export function sortOffers(offers: PriceOffer[]): PriceOffer[] {
  const total = (o: PriceOffer) => o.price + (o.shipping ?? 0);
  return [...offers].sort((a, b) => total(a) - total(b));
}

/* Example for later (the URL is your own serverless function, which holds the key):

export const serverlessPriceProvider: PriceProvider = {
  name: 'ExampleService',
  isAvailable: true,
  async getPrices(book) {
    const res = await fetch(`https://my-price-proxy.example.workers.dev/prices?isbn=${book.isbn13}`);
    if (!res.ok) throw new Error('Could not load prices');
    return (await res.json()) as PriceOffer[];
  },
};
*/

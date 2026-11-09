// "Compare Prices" layer 1: links that open each store's search for this exact book.
// Uses the ISBN when we have one (most exact), otherwise title + author.
// To add/remove a store, edit the STORES list.

export interface StoreLink {
  name: string;
  url: string;
}

interface BookRef {
  title: string;
  authors: string[];
  isbn13?: string;
  isbn10?: string;
}

const enc = encodeURIComponent;

const STORES: { name: string; byIsbn: (isbn: string) => string; byText: (q: string, title: string, author: string) => string }[] = [
  {
    name: 'Amazon',
    byIsbn: (i) => `https://www.amazon.com/s?k=${i}&i=stripbooks`,
    byText: (q) => `https://www.amazon.com/s?k=${enc(q)}&i=stripbooks`,
  },
  {
    name: 'Bookshop.org',
    byIsbn: (i) => `https://bookshop.org/search?keywords=${i}`,
    byText: (q) => `https://bookshop.org/search?keywords=${enc(q)}`,
  },
  {
    name: 'Barnes & Noble',
    byIsbn: (i) => `https://www.barnesandnoble.com/s/${i}`,
    byText: (q) => `https://www.barnesandnoble.com/s/${enc(q)}`,
  },
  {
    name: 'ThriftBooks',
    byIsbn: (i) => `https://www.thriftbooks.com/browse/?b.search=${i}`,
    byText: (q) => `https://www.thriftbooks.com/browse/?b.search=${enc(q)}`,
  },
  {
    name: 'AbeBooks',
    byIsbn: (i) => `https://www.abebooks.com/servlet/SearchResults?isbn=${i}`,
    byText: (_q, t, a) => `https://www.abebooks.com/servlet/SearchResults?tn=${enc(t)}&an=${enc(a)}`,
  },
  {
    name: 'BookFinder.com',
    byIsbn: (i) => `https://www.bookfinder.com/search/?isbn=${i}&mode=isbn&st=sr&ac=qr`,
    byText: (_q, t, a) => `https://www.bookfinder.com/search/?title=${enc(t)}&author=${enc(a)}&mode=basic&st=sr&ac=qr`,
  },
];

export function storeLinks(book: BookRef): StoreLink[] {
  const isbn = book.isbn13 ?? book.isbn10;
  const author = book.authors[0] ?? '';
  const q = `${book.title} ${author}`.trim();
  return STORES.map((s) => ({ name: s.name, url: isbn ? s.byIsbn(isbn) : s.byText(q, book.title, author) }));
}

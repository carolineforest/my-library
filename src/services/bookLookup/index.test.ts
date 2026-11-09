import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupIsbn, mergeFound, searchBooks } from './index';
import { docToFound } from './openLibrary';
import { googleCover } from './googleBooks';

// Fake network responses shaped like the real services.
const responses: Record<string, unknown> = {
  'https://openlibrary.org/isbn/9780261103573.json': {
    key: '/books/OL1M',
    title: 'The Hobbit',
    authors: [{ key: '/authors/OL26320A' }],
    publishers: ['HarperCollins'],
    publish_date: '1999',
    number_of_pages: 310,
    covers: [12345],
    works: [{ key: '/works/OL262758W' }],
    physical_format: 'Paperback',
    isbn_13: ['9780261103573'],
  },
  'https://openlibrary.org/authors/OL26320A.json': { name: 'J.R.R. Tolkien' },
  'https://openlibrary.org/works/OL262758W.json': { description: { value: 'A hobbit goes on an adventure.' } },
};

function mockFetch() {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const key = Object.keys(responses).find((k) => url === k);
      if (key) return new Response(JSON.stringify(responses[key]), { status: 200 });
      if (url.startsWith('https://www.googleapis.com')) return new Response(JSON.stringify({ items: [] }), { status: 200 });
      return new Response('not found', { status: 404 });
    }),
  );
}

afterEach(() => vi.unstubAllGlobals());

describe('book lookup', () => {
  it('looks up an ISBN on Open Library with authors and description', async () => {
    mockFetch();
    const b = await lookupIsbn('0261103571');
    expect(b?.title).toBe('The Hobbit');
    expect(b?.authors).toEqual(['J.R.R. Tolkien']);
    expect(b?.format).toBe('Paperback');
    expect(b?.year).toBe(1999);
    expect(b?.description).toContain('adventure');
    expect(b?.coverUrl).toBe('https://covers.openlibrary.org/b/id/12345-L.jpg');
    expect(b?.openLibraryWorkKey).toBe('/works/OL262758W');
  });

  it('returns nothing for an unknown ISBN', async () => {
    mockFetch();
    expect(await lookupIsbn('9780306406157')).toBeUndefined();
    expect(await searchBooks('9780306406157')).toEqual([]);
  });

  it('maps search docs', () => {
    const f = docToFound({ key: '/works/W1', title: 'Dune', author_name: ['Frank Herbert'], isbn: ['0441013597', '9780441013593'], cover_i: 9 });
    expect(f.isbn13).toBe('9780441013593');
    expect(f.coverUrl).toContain('/b/id/9-L.jpg');
  });

  it('merges gaps from the backup source', () => {
    const m = mergeFound(
      { key: 'a', source: 'openlibrary', title: 'X', authors: [], coverUrl: 'https://covers.openlibrary.org/b/isbn/1-L.jpg' },
      { key: 'b', source: 'google', title: 'Y', authors: ['Z'], coverUrl: 'https://g/c', pageCount: 10 },
    );
    expect(m.title).toBe('X');
    expect(m.authors).toEqual(['Z']);
    expect(m.coverUrl).toBe('https://g/c');
    expect(m.pageCount).toBe(10);
  });

  it('upgrades Google cover links', () => {
    expect(googleCover('http://books.google.com/x?id=1&zoom=1&edge=curl')).toBe('https://books.google.com/x?id=1&zoom=1&fife=w600');
  });
});

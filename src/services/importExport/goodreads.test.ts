import { describe, expect, it } from 'vitest';
import { parseCsv, toCsv } from './csv';
import { DEFAULT_IMPORT_OPTIONS, goodreadsRowToBook, parseGoodreadsCsv } from './goodreads';

// Shaped like a real Goodreads export.
const SAMPLE = `Book Id,Title,Author,Author l-f,Additional Authors,ISBN,ISBN13,My Rating,Average Rating,Publisher,Binding,Number of Pages,Year Published,Original Publication Year,Date Read,Date Added,Bookshelves,Bookshelves with positions,Exclusive Shelf,My Review,Spoiler,Private Notes,Read Count,Owned Copies
234225,"Dune (Dune, #1)",Frank Herbert,"Herbert, Frank",,"=""0441013597""","=""9780441013593""",5,4.27,Ace Books,Paperback,688,2005,1965,2021/03/14,2020/01/02,"sci-fi, favorites","sci-fi (#3), favorites (#1)",read,"Loved it.<br/>Spice!",,,1,0
5107,The Catcher in the Rye,J.D. Salinger,"Salinger, J.D.",,"=""""","=""""",0,3.8,"Little, Brown",Hardcover,277,2001,1951,,2022/05/05,to-read,to-read (#1),to-read,,,,0,0
`;

describe('csv', () => {
  it('round-trips quotes, commas and newlines', () => {
    const rows = [['a', 'b,c', 'say "hi"', 'line\nbreak']];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });
});

describe('goodreads import', () => {
  it('parses a Goodreads export', () => {
    const rows = parseGoodreadsCsv(SAMPLE);
    expect(rows).toHaveLength(2);
    const dune = rows[0];
    expect(dune.title).toBe('Dune (Dune, #1)');
    expect(dune.isbn13).toBe('9780441013593');
    expect(dune.rating).toBe(5);
    expect(dune.dateRead).toBe('2021-03-14');
    expect(dune.shelves).toEqual(['sci-fi', 'favorites']);
    expect(dune.review).toBe('Loved it.\nSpice!');
    expect(rows[1].isbn13).toBeUndefined();
    expect(rows[1].rating).toBeUndefined();
  });

  it('maps rows to books with the chosen options', () => {
    const [dune, catcher] = parseGoodreadsCsv(SAMPLE);
    const b = goodreadsRowToBook(dune, DEFAULT_IMPORT_OPTIONS);
    expect(b.list).toBe('owned');
    expect(b.status).toBe('read');
    expect(b.reads?.[0].finished).toBe('2021-03-14');
    expect(b.tags).toEqual(['Sci Fi', 'Favorites']);
    expect(goodreadsRowToBook(catcher, DEFAULT_IMPORT_OPTIONS).list).toBe('toBuy');
    const asOwned = goodreadsRowToBook(catcher, { ...DEFAULT_IMPORT_OPTIONS, toReadDestination: 'owned' });
    expect(asOwned.list).toBe('owned');
    expect(asOwned.status).toBe('want');
    expect(asOwned.format).toBe('Hardcover');
    const bare = goodreadsRowToBook(dune, { ...DEFAULT_IMPORT_OPTIONS, status: false, rating: false, notes: false, shelvesAsTags: false, dateRead: false });
    expect([bare.status, bare.rating, bare.notes, bare.tags, bare.reads]).toEqual(['none', undefined, undefined, [], []]);
  });

  it('rejects other CSV files with a helpful message', () => {
    expect(() => parseGoodreadsCsv('a,b\n1,2')).toThrow(/Goodreads/);
  });
});

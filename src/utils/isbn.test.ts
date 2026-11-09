import { describe, expect, it } from 'vitest';
import { isbn10to13, isbn13to10, normalizeIsbn } from './isbn';

describe('isbn', () => {
  it('converts between 10 and 13 digits', () => {
    expect(isbn10to13('0261103571')).toBe('9780261103573');
    expect(isbn13to10('9780261103573')).toBe('0261103571');
    expect(isbn13to10('9780306406157')).toBe('0306406152');
  });
  it('normalizes typed ISBNs with dashes', () => {
    expect(normalizeIsbn('978-0-261-10357-3')).toEqual({ isbn13: '9780261103573', isbn10: '0261103571' });
    expect(normalizeIsbn('080442957X').isbn13).toBe('9780804429573');
    expect(normalizeIsbn('12345')).toEqual({});
  });
});

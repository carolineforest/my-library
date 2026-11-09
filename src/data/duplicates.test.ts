import { describe, expect, it } from 'vitest';
import { isSameBook } from './duplicates';

describe('isSameBook', () => {
  it('matches by ISBN across 10/13 forms', () => {
    expect(isSameBook({ title: 'X', isbn10: '0261103571' }, { title: 'Y', isbn13: '9780261103573' })).toBe(true);
  });
  it('matches by title + author ignoring case, articles and subtitles', () => {
    expect(
      isSameBook(
        { title: 'The Hobbit: or There and Back Again', authors: ['J. R. R. Tolkien'] },
        { title: 'hobbit', authors: ['Tolkien, J.R.R.'] },
      ),
    ).toBe(true);
  });
  it('does not match different authors', () => {
    expect(isSameBook({ title: 'Collected Poems', authors: ['Larkin'] }, { title: 'Collected Poems', authors: ['Plath'] })).toBe(false);
  });
});

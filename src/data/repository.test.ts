import { beforeEach, describe, expect, it } from 'vitest';
import { db } from './db';
import * as repo from './repository';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('repository', () => {
  it('adds a book with defaults and finds duplicates', async () => {
    const b = await repo.addBook({ title: ' Dune ', authors: ['Frank Herbert'], list: 'owned', isbn13: '978-0441013593' });
    expect(b.title).toBe('Dune');
    expect(b.format).toBe('Paperback');
    expect(b.isbn13).toBe('9780441013593');
    expect(b.tags).toEqual([]);
    expect(await repo.findDuplicates({ title: 'Dune', authors: ['Herbert'] }, 'owned')).toHaveLength(1);
    expect(await repo.findDuplicates({ title: 'Dune', authors: ['Herbert'] }, 'toBuy')).toHaveLength(0);
  });

  it('lends and returns a book, and keeps history', async () => {
    const b = await repo.addBook({ title: 'Emma', list: 'owned' });
    const loan = await repo.lendBook(b.id, 'Sam ', '2024-01-02');
    await expect(repo.lendBook(b.id, 'Alex')).rejects.toThrow();
    expect(await repo.activeLoans()).toHaveLength(1);
    await repo.returnBook(loan.id, '2024-02-01');
    expect(await repo.activeLoans()).toHaveLength(0);
    await repo.lendBook(b.id, 'sam', '2024-03-01');
    expect(await repo.loansForBook(b.id)).toHaveLength(2);
    expect(await repo.listPeopleNames()).toEqual(['sam']);
  });

  it('lists, renames and deletes tags', async () => {
    await repo.addBook({ title: 'A', list: 'owned', tags: ['Fiction'] });
    await repo.createTag('Signed');
    expect(await repo.listTags()).toEqual(['Fiction', 'Signed']);
    await repo.renameTag('Fiction', 'Novels');
    expect(await repo.listTags()).toEqual(['Novels', 'Signed']);
    await repo.deleteTag('Novels');
    expect((await repo.listBooks())[0].tags).toEqual([]);
  });

  it('moves a To Buy book into the library', async () => {
    const b = await repo.addBook({ title: 'B', list: 'toBuy' });
    await repo.markBought(b.id, { location: 'Hall' });
    const after = await repo.getBook(b.id);
    expect(after?.list).toBe('owned');
    expect(after?.status).toBe('want');
    expect(after?.location).toBe('Hall');
  });

  it('deleting a book removes its loans', async () => {
    const b = await repo.addBook({ title: 'C', list: 'owned' });
    await repo.lendBook(b.id, 'Kim');
    await repo.deleteBook(b.id);
    expect(await repo.listLoans()).toHaveLength(0);
  });
});

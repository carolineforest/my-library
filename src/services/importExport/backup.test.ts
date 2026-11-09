// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { db } from '../../data/db';
import * as repo from '../../data/repository';
import { booksToCsv, createBackupFile, readBackupFile, restoreBackup } from './backup';

beforeEach(async () => {
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('backup', () => {
  it('exports everything and restores it exactly', async () => {
    const coverId = await repo.saveCoverImage(new Blob([new Uint8Array([1, 2, 3, 250])], { type: 'image/jpeg' }));
    const b = await repo.addBook({ title: 'Emma', list: 'owned', tags: ['Classics'], customCoverId: coverId, rating: 4 });
    await repo.addBook({ title: 'Wish', list: 'toBuy' });
    await repo.lendBook(b.id, 'Sam', '2024-01-01');
    await repo.setSetting('goal:2024', 12);

    const file = await createBackupFile();
    await Promise.all(db.tables.map((t) => t.clear()));
    expect(await repo.listBooks()).toHaveLength(0);

    const { data } = await readBackupFile(file);
    await restoreBackup(data);
    expect(await repo.listBooks()).toHaveLength(2);
    expect((await repo.getBook(b.id))?.rating).toBe(4);
    expect(await repo.activeLoans()).toHaveLength(1);
    expect(await repo.getSetting('goal:2024', 0)).toBe(12);
    const blob = await repo.getCoverImage(coverId);
    expect(new Uint8Array(await blob!.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3, 250]));
  });

  it('rejects files that are not backups', async () => {
    await expect(readBackupFile(new File(['{"hello":1}'], 'x.json'))).rejects.toThrow(/backup/);
    await expect(readBackupFile(new File(['not json'], 'x.json'))).rejects.toThrow(/backup/);
  });

  it('makes a CSV with a header row', () => {
    const csv = booksToCsv([repo.buildBook({ title: 'A, B', list: 'owned' })], []);
    expect(csv).toContain('List,Title,Authors');
    expect(csv).toContain('"A, B"');
  });
});

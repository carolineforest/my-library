// Backup file = the whole library (books, to-buy, loans, reading data, tags,
// settings, uploaded cover photos) as one JSON file. Also a CSV for spreadsheets.
import { exportAllData, replaceAllData, setSetting, type AllData } from '../../data/repository';
import { LIST_LABELS, type Book, type CoverImage, type Loan } from '../../data/models';
import { lastFinished } from '../../data/reading';
import { toCsv } from './csv';
import { today } from '../../utils/dates';

const FORMAT = 'my-library-backup';
const FORMAT_VERSION = 1;

interface BackupFile {
  format: typeof FORMAT;
  version: number;
  exportedAt: string;
  data: Omit<AllData, 'covers'> & { covers: { id: string; type: string; base64: string }[] };
}

export class BackupError extends Error {}

export async function createBackupFile(): Promise<File> {
  const all = await exportAllData();
  const backup: BackupFile = {
    format: FORMAT,
    version: FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    data: { ...all, covers: await Promise.all(all.covers.map(encodeCover)) },
  };
  return new File([JSON.stringify(backup)], `my-library-backup-${today()}.json`, { type: 'application/json' });
}

/** Read a backup file and check it before anything is changed. */
export async function readBackupFile(file: File): Promise<{ data: AllData; exportedAt: string }> {
  let parsed: BackupFile;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new BackupError("This file isn't a My Library backup (it couldn't be read).");
  }
  if (parsed?.format !== FORMAT || !parsed.data || !Array.isArray(parsed.data.books)) {
    throw new BackupError("This file isn't a My Library backup.");
  }
  if (parsed.version > FORMAT_VERSION) {
    throw new BackupError('This backup was made by a newer version of the app. Refresh the app and try again.');
  }
  const d = parsed.data;
  return {
    exportedAt: parsed.exportedAt,
    data: {
      books: d.books,
      loans: d.loans ?? [],
      tags: d.tags ?? [],
      settings: d.settings ?? [],
      covers: (d.covers ?? []).map(decodeCover),
    },
  };
}

export async function restoreBackup(data: AllData): Promise<void> {
  await replaceAllData(data);
}

export async function markBackedUp(): Promise<void> {
  await setSetting('lastBackup', new Date().toISOString());
}

// ----- CSV (for spreadsheets; not for restoring) -----

export async function createCsvFile(): Promise<File> {
  const { books, loans } = await exportAllData();
  return new File([booksToCsv(books, loans)], `my-library-${today()}.csv`, { type: 'text/csv' });
}

export function booksToCsv(books: Book[], loans: Loan[]): string {
  const openLoan = new Map(loans.filter((l) => !l.returnedDate).map((l) => [l.bookId, l]));
  const header = [
    'List', 'Title', 'Authors', 'ISBN13', 'ISBN10', 'Publisher', 'Year', 'Pages', 'Format', 'Status', 'Rating',
    'Date Read', 'Times Read', 'Location', 'Shelves', 'On Loan To', 'Lent Date', 'Notes', 'Date Added',
  ];
  const rows = books.map((b) => {
    const loan = openLoan.get(b.id);
    return [
      LIST_LABELS[b.list],
      b.title, b.authors.join('; '), b.isbn13, b.isbn10, b.publisher, b.year, b.pageCount, b.format,
      b.status === 'none' ? '' : b.status, b.rating, lastFinished(b), b.reads.filter((r) => r.finished).length || '',
      b.location, b.tags.join('; '), loan?.person, loan?.lentDate, b.notes, b.dateAdded.slice(0, 10),
    ];
  });
  return '﻿' + toCsv([header, ...rows]); // ﻿ helps Excel read accents correctly
}

// ----- Saving a file on iPhone -----

/**
 * Opens the iPhone share sheet ("Save to Files", AirDrop, Mail...) or, where
 * that's not available (computers), downloads the file. Must be called
 * directly from a tap. Returns false if I cancelled the share sheet.
 */
export async function saveFile(file: File): Promise<boolean> {
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return true;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return false;
      // fall through to download
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return true;
}

// ----- helpers -----

async function encodeCover(c: CoverImage) {
  const buf = new Uint8Array(await c.blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
  return { id: c.id, type: c.blob.type || 'image/jpeg', base64: btoa(bin) };
}

function decodeCover(c: { id: string; type: string; base64: string }): CoverImage {
  const bin = atob(c.base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { id: c.id, blob: new Blob([bytes], { type: c.type }) };
}

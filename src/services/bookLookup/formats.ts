// Turns the catalogs' format text ("Mass Market Paperback", "hardback") into our formats.
import type { BookFormat } from '../../data/models';

export function toFormat(text?: string): BookFormat | undefined {
  const t = (text ?? '').toLowerCase();
  if (!t) return undefined;
  if (t.includes('mass market')) return 'Mass Market Paperback';
  if (t.includes('trade')) return 'Trade Paperback';
  if (t.includes('paper') || t.includes('soft')) return 'Paperback';
  if (t.includes('hard') || t.includes('cloth') || t.includes('library binding')) return 'Hardcover';
  if (t.includes('ebook') || t.includes('e-book') || t.includes('kindle') || t.includes('electronic')) return 'Ebook';
  if (t.includes('audio') || t.includes('cd')) return 'Audiobook';
  return 'Other';
}

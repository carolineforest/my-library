// Google Books: used as a backup when Open Library has nothing or is down.
// Works without a key (with a shared daily limit), allows requests from browsers.
import type { FoundBook } from './types';
import { getJson, parseYear } from './http';
import { normalizeIsbn } from '../../utils/isbn';

const GB = 'https://www.googleapis.com/books/v1/volumes';

interface Volume {
  id: string;
  volumeInfo: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string; smallThumbnail?: string };
  };
}

/** Google's thumbnails are tiny; ask for a bigger version over https. */
export function googleCover(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/^http:/, 'https:').replace('&edge=curl', '') + '&fife=w600';
}

export function volumeToFound(v: Volume): FoundBook | undefined {
  const i = v.volumeInfo;
  if (!i.title) return undefined;
  const id13 = i.industryIdentifiers?.find((x) => x.type === 'ISBN_13')?.identifier;
  const id10 = i.industryIdentifiers?.find((x) => x.type === 'ISBN_10')?.identifier;
  return {
    key: 'gb:' + v.id,
    source: 'google',
    title: i.subtitle ? `${i.title}: ${i.subtitle}` : i.title,
    authors: i.authors ?? [],
    ...normalizeIsbn(id13 ?? id10),
    publisher: i.publisher,
    year: parseYear(i.publishedDate),
    pageCount: i.pageCount || undefined,
    description: i.description?.replace(/<[^>]+>/g, ''),
    coverUrl: googleCover(i.imageLinks?.thumbnail ?? i.imageLinks?.smallThumbnail),
    googleVolumeId: v.id,
  };
}

export async function searchGoogleBooks(query: string, limit = 20): Promise<FoundBook[]> {
  const data = await getJson<{ items?: Volume[] }>(`${GB}?q=${encodeURIComponent(query)}&maxResults=${limit}&printType=books`);
  return (data.items ?? []).map(volumeToFound).filter((x): x is FoundBook => Boolean(x));
}

export async function lookupGoogleIsbn(isbn: string): Promise<FoundBook | undefined> {
  try {
    return (await searchGoogleBooks(`isbn:${isbn}`, 1))[0];
  } catch {
    return undefined;
  }
}

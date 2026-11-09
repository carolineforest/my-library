// Saves a new book, including an uploaded cover photo if there is one.
import type { Book, NewBook } from '../../data/models';
import { addBook, saveCoverImage } from '../../data/repository';

export async function saveNewBook(input: NewBook, coverFile?: Blob): Promise<Book> {
  const customCoverId = coverFile ? await saveCoverImage(coverFile) : undefined;
  return addBook({ ...input, customCoverId });
}

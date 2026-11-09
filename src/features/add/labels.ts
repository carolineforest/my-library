// Wording for the Add screens, per list (My Library, To Buy, Reading Log).
import type { BookList } from '../../data/models';

export const ADD_TITLE: Record<BookList, string> = {
  owned: 'Add a Book',
  toBuy: 'Add to To Buy',
  readLog: 'Log a Book I Read',
};

export const ADD_BUTTON: Record<BookList, string> = {
  owned: 'Add to My Library',
  toBuy: 'Add to To Buy',
  readLog: 'Add to Reading Log',
};

/** Format a new book starts with on each list. */
export const DEFAULT_FORMAT = { owned: 'Paperback', toBuy: 'Paperback', readLog: 'Ebook' } as const;

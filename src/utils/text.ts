// Small text helpers used for matching and sorting.

/** Lower-case, strip accents and punctuation: "The Hobbit!" -> "the hobbit". */
export function simplify(text: string | undefined): string {
  return (text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Title for matching: drops a leading "the/a/an" and any subtitle after ":". */
export function titleKey(title: string | undefined): string {
  const main = (title ?? '').split(/[:(]/)[0];
  return simplify(main).replace(/^(the|a|an) /, '');
}

/** Last word of the first author, good enough to match "J. R. R. Tolkien" with "Tolkien, J.R.R.". */
export function authorKey(authors: string[] | undefined): string {
  const first = authors?.[0] ?? '';
  const name = first.includes(',') ? first.split(',')[0] : first.split(' ').filter(Boolean).pop() ?? '';
  return simplify(name);
}

/** Sort key for titles: ignores a leading "The/A/An". */
export function titleSortKey(title: string): string {
  return simplify(title).replace(/^(the|a|an) /, '');
}

/** Author sort key: last name of first author. */
export function authorSortKey(authors: string[]): string {
  return authorKey(authors) + ' ' + simplify(authors[0]);
}

export function joinAuthors(authors: string[] | undefined): string {
  return (authors ?? []).filter(Boolean).join(', ');
}

/** Split "A, B & C" style author text (as typed in a form) into a list. */
export function splitAuthors(text: string): string[] {
  return text
    .split(/\s*(?:[,;&]| and )\s*/)
    .map((s) => s.trim())
    .filter(Boolean);
}

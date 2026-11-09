# My Library — guide for future sessions

## What this is
A personal app for tracking the owner's **physical books**: what they own, reading
progress (like Goodreads), loans to friends, and a To Buy list. It is a Progressive
Web App used from an **iPhone home screen** (Safari → Add to Home Screen). The owner is
not a developer: explain changes in plain language and give exact click-by-click steps
for anything they must do on GitHub or their phone.

## Tech
- Vite + React + TypeScript. Tests: Vitest (+ fake-indexeddb). Type check: `npm run typecheck`.
- All data lives **on the phone** in IndexedDB via Dexie. No server, no accounts.
- Hosted on **GitHub Pages**. `.github/workflows/deploy.yml` tests, builds and deploys on every push to `main`.
- `vite.config.ts` sets `base: '/my-library/'` (must equal the repo name) and the PWA
  (manifest, icons, service worker via vite-plugin-pwa, `registerType: 'prompt'`).
- Hash routing (`#/book/123`) in `src/app/router.ts` so refreshes never 404 on GitHub Pages.
- Few dependencies on purpose: react, react-dom, dexie, dexie-react-hooks (+ zxing for scanning).
  Ask the owner before adding anything large.

## Commands
- `npm run dev` — local dev server
- `npm test` — unit tests
- `npm run build` — type check + production build into `dist/`
- `npm run icons` — regenerate PNG icons from `public/favicon.svg` (needs Playwright)

## Folder structure
```
src/
  app/          App shell: router, tab bar, update prompt, screen switch (App.tsx)
  components/   Shared UI: Cover, Icon, Sheet (bottom panel), Stars, TagPicker, SuggestInput, Toast, EmptyState
  data/         models.ts (types), db.ts (Dexie schema), repository.ts (ALL data access),
                hooks.ts (live React hooks), duplicates.ts, reading.ts
  features/     One folder per screen/feature (library, book, add, ...)
  services/     Talking to the outside world / files: book lookup, covers, prices, import/export
  theme/        theme.css (ALL colors, fonts, sizes; light + dark) and global.css (shared classes)
  utils/        Small pure helpers (dates, isbn, text, ids)
```

## Data model (src/data/models.ts)
- **Book**: one record for both lists. `list: 'owned' | 'toBuy'`. Title, authors[], isbn13/isbn10,
  publisher, year, pageCount, format, description, `coverUrl` (current online cover),
  `originalCoverUrl` (for Reset Cover), `customCoverId` (uploaded photo in `covers` table),
  location, tags[], status (`none|want|reading|read`), rating 1–5, notes,
  `reads[]` ({started, finished} — one per read-through), Open Library/Google ids, dateAdded, updatedAt.
- **Loan**: bookId, person, personKey (normalized name), lentDate, returnedDate (missing = still out).
  "On loan" is derived from loans with no returnedDate; it is NOT stored on the book.
- **CoverImage**: uploaded cover photos (Blob), resized to ≤900px before saving.
- **Tag**: shelves created explicitly (tags used on books are listed too).
- **Setting**: key/value (e.g. `lastBackup`, reading goals).

## Rules for changing data storage (IMPORTANT)
- The owner's real books live on their phone. **Never** edit an existing `db.version(n)` block.
  Add `db.version(n+1)` with an `.upgrade()` that converts existing data.
- Warn the owner before any change that could affect saved data and remind them to Export Backup first.
- Screens must only use `repository.ts` / `hooks.ts`, never `db` directly, so a cloud sync
  could replace the storage later.

## Theme
`src/theme/theme.css`: CSS variables for the palette (warm paper background, terracotta accent
`--color-accent`, sage secondary `--color-secondary`), fonts (Fraunces headings, Inter body via Google
Fonts in `index.html`), radii, shadows. Dark mode overrides are in the same file.

## Book lookup (src/services/bookLookup)
- `index.ts` is the only entry point screens use: `lookupIsbn`, `searchBooks`, `findEditions`, `findCoverOptions`.
- Open Library first (isbn/{isbn}.json + author + work fetches; search.json; works/{key}/editions.json),
  Google Books (no key) as fallback / gap filler. Results share the `FoundBook` shape (types.ts).
- Barcode scanning: `features/scan/BarcodeScanner.tsx` using @zxing/browser (EAN-13; only 978/979 = books).
  Loaded lazily (big library) only when the Scan tab opens.

## Reading & library filters
- Status rules live in `data/reading.ts` (`applyStatus`): Reading starts a read today; Read finishes it
  (or logs one). "Date read" = latest `finished` across reads. Tapping the current status clears it.
- Library search/sort/filter rules: `features/library/libraryQuery.ts` (pure + tested).
  Filters can be preset by URL: `#/library?tag=X`, `?location=X`, `?status=read`, `?onLoan=1`.

## Loans
- `features/loans/`: LendSheet/ReturnSheet (panels), LoanHistory (on book page), LoansScreen
  (`#/loans` current, `#/loans/people`), PersonScreen (`#/loans/person/<personKey>`), people.ts (grouping).
- A book can only have one open loan (enforced in `repository.lendBook`).

## Decisions
- Covers are the hero: grid by default; generated "cloth" placeholder when no cover exists.
- Online covers are cached by the service worker (`book-covers` cache, CacheFirst) for speed/offline.
- New versions are not auto-applied; `UpdatePrompt` shows "Update available, tap to refresh".
- `navigator.storage.persist()` is requested on startup.
- Data added in Safari and in the Home Screen app are SEPARATE on iOS — the owner should use the home screen app.
- Grid/list choice is remembered in localStorage (display preference only, not library data).
- No secret keys in the code (public site). A future price API key must live in a serverless function.

## Status / phases
- [x] Phase 1: setup, deploy, PWA, theme, tabs, data layer, manual entry, grid, detail page
- [x] Phase 2: search + barcode scan, covers, Change Cover
- [x] Phase 3: reading tracking, shelves/tags, location, search/sort/filter
- [x] Phase 4: loans, history, People
- [ ] Phase 5: To Buy, editions, already-own warning, price links, PriceProvider, I Bought It
- [ ] Phase 6: Goodreads import
- [ ] Phase 7: stats, backup/export, polish

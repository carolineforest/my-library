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

## To Buy & prices
- To Buy books are `Book` records with `list: 'toBuy'` (same table). Default format Paperback.
- Book page for To Buy shows `features/toBuy/ToBuyActions` (I Bought It, Compare Prices, Other Editions)
  and a "You already own this" notice (`useOwnedMatches`).
- "I Bought It" = `repository.markBought` (list → owned, status → Want to Read), then `BoughtSheet` asks location/tags.
- Price links: `services/prices/storeLinks.ts` (Amazon, Bookshop.org, B&N, ThriftBooks, AbeBooks, BookFinder).
- Live prices: `services/prices/PriceProvider.ts` interface + `noPriceProvider` placeholder. To enable later,
  build a serverless function that holds the API key, write a provider that calls it, set `priceProvider`.
  No scraping.

## Goodreads import
- `services/importExport/goodreads.ts` parses the Goodreads export CSV (ISBNs come as ="..."; dates YYYY/MM/DD)
  and maps rows to books using `ImportOptions` (status, rating, date read, notes, shelves→tags, to-read destination).
- Screen: `features/import/GoodreadsImportScreen.tsx` (`#/import/goodreads`). Review list with checkboxes; books
  already in the app are flagged and unticked. Nothing is saved until Import. Covers use Open Library by ISBN.
- `Cover` deletes a failed image from the `book-covers` cache so it is retried later (opaque responses get cached).

## Stats, backup, settings
- Stats math: `features/stats/computeStats.ts` (a read counts in the year of its `finished` date; re-reads count).
  Charts: `features/stats/BarChart.tsx` (single-series bars in `--color-accent`, tap for value, hidden table for
  screen readers). The accent/secondary pair is NOT color-blind-safe as a two-series pair, so don't use them
  to distinguish series in one chart.
- Reading goals: setting `goal:<year>`; editor in `features/stats/GoalEditor.tsx` (used by Stats and Settings).
- Backup: `services/importExport/backup.ts`. JSON file `{format:'my-library-backup', version:1, data}`;
  uploaded covers are base64. Restore REPLACES everything (`repository.replaceAllData`). If the data model
  changes, bump `FORMAT_VERSION` and convert old backups in `readBackupFile`.
  Saving uses the iOS share sheet (`navigator.share` with files) → "Save to Files"; desktop falls back to download.
  The file is prepared first, then a second tap saves it (iOS needs the share call straight from a tap).
- `lastBackup` setting drives `BackupReminder` on Library (>30 days, snooze 7 days in localStorage).

## Startup safety net & browser support
- `vite.config.ts` `build.target` = es2019 / Safari 14 / iOS 14 so older iPhones can run the app.
- `index.html` has a plain-JS safety net: if `window.__appStarted` (set in App's first effect) isn't true
  after 10 s, it shows "My Library couldn't start" with the error + device info, a Try Again button, and
  Reset App (unregisters the service worker and clears code caches, keeps IndexedDB data and covers).
  It also watches for the page going blank after start.
- `components/ErrorBoundary.tsx` wraps the app and each screen: a crash shows the error + device info
  instead of a blank page. `App.tsx` opens the database first; failure or >8 s shows `app/StorageProblem.tsx`.
- Tag/location lists are collected from `books.toArray()` (no multiEntry `uniqueKeys()` scans).
- Debugging on the owner's iPhone: ask for a screenshot of these error screens (they include the iOS version).

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
- [x] Phase 5: To Buy, editions, already-own warning, price links, PriceProvider, I Bought It
- [x] Phase 6: Goodreads import
- [x] Phase 7: stats, backup/export, polish

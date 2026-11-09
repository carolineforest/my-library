// Goodreads import: pick the export file, review every book, choose what to
// bring over, then import. Nothing is saved until "Import" is tapped.
import { useMemo, useState } from 'react';
import { useBooks } from '../../data/hooks';
import { addBooks, createTag } from '../../data/repository';
import { findMatches } from '../../data/duplicates';
import {
  DEFAULT_IMPORT_OPTIONS,
  destinationOf,
  goodreadsRowToBook,
  parseGoodreadsCsv,
  type GoodreadsRow,
  type ImportOptions,
} from '../../services/importExport/goodreads';
import { olCoverByIsbn } from '../../services/bookLookup/openLibrary';
import { Cover } from '../../components/Cover';
import { Icon } from '../../components/Icon';
import { goBack, href } from '../../app/router';
import { joinAuthors } from '../../utils/text';
import './import.css';

interface Summary {
  owned: number;
  toBuy: number;
  readLog: number;
  skippedDuplicates: number;
  skippedUnselected: number;
}

export function GoodreadsImportScreen() {
  const existing = useBooks();
  const [rows, setRows] = useState<GoodreadsRow[]>();
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [opts, setOpts] = useState<ImportOptions>(DEFAULT_IMPORT_OPTIONS);
  const [summary, setSummary] = useState<Summary>();
  const [busy, setBusy] = useState(false);

  // Which rows already seem to be in the app.
  const dupes = useMemo(() => {
    const set = new Set<string>();
    if (rows && existing) for (const r of rows) if (findMatches(r, existing).length) set.add(r.rowId);
    return set;
  }, [rows, existing]);

  async function readFile(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      const parsed = parseGoodreadsCsv(await file.text());
      setRows(parsed);
      // Everything selected except books I already have.
      const have = new Set(parsed.filter((r) => existing && findMatches(r, existing).length).map((r) => r.rowId));
      setSelected(new Set(parsed.filter((r) => !have.has(r.rowId)).map((r) => r.rowId)));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function runImport() {
    if (!rows) return;
    setBusy(true);
    try {
      const chosen = rows.filter((r) => selected.has(r.rowId));
      const books = chosen.map((r) => goodreadsRowToBook(r, opts));
      await addBooks(books);
      for (const t of new Set(books.flatMap((b) => b.tags ?? []))) await createTag(t);
      const notChosen = rows.filter((r) => !selected.has(r.rowId));
      setSummary({
        owned: books.filter((b) => b.list === 'owned').length,
        toBuy: books.filter((b) => b.list === 'toBuy').length,
        readLog: books.filter((b) => b.list === 'readLog').length,
        skippedDuplicates: notChosen.filter((r) => dupes.has(r.rowId)).length,
        skippedUnselected: notChosen.filter((r) => !dupes.has(r.rowId)).length,
      });
      window.scrollTo(0, 0);
    } catch (e) {
      setError('Import failed, nothing was saved: ' + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const opt = (k: keyof ImportOptions, label: string) => (
    <label className="check-row">
      <input type="checkbox" checked={Boolean(opts[k])} onChange={(e) => setOpts({ ...opts, [k]: e.target.checked })} />
      {label}
    </label>
  );

  return (
    <div className="page">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => goBack('/settings')} aria-label="Back">
          <Icon name="back" />
        </button>
        <h1>Import from Goodreads</h1>
      </header>

      {summary && (
        <div className="card stack" role="status">
          <h2>Import complete</h2>
          <p>
            Added <strong>{summary.owned}</strong> to My Library, <strong>{summary.toBuy}</strong> to To Buy
            {summary.readLog > 0 && (
              <>
                {' '}
                and <strong>{summary.readLog}</strong> to your Reading Log
              </>
            )}
            .
            <br />
            Skipped {summary.skippedDuplicates} already in the app and {summary.skippedUnselected} you unticked.
          </p>
          <p className="small muted">Covers will appear as they load. It may take a moment for a big library.</p>
          <div className="row-wrap">
            <a className="btn btn-primary" href={href('/library')}>
              Go to My Library
            </a>
            {summary.toBuy > 0 && (
              <a className="btn" href={href('/tobuy')}>
                See To Buy
              </a>
            )}
            {summary.readLog > 0 && (
              <a className="btn" href={href('/stats/log')}>
                See Reading Log
              </a>
            )}
          </div>
        </div>
      )}

      {!summary && !rows && (
        <div className="stack">
          <div className="card stack">
            <h3>1. Get your file from Goodreads</h3>
            <ol className="small" style={{ paddingLeft: 20, margin: 0 }}>
              <li>On goodreads.com, go to <strong>My Books</strong>.</li>
              <li>Under <strong>Tools</strong> (left side, or bottom on phones) tap <strong>Import and export</strong>.</li>
              <li>Tap <strong>Export Library</strong>, wait for the link, then download the file.</li>
              <li>On iPhone it is saved to the <strong>Files</strong> app, in <strong>Downloads</strong>.</li>
            </ol>
          </div>
          <div className="card stack">
            <h3>2. Choose the file</h3>
            <p className="small muted">You'll review every book before anything is saved.</p>
            <label className="btn btn-primary btn-block">
              <Icon name="upload" /> Choose Goodreads file
              <input
                type="file"
                accept=".csv,text/csv,text/comma-separated-values,application/vnd.ms-excel"
                className="visually-hidden"
                onChange={(e) => readFile(e.target.files?.[0])}
              />
            </label>
          </div>
        </div>
      )}

      {error && (
        <p className="notice" role="alert" style={{ marginTop: 12 }}>
          <Icon name="info" /> {error}
        </p>
      )}

      {!summary && rows && (
        <div className="stack">
          <section className="card stack">
            <h3>What to bring over</h3>
            <div className="check-grid">
              {opt('status', 'Reading status')}
              {opt('rating', 'My rating')}
              {opt('dateRead', 'Date read')}
              {opt('notes', 'My review / notes')}
              {opt('shelvesAsTags', 'Goodreads shelves as tags')}
            </div>
            <div>
              <span className="field-label">Books you've read or are reading go to</span>
              <div className="segmented" role="group" aria-label="Destination for read books">
                <button type="button" aria-pressed={opts.readDestination === 'owned'} onClick={() => setOpts({ ...opts, readDestination: 'owned' })}>
                  My Library
                </button>
                <button type="button" aria-pressed={opts.readDestination === 'readLog'} onClick={() => setOpts({ ...opts, readDestination: 'readLog' })}>
                  Reading Log
                </button>
              </div>
              <p className="field-hint">
                {opts.readDestination === 'owned'
                  ? 'My Library is for physical books you own. Untick any you only read as ebooks, or choose Reading Log.'
                  : 'Reading Log is for books you read but don’t own. They count in Stats, not in My Library.'}
              </p>
            </div>
            <div>
              <span className="field-label">Books on your “to-read” shelf go to</span>
              <div className="segmented" role="group" aria-label="Destination for to-read books">
                <button type="button" aria-pressed={opts.toReadDestination === 'toBuy'} onClick={() => setOpts({ ...opts, toReadDestination: 'toBuy' })}>
                  To Buy
                </button>
                <button type="button" aria-pressed={opts.toReadDestination === 'owned'} onClick={() => setOpts({ ...opts, toReadDestination: 'owned' })}>
                  My Library
                </button>
              </div>
              <p className="field-hint">
                {opts.toReadDestination === 'toBuy'
                  ? 'They go on your To Buy list.'
                  : 'They go into My Library marked “Want to Read”.'}
              </p>
            </div>
          </section>

          <div className="row-wrap import-toolbar">
            <strong>
              {selected.size} of {rows.length} selected
            </strong>
            <span className="spacer" />
            <button type="button" className="btn btn-sm" onClick={() => setSelected(new Set(rows.map((r) => r.rowId)))}>
              Select All
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setSelected(new Set())}>
              Select None
            </button>
          </div>
          {dupes.size > 0 && (
            <p className="small muted">
              {dupes.size} book{dupes.size === 1 ? ' is' : 's are'} already in the app and unticked. Tick them if you want copies.
            </p>
          )}

          <ul className="book-list">
            {rows.map((r) => {
              const dest = destinationOf(r, opts);
              return (
                <li key={r.rowId}>
                  <label className="book-row import-row">
                    <input type="checkbox" checked={selected.has(r.rowId)} onChange={() => toggle(r.rowId)} aria-label={`Import ${r.title}`} />
                    <Cover book={{ title: r.title, authors: r.authors, coverUrl: r.isbn13 ? olCoverByIsbn(r.isbn13) : undefined }} />
                    <div className="book-row-body">
                      <div className="book-row-title">{r.title}</div>
                      <div className="book-row-sub">{joinAuthors(r.authors)}</div>
                      <div className="row-wrap" style={{ marginTop: 4 }}>
                        {dupes.has(r.rowId) && <span className="badge badge-warn">Already in app</span>}
                        <span className="badge">{dest === 'toBuy' ? '→ To Buy' : dest === 'readLog' ? '→ Reading Log' : '→ Library'}</span>
                        <span className="badge">{r.exclusiveShelf}</span>
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="import-footer">
            <button type="button" className="btn btn-primary btn-block" disabled={busy || selected.size === 0} onClick={runImport}>
              {busy ? 'Importing…' : `Import ${selected.size} book${selected.size === 1 ? '' : 's'}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

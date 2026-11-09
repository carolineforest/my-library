// Shown when the on-phone database can't be opened (or takes far too long).
import { resetAppCode } from '../components/ErrorBoundary';

export function StorageProblem({ error }: { error?: Error }) {
  return (
    <div className="page">
      <div className="card stack" role="alert">
        <h2>{error ? "Can't open your library" : 'Still opening your library…'}</h2>
        <p>
          The app stores your books in this browser's storage, and {error ? "Safari wouldn't open it" : "Safari hasn't answered yet"}.
          Common causes: Private Browsing is on, Lockdown Mode is on, or the iPhone is very low on storage.
        </p>
        <ol className="small" style={{ paddingLeft: 20, margin: 0 }}>
          <li>Close the app completely (swipe it away) and open it again.</li>
          <li>In Safari, make sure the tab isn't a Private tab.</li>
          <li>Tap <strong>Reset App</strong> below (this keeps your books).</li>
        </ol>
        <div className="row-wrap">
          <button type="button" className="btn btn-primary" onClick={() => location.reload()}>
            Try Again
          </button>
          <button type="button" className="btn" onClick={resetAppCode}>
            Reset App
          </button>
        </div>
        <p className="small muted">If it keeps happening, send Claude a screenshot of this:</p>
        <pre className="small" style={{ whiteSpace: 'pre-wrap', background: 'var(--color-surface-2)', padding: 10, borderRadius: 8, overflowWrap: 'anywhere' }}>
          {(error ? `${error.name}: ${error.message}${(error as { inner?: Error }).inner ? `\nInner: ${(error as { inner?: Error }).inner}` : ''}` : 'Database did not open within 8 seconds.') +
            `\n\nindexedDB available: ${typeof indexedDB !== 'undefined'}\nDevice: ${navigator.userAgent}\nAddress: ${location.href}`}
        </pre>
      </div>
    </div>
  );
}

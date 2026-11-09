// Catches a crash inside a screen and shows what went wrong (instead of a
// blank page), with buttons to retry. The rest of the app keeps working.
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  error?: Error;
}

/** Forget the saved copy of the app's code (NOT the books), then reload. */
export async function resetAppCode() {
  try {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) ?? [];
    await Promise.all(regs.map((r) => r.unregister()));
    const keys = (await window.caches?.keys?.()) ?? [];
    await Promise.all(keys.filter((k) => k !== 'book-covers').map((k) => caches.delete(k)));
  } finally {
    location.reload();
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error('Screen crashed:', error);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    const storageProblem = /indexeddb|database|idb|storage|quota/i.test(`${error.name} ${error.message}`);
    return (
      <div className="page">
        <div className="card stack" role="alert">
          <h2>Something went wrong</h2>
          {storageProblem ? (
            <p>
              The app couldn't open its saved data on this device. This can happen in Private Browsing, in Lockdown Mode, or if
              Safari is low on storage. Your books are not deleted by this message.
            </p>
          ) : (
            <p>This screen hit a problem. Your books are safe.</p>
          )}
          <div className="row-wrap">
            <button type="button" className="btn btn-primary" onClick={() => location.reload()}>
              Try Again
            </button>
            <button type="button" className="btn" onClick={resetAppCode}>
              Reset App
            </button>
          </div>
          <p className="small muted">If it keeps happening, take a screenshot of this and send it to Claude:</p>
          <pre className="small" style={{ whiteSpace: 'pre-wrap', background: 'var(--color-surface-2)', padding: 10, borderRadius: 8, overflowWrap: 'anywhere' }}>
            {`${error.name}: ${error.message}\n${(error.stack ?? '').split('\n').slice(0, 6).join('\n')}\n\nDevice: ${navigator.userAgent}\nAddress: ${location.href}`}
          </pre>
        </div>
      </div>
    );
  }
}

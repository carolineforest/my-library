// A tiny "hash router": pages live after the # in the address
// (e.g. .../my-library/#/book/123). GitHub Pages only ever sees
// .../my-library/, so refreshing never shows a 404.
import { useSyncExternalStore } from 'react';

export interface Route {
  /** Path parts, e.g. "#/book/123" -> ["book", "123"]. */
  parts: string[];
  /** Values after "?", e.g. "#/add?list=toBuy" -> { list: "toBuy" }. */
  query: Record<string, string>;
}

function parse(hash: string): Route {
  const raw = hash.replace(/^#\/?/, '');
  const [path, search = ''] = raw.split('?');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const query = Object.fromEntries(new URLSearchParams(search));
  return { parts: parts.length ? parts : ['library'], query };
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '');
  return parse(hash);
}

/** Go to a page, e.g. navigate('/book/123'). */
export function navigate(path: string, opts: { replace?: boolean } = {}) {
  const hash = '#' + (path.startsWith('/') ? path : '/' + path);
  if (opts.replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
  window.scrollTo(0, 0);
}

/** Go back if there is somewhere to go back to, otherwise to `fallback`. */
export function goBack(fallback = '/library') {
  if (hasInAppHistory()) history.back();
  else navigate(fallback, { replace: true });
}

// Track whether we navigated inside the app, so "Back" never leaves the app.
let navCount = 0;
if (typeof window !== 'undefined') window.addEventListener('hashchange', () => navCount++);
function hasInAppHistory() {
  return navCount > 0;
}

/** Build a link target for <a href>. */
export function href(path: string): string {
  return '#' + (path.startsWith('/') ? path : '/' + path);
}

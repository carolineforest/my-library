// Remembers grid vs. list on this phone (a display preference, not library data).
import { useState } from 'react';
import type { ViewMode } from './BookGrid';

export function useViewMode(key: string): [ViewMode, (v: ViewMode) => void] {
  const storageKey = 'view:' + key;
  const [mode, setMode] = useState<ViewMode>(() => {
    try {
      return localStorage.getItem(storageKey) === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  });
  const set = (v: ViewMode) => {
    setMode(v);
    try {
      localStorage.setItem(storageKey, v);
    } catch {
      /* private mode: just don't remember */
    }
  };
  return [mode, set];
}

// Small temporary messages at the bottom ("Saved", "Book added").
import { useEffect, useSyncExternalStore } from 'react';

let current: { id: number; text: string } | null = null;
const listeners = new Set<() => void>();
let counter = 0;

/** Show a short message for a few seconds. Call from anywhere. */
export function showToast(text: string) {
  current = { id: ++counter, text };
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function ToastHost() {
  const toast = useSyncExternalStore(subscribe, () => current);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => {
      if (current?.id === toast.id) {
        current = null;
        listeners.forEach((l) => l());
      }
    }, 2600);
    return () => clearTimeout(t);
  }, [toast]);
  if (!toast) return null;
  return (
    <div className="toast" role="status" aria-live="polite">
      {toast.text}
    </div>
  );
}

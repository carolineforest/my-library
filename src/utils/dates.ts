// Date helpers. Calendar dates are stored as "YYYY-MM-DD" strings in local time.

/** Today's date as "YYYY-MM-DD" in the phone's time zone. */
export function today(): string {
  return toDateString(new Date());
}

export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "2024-03-05" -> "Mar 5, 2024". Accepts full ISO timestamps too. */
export function formatDate(value?: string): string {
  if (!value) return '';
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y) return value;
  const date = new Date(y, (m || 1) - 1, d || 1);
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/** Whole days between two dates/timestamps (b - a). */
export function daysBetween(a: string | Date, b: string | Date = new Date()): number {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.floor(ms / 86_400_000);
}

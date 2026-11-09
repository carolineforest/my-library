// A simple vertical bar chart in the accent color. Tap/hover a bar to see its value.
// Also renders a hidden table so screen readers can read the numbers.
import { useState } from 'react';

export interface Bar {
  label: string;
  /** Longer label for the tooltip and table, e.g. "March 2024". */
  fullLabel: string;
  value: number;
  /** Extra detail shown when the bar is selected, e.g. "940 pages". */
  detail?: string;
}

export function BarChart({ bars, unit, title }: { bars: Bar[]; unit: string; title: string }) {
  const [active, setActive] = useState<number>();
  const max = Math.max(1, ...bars.map((b) => b.value));
  const peak = bars.findIndex((b) => b.value === max && b.value > 0);
  const shown = active ?? peak;
  const sel = shown >= 0 ? bars[shown] : undefined;

  return (
    <figure className="chart" aria-label={title}>
      <figcaption className="chart-readout" aria-live="polite">
        {sel ? (
          <>
            <strong>{sel.fullLabel}</strong>: {sel.value} {unit}
            {sel.value === 1 ? '' : 's'}
            {sel.detail ? ` · ${sel.detail}` : ''}
          </>
        ) : (
          <span className="muted">No {unit}s yet</span>
        )}
      </figcaption>
      <div className="chart-plot" aria-hidden="true">
        {bars.map((b, i) => (
          <button
            key={b.fullLabel}
            type="button"
            tabIndex={-1}
            className={`chart-col ${i === shown ? 'is-active' : ''}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onClick={() => setActive(i)}
          >
            <span className="chart-bar-area">
              <span className="chart-bar" style={{ height: b.value ? `${(b.value / max) * 100}%` : 0 }} />
            </span>
            <span className="chart-label">{b.label}</span>
          </button>
        ))}
      </div>
      <table className="visually-hidden">
        <caption>{title}</caption>
        <tbody>
          {bars.map((b) => (
            <tr key={b.fullLabel}>
              <th scope="row">{b.fullLabel}</th>
              <td>
                {b.value} {unit}s{b.detail ? `, ${b.detail}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

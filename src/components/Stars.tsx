// Star rating: tappable (Stars) or display-only (StarsSmall).
import { Icon } from './Icon';

export function Stars({ value, onChange }: { value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <div className="stars" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          className={value && n <= value ? 'on' : ''}
          // Tapping the current rating again clears it.
          onClick={() => onChange(value === n ? undefined : n)}
        >
          <Icon name="star" filled />
        </button>
      ))}
    </div>
  );
}

export function StarsSmall({ value }: { value?: number }) {
  if (!value) return null;
  return (
    <span className="stars-small" aria-label={`${value} out of 5 stars`} role="img">
      {Array.from({ length: value }, (_, i) => (
        <Icon key={i} name="star" filled />
      ))}
    </span>
  );
}

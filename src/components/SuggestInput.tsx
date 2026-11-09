// A text box that suggests values I've used before (names, locations, tags).
import { useId, useState } from 'react';
import { simplify } from '../utils/text';

interface SuggestInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  autoFocus?: boolean;
  /** Called when a suggestion is tapped or Enter is pressed. */
  onPick?: (value: string) => void;
  hideLabel?: boolean;
}

export function SuggestInput(props: SuggestInputProps) {
  const { label, value, onChange, suggestions, placeholder, autoFocus, onPick, hideLabel } = props;
  const id = useId();
  const [open, setOpen] = useState(false);
  const q = simplify(value);
  const matches = suggestions
    .filter((s) => simplify(s).includes(q) && s !== value)
    .slice(0, 8);

  const pick = (s: string) => {
    onChange(s);
    onPick?.(s);
    setOpen(false);
  };

  return (
    <div className="field suggest">
      <label htmlFor={id} className={hideLabel ? 'visually-hidden' : 'field-label'}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && onPick) {
            e.preventDefault();
            onPick(value);
            setOpen(false);
          }
        }}
        role="combobox"
        aria-expanded={open && matches.length > 0}
        aria-controls={`${id}-list`}
      />
      {open && matches.length > 0 && (
        <ul className="suggest-list" id={`${id}-list`} role="listbox">
          {matches.map((s) => (
            <li key={s} role="option" aria-selected={false}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)}>
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

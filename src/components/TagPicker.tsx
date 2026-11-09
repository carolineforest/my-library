// Pick shelves/tags for a book: tap existing ones, or type a new one.
import { useState } from 'react';
import { Icon } from './Icon';

interface TagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  allTags: string[];
}

export function TagPicker({ value, onChange, allTags }: TagPickerProps) {
  const [draft, setDraft] = useState('');
  const options = [...new Set([...allTags, ...value])].sort((a, b) => a.localeCompare(b));

  const toggle = (t: string) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  const addNew = () => {
    const t = draft.trim();
    if (!t) return;
    const existing = options.find((o) => o.toLowerCase() === t.toLowerCase());
    const name = existing ?? t;
    if (!value.includes(name)) onChange([...value, name]);
    setDraft('');
  };

  return (
    <div className="field">
      <span className="field-label">Shelves / tags</span>
      {options.length > 0 && (
        <div className="row-wrap" style={{ marginBottom: 8 }}>
          {options.map((t) => (
            <button key={t} type="button" className="chip" aria-pressed={value.includes(t)} onClick={() => toggle(t)}>
              {value.includes(t) && <Icon name="check" />}
              {t}
            </button>
          ))}
        </div>
      )}
      <div className="row">
        <input
          className="input"
          value={draft}
          placeholder="New shelf, e.g. Favorites"
          aria-label="New shelf or tag name"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addNew();
            }
          }}
        />
        <button type="button" className="btn btn-soft" onClick={addNew} disabled={!draft.trim()}>
          Add
        </button>
      </div>
    </div>
  );
}

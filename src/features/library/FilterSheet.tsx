// The "Sort & Filter" panel for the Library.
import type { ReadingStatus } from '../../data/models';
import { Sheet } from '../../components/Sheet';
import { EMPTY_QUERY, SORT_LABELS, type LibraryQuery, type SortBy } from './libraryQuery';

const STATUS_OPTIONS: { value: ReadingStatus | 'unread'; label: string }[] = [
  { value: 'want', label: 'Want to Read' },
  { value: 'reading', label: 'Currently Reading' },
  { value: 'read', label: 'Read' },
  { value: 'unread', label: 'Not read yet' },
];

interface Props {
  query: LibraryQuery;
  onChange: (q: LibraryQuery) => void;
  tags: string[];
  locations: string[];
  onClose: () => void;
}

export function FilterSheet({ query, onChange, tags, locations, onClose }: Props) {
  const set = (patch: Partial<LibraryQuery>) => onChange({ ...query, ...patch });
  return (
    <Sheet title="Sort & Filter" onClose={onClose}>
      <Group label="Sort by">
        {(Object.keys(SORT_LABELS) as SortBy[]).map((s) => (
          <Chip key={s} on={query.sortBy === s} onClick={() => set({ sortBy: s })}>
            {SORT_LABELS[s]}
          </Chip>
        ))}
      </Group>
      <Group label="Reading status">
        {STATUS_OPTIONS.map((o) => (
          <Chip key={o.value} on={query.status === o.value} onClick={() => set({ status: query.status === o.value ? undefined : o.value })}>
            {o.label}
          </Chip>
        ))}
      </Group>
      <Group label="Loans">
        <Chip on={Boolean(query.onLoan)} onClick={() => set({ onLoan: !query.onLoan || undefined })}>
          On loan
        </Chip>
      </Group>
      {tags.length > 0 && (
        <Group label="Shelf / tag">
          {tags.map((t) => (
            <Chip key={t} on={query.tag === t} onClick={() => set({ tag: query.tag === t ? undefined : t })}>
              {t}
            </Chip>
          ))}
        </Group>
      )}
      {locations.length > 0 && (
        <Group label="Location">
          {locations.map((l) => (
            <Chip key={l} on={query.location === l} onClick={() => set({ location: query.location === l ? undefined : l })}>
              {l}
            </Chip>
          ))}
        </Group>
      )}
      <div className="row" style={{ marginTop: 20 }}>
        <button type="button" className="btn btn-ghost" onClick={() => onChange({ ...EMPTY_QUERY, text: query.text })}>
          Clear all
        </button>
        <span className="spacer" />
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      </div>
    </Sheet>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset style={{ border: 'none', padding: 0, margin: '0 0 18px' }}>
      <legend className="field-label">{label}</legend>
      <div className="row-wrap">{children}</div>
    </fieldset>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip" aria-pressed={on} onClick={onClick}>
      {children}
    </button>
  );
}

// Grid / list switch buttons.
import { Icon } from '../../components/Icon';
import type { ViewMode } from './BookGrid';

export function ViewToggle({ view, onChange }: { view: ViewMode; onChange: (v: ViewMode) => void }) {
  return (
    <div className="row" style={{ gap: 0 }}>
      <button
        type="button"
        className={`icon-btn ${view === 'grid' ? 'active' : ''}`}
        aria-pressed={view === 'grid'}
        aria-label="Show as cover grid"
        onClick={() => onChange('grid')}
      >
        <Icon name="grid" />
      </button>
      <button
        type="button"
        className={`icon-btn ${view === 'list' ? 'active' : ''}`}
        aria-pressed={view === 'list'}
        aria-label="Show as list"
        onClick={() => onChange('list')}
      >
        <Icon name="list" />
      </button>
    </div>
  );
}

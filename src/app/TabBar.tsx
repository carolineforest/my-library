// The bottom tab bar, like a native iPhone app.
import { Icon, type IconName } from '../components/Icon';
import { href } from './router';

export type TabId = 'library' | 'tobuy' | 'loans' | 'stats' | 'settings';

const TABS: { id: TabId; label: string; icon: IconName }[] = [
  { id: 'library', label: 'Library', icon: 'library' },
  { id: 'tobuy', label: 'To Buy', icon: 'bag' },
  { id: 'loans', label: 'Loans', icon: 'loan' },
  { id: 'stats', label: 'Stats', icon: 'stats' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export function TabBar({ active }: { active: TabId }) {
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map((t) => (
        <a key={t.id} className="tab" href={href('/' + t.id)} aria-current={active === t.id ? 'page' : undefined}>
          <Icon name={t.icon} />
          <span>{t.label}</span>
        </a>
      ))}
    </nav>
  );
}

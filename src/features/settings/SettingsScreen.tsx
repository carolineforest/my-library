// The "Settings" tab: import, backup, reading goal, shelves, and app info.
import { useEffect, useState } from 'react';
import { href } from '../../app/router';
import { Icon } from '../../components/Icon';
import { BackupSection } from './BackupSection';
import { ShelvesSection } from './ShelvesSection';
import { GoalEditor } from '../stats/GoalEditor';
import { useSetting } from '../../data/hooks';

export function SettingsScreen() {
  const [persisted, setPersisted] = useState<boolean>();
  const year = new Date().getFullYear();
  const goal = useSetting<number | null>(`goal:${year}`, null);
  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted).catch(() => {});
  }, []);
  const standalone =
    window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

  return (
    <div className="page stack">
      <header className="page-header">
        <h1>Settings</h1>
      </header>

      <section className="card stack" aria-labelledby="import-title">
        <h2 id="import-title" className="section-title">
          Import
        </h2>
        <a className="btn btn-block" href={href('/import/goodreads')}>
          <Icon name="upload" /> Import from Goodreads
        </a>
      </section>

      <BackupSection />

      <section className="card stack">
        <h2 className="section-title">{year} reading goal</h2>
        <p className="small muted">{goal ? `${goal} books this year.` : 'No goal set yet.'} Progress is shown in Stats.</p>
        <GoalEditor year={year} goal={goal} />
      </section>

      <ShelvesSection />

      <section className="card stack small" aria-labelledby="about-title">
        <h2 id="about-title" className="section-title">
          About this app
        </h2>
        {!standalone && (
          <p className="notice">
            <Icon name="info" />
            <span>
              Tip: in Safari tap <strong>Share</strong> → <strong>Add to Home Screen</strong>. Books added in Safari and in the
              home screen app are kept separately on iPhone, so pick one (the home screen app is best).
            </span>
          </p>
        )}
        <p className="muted">
          Your data is stored only on this device{persisted ? ' (protected storage is on)' : ''}. Book details and covers come from
          Open Library and Google Books.
        </p>
        <p className="muted">Version {__APP_VERSION__}</p>
      </section>
    </div>
  );
}

// Gentle reminder on the Library screen when the last backup is over 30 days old
// (or there has never been one and the library is over 30 days old).
import { useState } from 'react';
import { useBooks, useSetting } from '../../data/hooks';
import { href } from '../../app/router';
import { daysBetween } from '../../utils/dates';
import { Icon } from '../../components/Icon';

const SNOOZE_KEY = 'backupReminderSnoozedAt';

export function BackupReminder() {
  const books = useBooks();
  const lastBackup = useSetting<string | null>('lastBackup', null);
  const [snoozed, setSnoozed] = useState(() => {
    try {
      const at = localStorage.getItem(SNOOZE_KEY);
      return Boolean(at && daysBetween(at) < 7);
    } catch {
      return false;
    }
  });
  if (!books || books.length === 0 || snoozed) return null;
  const oldest = books.reduce((m, b) => (b.dateAdded < m ? b.dateAdded : m), books[0].dateAdded);
  const since = lastBackup ?? oldest;
  if (daysBetween(since) <= 30) return null;

  return (
    <div className="notice" role="status" style={{ marginBottom: 16 }}>
      <Icon name="info" />
      <div style={{ flex: 1 }}>
        {lastBackup ? `It's been ${daysBetween(lastBackup)} days since your last backup.` : "You haven't backed up your library yet."}{' '}
        Your books live only on this phone.
        <div className="row" style={{ marginTop: 8 }}>
          <a className="btn btn-sm btn-primary" href={href('/settings')}>
            Back up now
          </a>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            onClick={() => {
              try {
                localStorage.setItem(SNOOZE_KEY, new Date().toISOString());
              } catch {
                /* ignore */
              }
              setSnoozed(true);
            }}
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

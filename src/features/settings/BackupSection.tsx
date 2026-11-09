// Settings → Backup: export/restore the whole library, export CSV.
import { useState } from 'react';
import { useSetting } from '../../data/hooks';
import type { AllData } from '../../data/repository';
import {
  createBackupFile,
  createCsvFile,
  markBackedUp,
  readBackupFile,
  restoreBackup,
  saveFile,
} from '../../services/importExport/backup';
import { Sheet } from '../../components/Sheet';
import { Icon } from '../../components/Icon';
import { showToast } from '../../components/Toast';
import { daysBetween, formatDate } from '../../utils/dates';

export function BackupSection() {
  const lastBackup = useSetting<string | null>('lastBackup', null);
  // Files are prepared first, then a second tap saves them (iPhone requires
  // the share sheet to open straight from a tap).
  const [ready, setReady] = useState<{ file: File; isBackup: boolean }>();
  const [busy, setBusy] = useState(false);
  const [restore, setRestore] = useState<{ data: AllData; exportedAt: string }>();
  const [error, setError] = useState('');

  async function prepare(isBackup: boolean) {
    setBusy(true);
    setError('');
    try {
      setReady({ file: isBackup ? await createBackupFile() : await createCsvFile(), isBackup });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function pickRestore(file: File | undefined) {
    if (!file) return;
    setError('');
    try {
      setRestore(await readBackupFile(file));
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const overdue = !lastBackup || daysBetween(lastBackup) > 30;

  return (
    <section className="card stack" aria-labelledby="backup-title">
      <h2 id="backup-title" className="section-title">
        Backup
      </h2>
      <p className={`small ${overdue ? '' : 'muted'}`}>
        {lastBackup
          ? `Last backed up ${formatDate(lastBackup)} (${daysBetween(lastBackup)} days ago).`
          : 'Never backed up.'}{' '}
        Your library is stored only on this phone, so save a backup to Files or iCloud Drive now and then.
      </p>
      <button type="button" className="btn btn-primary btn-block" disabled={busy} onClick={() => prepare(true)}>
        <Icon name="download" /> Export Backup
      </button>
      <button type="button" className="btn btn-block" disabled={busy} onClick={() => prepare(false)}>
        <Icon name="download" /> Export as spreadsheet (CSV)
      </button>
      <label className="btn btn-block">
        <Icon name="upload" /> Import Backup
        <input type="file" accept=".json,application/json" className="visually-hidden" onChange={(e) => pickRestore(e.target.files?.[0])} />
      </label>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}

      {ready && (
        <Sheet title={ready.isBackup ? 'Backup ready' : 'Spreadsheet ready'} onClose={() => setReady(undefined)}>
          <p className="muted">
            Tap Save, then choose <strong>Save to Files</strong> and pick <strong>iCloud Drive</strong> or <strong>On My iPhone</strong>.
          </p>
          <p className="small muted">{ready.file.name}</p>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={async () => {
              const saved = await saveFile(ready.file);
              if (saved && ready.isBackup) {
                await markBackedUp();
                showToast('Backup saved');
              }
              if (saved) setReady(undefined);
            }}
          >
            Save
          </button>
        </Sheet>
      )}

      {restore && (
        <Sheet title="Restore this backup?" onClose={() => setRestore(undefined)}>
          <p>
            Backup from <strong>{formatDate(restore.exportedAt)}</strong> with {restore.data.books.length} books and{' '}
            {restore.data.loans.length} loan records.
          </p>
          <p className="notice">
            <Icon name="info" />
            <span>
              This <strong>replaces everything</strong> currently in the app. If you're not sure, cancel and tap Export Backup
              first.
            </span>
          </p>
          <div className="stack" style={{ marginTop: 16 }}>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={async () => {
                await restoreBackup(restore.data);
                setRestore(undefined);
                showToast('Library restored');
              }}
            >
              Replace and Restore
            </button>
            <button type="button" className="btn btn-block" onClick={() => setRestore(undefined)}>
              Cancel
            </button>
          </div>
        </Sheet>
      )}
    </section>
  );
}

// The app shell: picks which screen to show from the address, plus the tab bar.
// To add a screen: create it under src/features/, then add a case below.
import { useEffect, useState } from 'react';
import { useRoute } from './router';
import { TabBar, type TabId } from './TabBar';
import { UpdatePrompt } from './UpdatePrompt';
import { ToastHost } from '../components/Toast';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { db, requestPersistentStorage } from '../data/db';
import { StorageProblem } from './StorageProblem';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { BookDetailScreen } from '../features/book/BookDetailScreen';
import { EditBookScreen } from '../features/book/EditBookScreen';
import { AddBookScreen } from '../features/add/AddBookScreen';
import { LoansScreen } from '../features/loans/LoansScreen';
import { ToBuyScreen } from '../features/toBuy/ToBuyScreen';
import { GoodreadsImportScreen } from '../features/import/GoodreadsImportScreen';
import { StatsScreen } from '../features/stats/StatsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { PersonScreen } from '../features/loans/PersonScreen';

let lastTab: TabId = 'library';

export function App() {
  const route = useRoute();
  const [section, id] = route.parts;

  // Open the on-phone database first, so a storage problem shows a clear message
  // instead of an empty screen that never finishes loading.
  const [dbState, setDbState] = useState<'opening' | 'ready' | 'slow' | Error>('opening');
  useEffect(() => {
    (window as unknown as { __appStarted: boolean }).__appStarted = true;
    const slow = setTimeout(() => setDbState((s) => (s === 'opening' ? 'slow' : s)), 8000);
    db.open()
      .then(() => setDbState('ready'))
      .catch((e: Error) => setDbState(e))
      .finally(() => clearTimeout(slow));
    requestPersistentStorage();
    return () => clearTimeout(slow);
  }, []);

  let screen;
  if (dbState instanceof Error || dbState === 'slow') {
    screen = <StorageProblem error={dbState instanceof Error ? dbState : undefined} />;
  } else if (dbState === 'opening') {
    screen = null;
  } else switch (section) {
    case 'library':
      lastTab = 'library';
      screen = <LibraryScreen key={JSON.stringify(route.query)} params={route.query} />;
      break;
    case 'book':
      screen = <BookDetailScreen id={id} />;
      break;
    case 'edit':
      screen = <EditBookScreen id={id} />;
      break;
    case 'add':
      screen = (
        <AddBookScreen list={route.query.list === 'toBuy' ? 'toBuy' : 'owned'} mode={route.query.mode} isbn={route.query.isbn} />
      );
      break;
    case 'import':
      lastTab = 'settings';
      screen = <GoodreadsImportScreen />;
      break;
    case 'tobuy':
      lastTab = 'tobuy';
      screen = <ToBuyScreen />;
      break;
    case 'loans':
      lastTab = 'loans';
      screen = id === 'person' ? <PersonScreen personKey={route.parts[2]} /> : <LoansScreen view={id} />;
      break;
    case 'stats':
      lastTab = 'stats';
      screen = <StatsScreen />;
      break;
    case 'settings':
      lastTab = 'settings';
      screen = <SettingsScreen />;
      break;
    default:
      lastTab = 'library';
      screen = <LibraryScreen />;
  }

  return (
    <>
      <main className="app-main">
        {/* key: moving to another page clears a crash message */}
        <ErrorBoundary key={route.parts.join('/')}>{screen}</ErrorBoundary>
      </main>
      <TabBar active={lastTab} />
      <UpdatePrompt />
      <ToastHost />
    </>
  );
}

// The app shell: picks which screen to show from the address, plus the tab bar.
// To add a screen: create it under src/features/, then add a case below.
import { useEffect } from 'react';
import { useRoute } from './router';
import { TabBar, type TabId } from './TabBar';
import { UpdatePrompt } from './UpdatePrompt';
import { ToastHost } from '../components/Toast';
import { requestPersistentStorage } from '../data/db';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { BookDetailScreen } from '../features/book/BookDetailScreen';
import { EditBookScreen } from '../features/book/EditBookScreen';
import { AddBookScreen } from '../features/add/AddBookScreen';
import { PlaceholderScreen } from './PlaceholderScreen';

let lastTab: TabId = 'library';

export function App() {
  const route = useRoute();
  const [section, id] = route.parts;

  useEffect(() => {
    requestPersistentStorage();
  }, []);

  let screen;
  switch (section) {
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
    case 'tobuy':
      lastTab = 'tobuy';
      screen = <PlaceholderScreen title="To Buy" />;
      break;
    case 'loans':
      lastTab = 'loans';
      screen = <PlaceholderScreen title="Loans" />;
      break;
    case 'stats':
      lastTab = 'stats';
      screen = <PlaceholderScreen title="Stats" />;
      break;
    case 'settings':
      lastTab = 'settings';
      screen = <PlaceholderScreen title="Settings" />;
      break;
    default:
      lastTab = 'library';
      screen = <LibraryScreen />;
  }

  return (
    <>
      <main className="app-main">{screen}</main>
      <TabBar active={lastTab} />
      <UpdatePrompt />
      <ToastHost />
    </>
  );
}

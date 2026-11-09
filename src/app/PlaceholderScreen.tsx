// Temporary screen for tabs that are coming in a later phase.
import { EmptyState } from '../components/EmptyState';

export function PlaceholderScreen({ title }: { title: string }) {
  return (
    <div className="page">
      <header className="page-header">
        <h1>{title}</h1>
      </header>
      <EmptyState title="Coming soon" message="This part of the app is being built in a later phase." />
    </div>
  );
}

// Friendly "nothing here yet" message with a next step.
import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  message: ReactNode;
  action?: ReactNode;
  art?: 'books' | 'bag' | 'loan' | 'chart';
}

export function EmptyState({ title, message, action, art = 'books' }: EmptyStateProps) {
  return (
    <div className="empty">
      <EmptyArt kind={art} />
      <h2>{title}</h2>
      <p>{message}</p>
      {action}
    </div>
  );
}

function EmptyArt({ kind }: { kind: NonNullable<EmptyStateProps['art']> }) {
  // Simple drawings in the theme colors.
  return (
    <svg className="empty-art" viewBox="0 0 120 120" aria-hidden>
      <circle cx="60" cy="60" r="56" fill="var(--color-accent-soft)" />
      {kind === 'books' && (
        <g>
          <rect x="30" y="34" width="16" height="52" rx="3" fill="var(--color-accent)" />
          <rect x="48" y="28" width="14" height="58" rx="3" fill="var(--color-secondary)" />
          <rect x="64" y="38" width="12" height="48" rx="3" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2" />
          <rect x="80" y="34" width="13" height="52" rx="3" fill="var(--color-accent)" transform="rotate(10 86 60)" />
          <rect x="24" y="86" width="74" height="5" rx="2.5" fill="var(--color-text-muted)" />
        </g>
      )}
      {kind === 'bag' && (
        <g>
          <path d="M36 46h48l-4 44H40z" fill="var(--color-accent)" />
          <path d="M48 46v-6a12 12 0 0 1 24 0v6" fill="none" stroke="var(--color-secondary)" strokeWidth="5" strokeLinecap="round" />
        </g>
      )}
      {kind === 'loan' && (
        <g fill="none" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M34 48h48l-10-10" stroke="var(--color-accent)" />
          <path d="M86 74H38l10 10" stroke="var(--color-secondary)" />
        </g>
      )}
      {kind === 'chart' && (
        <g>
          <rect x="32" y="62" width="12" height="24" rx="3" fill="var(--color-secondary)" />
          <rect x="54" y="40" width="12" height="46" rx="3" fill="var(--color-accent)" />
          <rect x="76" y="52" width="12" height="34" rx="3" fill="var(--color-secondary)" />
        </g>
      )}
    </svg>
  );
}

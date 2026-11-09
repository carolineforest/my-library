// Everyone who borrowed this book, with dates. Shown on the book's page.
import type { Loan } from '../../data/models';
import { deleteLoan } from '../../data/repository';
import { href } from '../../app/router';
import { formatDate } from '../../utils/dates';
import { Icon } from '../../components/Icon';

export function LoanHistory({ loans }: { loans: Loan[] }) {
  if (loans.length === 0) return null;
  return (
    <section className="section">
      <h2 className="section-title">Loan history</h2>
      <ul className="history card">
        {loans.map((l) => (
          <li key={l.id}>
            <div style={{ flex: 1 }}>
              <a href={href('/loans/person/' + encodeURIComponent(l.personKey))}>{l.person}</a>
              <div className="muted">
                Lent {formatDate(l.lentDate)} · {l.returnedDate ? `Returned ${formatDate(l.returnedDate)}` : 'Still out'}
              </div>
            </div>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Delete this loan record for ${l.person}`}
              onClick={() => confirm('Delete this loan record?') && deleteLoan(l.id)}
            >
              <Icon name="trash" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

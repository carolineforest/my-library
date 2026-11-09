// The "Stats" tab: reading goal, books/pages per month and year, and library counts.
import { useState } from 'react';
import { useBooks, useLoans, useSetting } from '../../data/hooks';
import { EmptyState } from '../../components/EmptyState';
import { href } from '../../app/router';
import { BarChart } from './BarChart';
import { perYear, totals, yearStats } from './computeStats';
import { GoalEditor } from './GoalEditor';
import './stats.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function StatsScreen() {
  const books = useBooks();
  const loans = useLoans();
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const goal = useSetting<number | null>(`goal:${year}`, null);

  if (!books || !loans) return <div className="page" />;
  if (books.length === 0)
    return (
      <div className="page">
        <header className="page-header">
          <h1>Stats</h1>
        </header>
        <EmptyState
          art="chart"
          title="No stats yet"
          message="Add books and mark them as Read to see your reading year come to life."
          action={
            <a className="btn btn-primary" href={href('/add?list=owned')}>
              Add a book
            </a>
          }
        />
      </div>
    );

  const ys = yearStats(books, year);
  const years = perYear(books);
  const t = totals(books, loans);
  const yearChoices = [...new Set([thisYear, ...years.map((y) => y.year)])].sort((a, b) => b - a);
  const pct = goal ? Math.min(100, Math.round((ys.books / goal) * 100)) : 0;

  return (
    <div className="page stack-lg">
      <header className="page-header" style={{ marginBottom: 0 }}>
        <h1>Stats</h1>
        {yearChoices.length > 1 && (
          <select className="select" style={{ width: 'auto' }} value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="Year">
            {yearChoices.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        )}
      </header>

      <section className="card" aria-labelledby="goal-title">
        <h2 id="goal-title" className="section-title">
          {year} reading goal
        </h2>
        {goal ? (
          <>
            <div className="goal-track" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={ys.books} aria-label="Goal progress">
              <div className="goal-fill" style={{ width: `${pct}%` }} />
            </div>
            <p>
              <strong>{ys.books}</strong> of {goal} books ({pct}%)
              {ys.books >= goal ? ' — goal reached! 🎉' : year === thisYear ? ` · ${goal - ys.books} to go` : ''}
            </p>
          </>
        ) : (
          <p className="muted">No goal set for {year}.</p>
        )}
        <GoalEditor year={year} goal={goal} />
      </section>

      <section className="tiles" aria-label="Library totals">
        <a className="tile" href={href('/library')}>
          <div className="tile-value">{t.owned}</div>
          <div className="tile-label">Books owned</div>
        </a>
        <a className="tile" href={href('/library?status=read')}>
          <div className="tile-value">{t.read}</div>
          <div className="tile-label">Owned & read</div>
        </a>
        <a className="tile" href={href('/library?status=unread')}>
          <div className="tile-value">{t.unread}</div>
          <div className="tile-label">Owned, not read yet</div>
        </a>
        <a className="tile" href={href('/loans')}>
          <div className="tile-value">{t.onLoan}</div>
          <div className="tile-label">On loan now</div>
        </a>
      </section>

      <section className="card">
        <h2 className="section-title">
          {year}: {ys.books} book{ys.books === 1 ? '' : 's'}, {ys.pages.toLocaleString()} pages
        </h2>
        <BarChart
          title={`Books read per month in ${year}`}
          unit="book"
          bars={ys.months.map((m, i) => ({
            label: MONTHS[i].slice(0, 1),
            fullLabel: `${MONTH_NAMES[i]} ${year}`,
            value: m.books,
            detail: `${m.pages.toLocaleString()} pages`,
          }))}
        />
      </section>

      {years.length > 0 && (
        <section className="card">
          <h2 className="section-title">Books read per year</h2>
          <BarChart
            title="Books read per year"
            unit="book"
            bars={years.slice(-10).map((y) => ({
              label: `’${String(y.year).slice(2)}`,
              fullLabel: String(y.year),
              value: y.books,
              detail: `${y.pages.toLocaleString()} pages`,
            }))}
          />
          <table className="stats-table small" style={{ width: '100%', marginTop: 8 }}>
            <thead>
              <tr className="muted">
                <th style={{ textAlign: 'left' }}>Year</th>
                <th style={{ textAlign: 'right' }}>Books</th>
                <th style={{ textAlign: 'right' }}>Pages</th>
              </tr>
            </thead>
            <tbody>
              {[...years].reverse().map((y) => (
                <tr key={y.year}>
                  <td>{y.year}</td>
                  <td style={{ textAlign: 'right' }}>{y.books}</td>
                  <td style={{ textAlign: 'right' }}>{y.pages.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small muted" style={{ marginTop: 8 }}>
            Pages count only books with a page count. Re-reads count again.
          </p>
        </section>
      )}
    </div>
  );
}

// Set or change the reading goal (number of books) for a year.
import { useState } from 'react';
import { setSetting } from '../../data/repository';

export function GoalEditor({ year, goal }: { year: number; goal: number | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');
  if (!editing)
    return (
      <button
        type="button"
        className="btn btn-soft btn-sm"
        onClick={() => {
          setValue(goal ? String(goal) : '');
          setEditing(true);
        }}
      >
        {goal ? 'Change goal' : 'Set a goal'}
      </button>
    );
  return (
    <form
      className="row"
      onSubmit={async (e) => {
        e.preventDefault();
        const n = Math.round(Number(value));
        await setSetting(`goal:${year}`, n > 0 ? n : null);
        setEditing(false);
      }}
    >
      <input
        className="input"
        inputMode="numeric"
        aria-label={`Books to read in ${year}`}
        placeholder="e.g. 24"
        value={value}
        autoFocus
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="btn btn-primary">
        Save
      </button>
    </form>
  );
}

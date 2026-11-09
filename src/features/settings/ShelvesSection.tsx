// Settings → Shelves: create, rename and delete shelves/tags.
import { useState } from 'react';
import { useTags } from '../../data/hooks';
import { createTag, deleteTag, renameTag } from '../../data/repository';
import { Icon } from '../../components/Icon';
import { href } from '../../app/router';

export function ShelvesSection() {
  const tags = useTags();
  const [name, setName] = useState('');
  return (
    <section className="card stack" aria-labelledby="shelves-title">
      <h2 id="shelves-title" className="section-title">
        Shelves &amp; tags
      </h2>
      {tags.length === 0 && <p className="small muted">No shelves yet. Create some, like Fiction, Signed, or Favorites.</p>}
      <ul className="history">
        {tags.map((t) => (
          <li key={t}>
            <a href={href('/library?tag=' + encodeURIComponent(t))} style={{ flex: 1, color: 'inherit', textDecoration: 'none' }}>
              {t}
            </a>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Rename ${t}`}
              onClick={() => {
                const n = prompt('Rename shelf', t);
                if (n) renameTag(t, n);
              }}
            >
              <Icon name="edit" />
            </button>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Delete ${t}`}
              onClick={() => confirm(`Delete the shelf “${t}”? Books stay in your library.`) && deleteTag(t)}
            >
              <Icon name="trash" />
            </button>
          </li>
        ))}
      </ul>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          createTag(name);
          setName('');
        }}
      >
        <input className="input" value={name} placeholder="New shelf" aria-label="New shelf name" onChange={(e) => setName(e.target.value)} />
        <button type="submit" className="btn btn-soft" disabled={!name.trim()}>
          Create
        </button>
      </form>
    </section>
  );
}

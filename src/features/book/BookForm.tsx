// The form for typing in or editing a book's details.
// Used by manual entry (Add) and by Edit.
import { useState, type FormEvent } from 'react';
import { FORMATS, type Book, type BookFormat } from '../../data/models';
import { useLocations, useTags } from '../../data/hooks';
import { SuggestInput } from '../../components/SuggestInput';
import { TagPicker } from '../../components/TagPicker';
import { Cover } from '../../components/Cover';
import { Icon } from '../../components/Icon';
import { joinAuthors, splitAuthors } from '../../utils/text';
import { cleanIsbn, normalizeIsbn } from '../../utils/isbn';
import { resizeImage } from '../../services/covers/resizeImage';

/** What the form hands back when saved. `coverFile` is a newly chosen photo. */
export interface BookFormResult {
  fields: Partial<Book> & { title: string };
  coverFile?: Blob;
  removeCustomCover?: boolean;
}

interface BookFormProps {
  initial?: Partial<Book>;
  /** Allow uploading my own cover photo (manual-entry books only). */
  allowCoverUpload: boolean;
  /** Show location + tags (owned books). */
  showShelving?: boolean;
  submitLabel: string;
  onSubmit: (result: BookFormResult) => void | Promise<void>;
}

export function BookForm({ initial = {}, allowCoverUpload, showShelving = true, submitLabel, onSubmit }: BookFormProps) {
  const allTags = useTags();
  const locations = useLocations();
  const [title, setTitle] = useState(initial.title ?? '');
  const [authors, setAuthors] = useState(joinAuthors(initial.authors));
  const [isbn, setIsbn] = useState(initial.isbn13 ?? initial.isbn10 ?? '');
  const [publisher, setPublisher] = useState(initial.publisher ?? '');
  const [year, setYear] = useState(initial.year?.toString() ?? '');
  const [pages, setPages] = useState(initial.pageCount?.toString() ?? '');
  const [format, setFormat] = useState<BookFormat>(initial.format ?? 'Paperback');
  const [description, setDescription] = useState(initial.description ?? '');
  const [location, setLocation] = useState(initial.location ?? '');
  const [tags, setTags] = useState<string[]>(initial.tags ?? []);
  const [coverFile, setCoverFile] = useState<Blob>();
  const [coverPreview, setCoverPreview] = useState<string>();
  const [removeCustom, setRemoveCustom] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isbnText = cleanIsbn(isbn);
  const isbnInvalid = isbnText.length > 0 && !normalizeIsbn(isbnText).isbn13 && !normalizeIsbn(isbnText).isbn10;

  async function pickCover(file: File | undefined) {
    if (!file) return;
    try {
      const small = await resizeImage(file);
      setCoverFile(small);
      setCoverPreview(URL.createObjectURL(small));
      setRemoveCustom(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a title.');
      return;
    }
    setError('');
    setSaving(true);
    const ids = normalizeIsbn(isbnText);
    const toNum = (s: string) => (s.trim() && !isNaN(Number(s)) ? Number(s) : undefined);
    try {
      await onSubmit({
        fields: {
          title: title.trim(),
          authors: splitAuthors(authors),
          isbn13: ids.isbn13 ?? (isbnText.length === 13 ? isbnText : undefined),
          isbn10: ids.isbn10 ?? (isbnText.length === 10 ? isbnText : undefined),
          publisher: publisher.trim() || undefined,
          year: toNum(year),
          pageCount: toNum(pages),
          format,
          description: description.trim() || undefined,
          ...(showShelving ? { location: location.trim() || undefined, tags } : {}),
        },
        coverFile,
        removeCustomCover: removeCustom,
      });
    } finally {
      setSaving(false);
    }
  }

  const previewBook = {
    title: title || 'Untitled',
    authors: splitAuthors(authors),
    coverUrl: coverPreview ?? initial.coverUrl,
    customCoverId: coverPreview || removeCustom ? undefined : initial.customCoverId,
  };

  return (
    <form onSubmit={submit} className="stack" noValidate>
      {allowCoverUpload && (
        <div className="row" style={{ alignItems: 'flex-end', gap: 16 }}>
          <div style={{ width: 96 }}>
            <Cover book={previewBook} eager />
          </div>
          <div className="stack" style={{ flex: 1 }}>
            <label className="btn btn-soft">
              <Icon name="camera" /> {coverPreview || initial.customCoverId ? 'Change photo' : 'Add cover photo'}
              <input
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={(e) => pickCover(e.target.files?.[0])}
              />
            </label>
            {(coverPreview || (initial.customCoverId && !removeCustom)) && (
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  setCoverFile(undefined);
                  setCoverPreview(undefined);
                  setRemoveCustom(true);
                }}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>
      )}

      <Text label="Title *" value={title} onChange={setTitle} autoFocus={!initial.title} />
      <Text label="Author(s)" value={authors} onChange={setAuthors} hint="Separate several authors with commas." />
      <div className="field-row">
        <Text
          label="ISBN"
          value={isbn}
          onChange={setIsbn}
          inputMode="numeric"
          hint={isbnInvalid ? "This doesn't look like a valid ISBN, but you can still save it." : undefined}
        />
        <div className="field">
          <label className="field-label" htmlFor="format">
            Format
          </label>
          <select id="format" className="select" value={format} onChange={(e) => setFormat(e.target.value as BookFormat)}>
            {FORMATS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
        </div>
      </div>
      <Text label="Publisher" value={publisher} onChange={setPublisher} />
      <div className="field-row">
        <Text label="Year" value={year} onChange={setYear} inputMode="numeric" />
        <Text label="Pages" value={pages} onChange={setPages} inputMode="numeric" />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="desc">
          Description
        </label>
        <textarea id="desc" className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      {showShelving && (
        <>
          <SuggestInput
            label="Location"
            value={location}
            onChange={setLocation}
            suggestions={locations}
            placeholder="e.g. Living room, top shelf"
          />
          <TagPicker value={tags} onChange={setTags} allTags={allTags} />
        </>
      )}

      {error && (
        <p role="alert" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
        {submitLabel}
      </button>
    </form>
  );
}

interface TextProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  autoFocus?: boolean;
  inputMode?: 'numeric' | 'text';
}

function Text({ label, value, onChange, hint, autoFocus, inputMode }: TextProps) {
  const id = 'f-' + label.replace(/\W+/g, '').toLowerCase();
  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        value={value}
        autoFocus={autoFocus}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <div className="field-hint">{hint}</div>}
    </div>
  );
}

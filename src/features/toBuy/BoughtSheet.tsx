// "I Bought It": moves the book into My Library, then (optionally) asks where it goes.
import { useState } from 'react';
import type { Book } from '../../data/models';
import { markBought, updateBook } from '../../data/repository';
import { useLocations, useTags } from '../../data/hooks';
import { Sheet } from '../../components/Sheet';
import { SuggestInput } from '../../components/SuggestInput';
import { TagPicker } from '../../components/TagPicker';
import { showToast } from '../../components/Toast';

export function BoughtSheet({ book, onClose }: { book: Book; onClose: () => void }) {
  const locations = useLocations();
  const allTags = useTags();
  const [location, setLocation] = useState(book.location ?? '');
  const [tags, setTags] = useState<string[]>(book.tags);

  return (
    <Sheet title="Added to My Library 🎉" onClose={onClose}>
      <p className="muted">“{book.title}” is now on your shelves. Where will it live? (Optional)</p>
      <div className="stack">
        <SuggestInput label="Location" value={location} onChange={setLocation} suggestions={locations} placeholder="e.g. Bedroom shelf" />
        <TagPicker value={tags} onChange={setTags} allTags={allTags} />
        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={async () => {
            await updateBook(book.id, { location: location.trim() || undefined, tags });
            showToast('Saved');
            onClose();
          }}
        >
          Save
        </button>
        <button type="button" className="btn btn-ghost btn-block" onClick={onClose}>
          Skip
        </button>
      </div>
    </Sheet>
  );
}

/** Does the move right away (one tap), then the sheet above asks for details. */
export async function buyNow(book: Book) {
  await markBought(book.id);
}

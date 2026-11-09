// Edit a book's details.
import { useBook } from '../../data/hooks';
import { deleteCoverImage, saveCoverImage, updateBook } from '../../data/repository';
import { goBack } from '../../app/router';
import { Icon } from '../../components/Icon';
import { showToast } from '../../components/Toast';
import { BookForm } from './BookForm';

export function EditBookScreen({ id }: { id?: string }) {
  const book = useBook(id);
  if (!book) return <div className="page" />;

  return (
    <div className="page">
      <header className="page-header">
        <button type="button" className="icon-btn" onClick={() => goBack('/book/' + book.id)} aria-label="Back">
          <Icon name="back" />
        </button>
        <h1>Edit Book</h1>
      </header>
      <BookForm
        initial={book}
        // Photo upload is for books that never had an online cover.
        allowCoverUpload={!book.originalCoverUrl}
        showShelving={book.list === 'owned'}
        submitLabel="Save Changes"
        onSubmit={async ({ fields, coverFile, removeCustomCover }) => {
          const changes = { ...fields };
          if (coverFile || removeCustomCover) {
            if (book.customCoverId) await deleteCoverImage(book.customCoverId);
            changes.customCoverId = coverFile ? await saveCoverImage(coverFile) : undefined;
          }
          await updateBook(book.id, changes);
          showToast('Saved');
          goBack('/book/' + book.id);
        }}
      />
    </div>
  );
}

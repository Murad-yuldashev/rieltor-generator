import { useState } from 'react';
import { Link } from 'react-router';
import { ListingCard } from '@/entities/listing';
import { NoteEditor, useNotes } from '@/features/notes';
import { Icon } from '@/shared/ui/icon';

interface Editing {
  listingId: string;
  title: string;
}

/**
 * "Mening eslatmalarim" — every listing the realtor has a private note on
 * (`GET /api/agent/notes`, newest first). Each row is the listing card with its
 * note snippet; the card's action re-opens the editor to edit or delete. Deleting
 * the last note invalidates the list, so the row disappears on close.
 */
export function NotesPage() {
  const { data: notes, isPending, isError } = useNotes();
  const [editing, setEditing] = useState<Editing | null>(null);

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2"
      >
        <Icon name="chevronLeft" className="size-4" />
        Kabinetga qaytish
      </Link>

      <header className="mb-5">
        <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Mening eslatmalarim</h1>
      </header>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError ? (
        <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
          Eslatmalarni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : !notes || notes.length === 0 ? (
        <div className="rounded-card bg-card p-8 text-center shadow-card">
          <p className="text-[15px] font-bold text-ink">Hali eslatma yo'q</p>
          <p className="mt-1 text-[13px] font-medium text-ink-2">
            E'lonlarni ko'rib chiqib, ularga shaxsiy eslatma qo'shing.
          </p>
          <Link
            to="/browse"
            className="mt-4 inline-flex items-center gap-1.5 rounded-[12px] bg-accent-soft px-4 py-2.5 text-[13px] font-bold text-accent-dark"
          >
            <Icon name="search" className="size-4" strokeWidth={2.2} />
            E'lonlarni ko'rish
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((note, i) => (
            <ListingCard
              key={note.listingId}
              listing={note.listing}
              isFirst={i === 0}
              hasNote
              noteSnippet={note.body}
              onNote={() => setEditing({ listingId: note.listingId, title: note.listing.title })}
            />
          ))}
        </div>
      )}

      {editing && (
        <NoteEditor
          listingId={editing.listingId}
          listingTitle={editing.title}
          onClose={() => setEditing(null)}
        />
      )}
    </main>
  );
}

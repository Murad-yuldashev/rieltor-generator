import { useState } from 'react';
import { Icon } from '@/shared/ui/icon';
import { useSetItemNote } from '@/features/presentations';

const NOTE_MAX = 500;

interface Props {
  collectionId: string;
  listingId: string;
  /** The item's current client-facing note (null when none is set yet). */
  note: string | null;
}

/**
 * Inline editor for one collection item's CLIENT-FACING note — the text the buyer
 * reads under this listing in the shared presentation. This is deliberately DISTINCT
 * from the realtor's private note (the "Eslatma" editor on the browse page), which
 * the client never sees; the label spells that out so the two are never confused.
 * Saving an empty box clears the note (sends `null`).
 */
export function ClientNoteEditor({ collectionId, listingId, note }: Props) {
  const setNote = useSetItemNote(collectionId);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  function startEdit() {
    setValue(note ?? '');
    setEditing(true);
  }

  function handleSave() {
    if (setNote.isPending) return;
    const trimmed = value.trim();
    setNote.mutate(
      { listingId, note: trimmed.length === 0 ? null : trimmed },
      { onSuccess: () => setEditing(false) },
    );
  }

  if (!editing) {
    return (
      <div className="rounded-[12px] bg-surface p-3">
        <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-ink-3 uppercase">
          <Icon name="eye" className="size-3.5" strokeWidth={2.2} />
          Mijozga izoh (taqdimotda ko'rinadi)
        </p>
        {note ? (
          <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-2">
            {note}
          </p>
        ) : (
          <p className="mt-1.5 text-[13px] text-ink-3">Mijoz uchun izoh qo'shilmagan.</p>
        )}
        <button
          type="button"
          onClick={startEdit}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-bold text-accent-dark"
        >
          <Icon name="doc" className="size-3.5" strokeWidth={2.2} />
          {note ? 'Izohni tahrirlash' : "Izoh qo'shish"}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[12px] bg-surface p-3">
      <label className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-ink-3 uppercase">
        <Icon name="eye" className="size-3.5" strokeWidth={2.2} />
        Mijozga izoh (taqdimotda ko'rinadi)
      </label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={NOTE_MAX}
        rows={3}
        autoFocus
        placeholder="Masalan: Yorug' xonalar, metroga yaqin, tez ko'chib o'tsa bo'ladi..."
        className="mt-1.5 w-full resize-y rounded-[10px] border border-line bg-card px-3 py-2 text-[14px] text-ink outline-none focus:border-accent"
      />
      <p className="mt-1 text-right text-[11px] font-medium text-ink-3">
        {value.length}/{NOTE_MAX}
      </p>

      {setNote.isError && (
        <p className="text-[13px] font-semibold text-brand-rose">
          Saqlab bo'lmadi. Qaytadan urinib ko'ring.
        </p>
      )}

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="rounded-[10px] border border-line px-3.5 py-2 text-[13px] font-bold text-ink-2"
        >
          Bekor
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={setNote.isPending}
          className="flex-1 rounded-[10px] bg-accent px-3.5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
        >
          {setNote.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
        </button>
      </div>
    </div>
  );
}

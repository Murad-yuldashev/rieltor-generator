import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/shared/ui/icon';
import { useDeleteNote, useNote, useSaveNote } from '../use-note';

const BODY_MAX = 2000;

interface Props {
  listingId: string;
  /** Shown in the modal header so the realtor knows which listing they are annotating. */
  listingTitle: string;
  onClose: () => void;
}

/**
 * The private-note editor — a modal over one listing. Loads the current note (if
 * any) from `GET /api/agent/notes/:listingId`, lets the realtor write/update it
 * (`PUT`, min 1 char) or delete it (`DELETE`, shown only when a note exists).
 * The note is private to the realtor; buyers never see it.
 */
export function NoteEditor({ listingId, listingTitle, onClose }: Props) {
  const { data: note, isPending } = useNote(listingId);
  const save = useSaveNote();
  const remove = useDeleteNote();

  const [body, setBody] = useState('');

  // Seed the textarea from the server note exactly once, after it loads. A guard
  // ref keeps a later background refetch from clobbering in-progress edits.
  const seeded = useRef(false);
  useEffect(() => {
    if (isPending || seeded.current) return;
    seeded.current = true;
    setBody(note?.body ?? '');
  }, [isPending, note]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const trimmed = body.trim();
  const busy = save.isPending || remove.isPending;

  function handleSave() {
    if (trimmed.length === 0 || busy) return;
    save.mutate({ listingId, body: trimmed }, { onSuccess: onClose });
  }

  function handleDelete() {
    if (busy) return;
    remove.mutate(listingId, { onSuccess: onClose });
  }

  return (
    // The backdrop is the "close" target; the panel stops the click bubbling so a
    // tap inside never dismisses it.
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="note-editor-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-[18px] bg-card p-6 shadow-card"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="note-editor-title"
              className="text-[19px] font-extrabold tracking-tight text-ink"
            >
              Eslatma
            </h2>
            <p className="mt-0.5 line-clamp-1 text-[13px] font-medium text-ink-2">{listingTitle}</p>
          </div>
          <button
            type="button"
            aria-label="Yopish"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-surface"
          >
            <Icon name="close" className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        {isPending ? (
          <p className="mt-5 text-[14px] font-semibold text-ink-2">Yuklanmoqda...</p>
        ) : (
          <div className="mt-5">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={BODY_MAX}
              rows={5}
              autoFocus
              placeholder="Bu e'lon haqida shaxsiy eslatma yozing..."
              className="w-full resize-y rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
            />
            <p className="mt-1 text-right text-[11px] font-medium text-ink-3">
              {body.length}/{BODY_MAX}
            </p>

            {(save.isError || remove.isError) && (
              <p className="mt-1 text-[13px] font-semibold text-brand-rose">
                Xatolik yuz berdi. Qaytadan urinib ko'ring.
              </p>
            )}

            <div className="mt-4 flex gap-2">
              {note && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className="rounded-[14px] border border-line px-4 py-3 text-[15px] font-bold text-brand-rose disabled:opacity-50"
                >
                  {remove.isPending ? "O'chirilmoqda..." : "O'chirish"}
                </button>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={trimmed.length === 0 || busy}
                className="flex-1 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {save.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

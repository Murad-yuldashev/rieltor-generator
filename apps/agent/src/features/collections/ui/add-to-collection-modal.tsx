import { useEffect, useState } from 'react';
import { Icon } from '@/shared/ui/icon';
import { useAddCollectionItem, useCollections, useCreateCollection } from '../use-collections';

const NAME_MAX = 80;

interface Props {
  listingId: string;
  /** Shown in the header so the realtor knows which listing they are filing. */
  listingTitle: string;
  onClose: () => void;
}

/**
 * The add-to-collection picker — a modal over one listing. Lists the realtor's
 * collections (`GET /api/agent/collections`); tapping one appends the listing
 * (`POST …/items`, idempotent). A "Yangi kolleksiya" affordance creates a
 * collection and files the listing into it in one go. Added rows show a "Qo'shildi"
 * confirmation; the modal stays open so the realtor can file into several at once.
 */
export function AddToCollectionModal({ listingId, listingTitle, onClose }: Props) {
  const { data: collections, isPending } = useCollections();
  const addItem = useAddCollectionItem();
  const createCollection = useCreateCollection();

  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const busy = addItem.isPending || createCollection.isPending;

  function markAdded(collectionId: string) {
    setAddedIds((prev) => new Set(prev).add(collectionId));
  }

  function handleAdd(collectionId: string) {
    if (busy) return;
    setIsError(false);
    setPendingId(collectionId);
    addItem.mutate(
      { collectionId, listingId },
      {
        onSuccess: () => markAdded(collectionId),
        onError: () => setIsError(true),
        onSettled: () => setPendingId(null),
      },
    );
  }

  async function handleCreate() {
    const name = newName.trim();
    if (name.length === 0 || busy) return;
    setIsError(false);
    try {
      const created = await createCollection.mutateAsync(name);
      await addItem.mutateAsync({ collectionId: created.id, listingId });
      markAdded(created.id);
      setNewName('');
      setCreating(false);
    } catch {
      setIsError(true);
    }
  }

  const hasCollections = (collections?.length ?? 0) > 0;

  return (
    // The backdrop closes; the panel stops the click so a tap inside never dismisses.
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="collection-picker-title"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[80dvh] w-full max-w-[400px] flex-col rounded-[18px] bg-card p-6 shadow-card"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="collection-picker-title"
              className="text-[19px] font-extrabold tracking-tight text-ink"
            >
              Kolleksiyaga qo'shish
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

        <div className="mt-5 flex-1 overflow-y-auto">
          {isPending ? (
            <p className="text-[14px] font-semibold text-ink-2">Yuklanmoqda...</p>
          ) : (
            <div className="flex flex-col gap-2">
              {hasCollections ? (
                collections?.map((collection) => {
                  const added = addedIds.has(collection.id);
                  const rowPending = pendingId === collection.id && addItem.isPending;
                  return (
                    <button
                      key={collection.id}
                      type="button"
                      onClick={() => handleAdd(collection.id)}
                      disabled={busy}
                      className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-3.5 py-3 text-left disabled:opacity-60"
                    >
                      <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                        <Icon name="heart" className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-ink">
                          {collection.name}
                        </span>
                        <span className="block text-[12px] font-medium text-ink-3">
                          {collection.itemCount} ta e'lon
                        </span>
                      </span>
                      {added ? (
                        <span className="inline-flex items-center gap-1 text-[13px] font-bold text-accent">
                          <Icon name="check" className="size-4" strokeWidth={2.6} />
                          Qo'shildi
                        </span>
                      ) : rowPending ? (
                        <span className="text-[13px] font-semibold text-ink-3">...</span>
                      ) : (
                        <Icon name="chevronRight" className="size-5 text-ink-3" />
                      )}
                    </button>
                  );
                })
              ) : (
                <p className="text-[13px] font-medium text-ink-2">
                  Hali kolleksiya yo'q. Yangisini yarating.
                </p>
              )}
            </div>
          )}

          {isError && (
            <p className="mt-2 text-[13px] font-semibold text-brand-rose">
              Xatolik yuz berdi. Qaytadan urinib ko'ring.
            </p>
          )}
        </div>

        <div className="mt-4 border-t border-line pt-4">
          {creating ? (
            <div className="flex flex-col gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={NAME_MAX}
                autoFocus
                placeholder="Kolleksiya nomi"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                className="w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreating(false);
                    setNewName('');
                  }}
                  className="rounded-[12px] border border-line px-4 py-2.5 text-[14px] font-bold text-ink-2"
                >
                  Bekor
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={newName.trim().length === 0 || busy}
                  className="flex-1 rounded-[12px] bg-accent py-2.5 text-[14px] font-bold text-white disabled:opacity-50"
                >
                  {busy ? "Qo'shilmoqda..." : "Yaratish va qo'shish"}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-[12px] bg-accent-soft py-2.5 text-[14px] font-bold text-accent-dark"
            >
              <Icon name="doc" className="size-4" strokeWidth={2.2} />
              Yangi kolleksiya
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

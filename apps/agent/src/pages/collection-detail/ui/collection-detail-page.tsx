import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import type { CollectionItem } from '@rieltor/shared';
import { ListingCard } from '@/entities/listing';
import {
  useCollection,
  useDeleteCollection,
  useRemoveCollectionItem,
  useRenameCollection,
  useReorderCollection,
} from '@/features/collections';
import { Icon } from '@/shared/ui/icon';

const NAME_MAX = 80;

/**
 * A single collection ("podborka"): its ordered items rendered with the shared
 * listing card, plus per-item reorder (up/down) and remove controls, and header
 * affordances to rename or delete the whole collection. Reorder rebuilds the FULL
 * ordered `listingIds` array and PATCHes it (`…/items`).
 */
export function CollectionDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();

  const { data: collection, isPending, isError } = useCollection(id);
  const rename = useRenameCollection();
  const removeCollection = useDeleteCollection();
  const removeItem = useRemoveCollectionItem();
  const reorder = useReorderCollection();

  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');

  function startRename() {
    setName(collection?.name ?? '');
    setRenaming(true);
  }

  function handleRename() {
    const trimmed = name.trim();
    if (trimmed.length === 0 || rename.isPending) return;
    rename.mutate({ id, name: trimmed }, { onSuccess: () => setRenaming(false) });
  }

  function handleDelete() {
    if (removeCollection.isPending) return;
    if (!window.confirm("Bu kolleksiya o'chirilsinmi?")) return;
    removeCollection.mutate(id, { onSuccess: () => navigate('/collections') });
  }

  /** Swap the item at `index` with its neighbour and PATCH the full new order. */
  function move(items: CollectionItem[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length || reorder.isPending) return;
    const listingIds = items.map((it) => it.listingId);
    const current = listingIds[index];
    const neighbour = listingIds[target];
    if (current === undefined || neighbour === undefined) return;
    listingIds[index] = neighbour;
    listingIds[target] = current;
    reorder.mutate({ collectionId: id, listingIds });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <Link
        to="/collections"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2"
      >
        <Icon name="chevronLeft" className="size-4" />
        Kolleksiyalarim
      </Link>

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError || !collection ? (
        <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
          Kolleksiyani yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : (
        <>
          <header className="mb-5">
            <p className="text-[13px] font-semibold text-ink-2">Kolleksiya</p>
            {renaming ? (
              <div className="mt-1.5 flex flex-col gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={NAME_MAX}
                  autoFocus
                  placeholder="Kolleksiya nomi"
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  className="w-full rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-[17px] font-bold text-ink outline-none focus:border-accent"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRenaming(false)}
                    className="rounded-[12px] border border-line px-4 py-2 text-[13px] font-bold text-ink-2"
                  >
                    Bekor
                  </button>
                  <button
                    type="button"
                    onClick={handleRename}
                    disabled={name.trim().length === 0 || rename.isPending}
                    className="rounded-[12px] bg-accent px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
                  >
                    {rename.isPending ? 'Saqlanmoqda...' : 'Saqlash'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-0.5 flex items-start justify-between gap-3">
                <h1 className="text-[22px] font-extrabold tracking-tight text-ink">
                  {collection.name}
                </h1>
                <div className="mt-1 flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={startRename}
                    aria-label="Nomini o'zgartirish"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-ink-2 shadow-card"
                  >
                    <Icon name="doc" className="size-4" strokeWidth={2.2} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={removeCollection.isPending}
                    aria-label="Kolleksiyani o'chirish"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-brand-rose shadow-card disabled:opacity-50"
                  >
                    <Icon name="close" className="size-4" strokeWidth={2.4} />
                  </button>
                </div>
              </div>
            )}
          </header>

          {collection.items.length === 0 ? (
            <div className="rounded-card bg-card p-8 text-center shadow-card">
              <p className="text-[15px] font-bold text-ink">Bu kolleksiya bo'sh — e'lon qo'shing</p>
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
              {collection.items.map((item, i) => (
                <ListingCard
                  key={item.listingId}
                  listing={item.listing}
                  isFirst={i === 0}
                  noteSnippet={item.note ?? undefined}
                  footer={
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => move(collection.items, i, -1)}
                        disabled={i === 0 || reorder.isPending}
                        aria-label="Yuqoriga"
                        className="flex flex-1 items-center justify-center rounded-[12px] bg-surface py-2.5 text-ink-2 disabled:opacity-40"
                      >
                        <Icon name="chevronUp" className="size-4" strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        onClick={() => move(collection.items, i, 1)}
                        disabled={i === collection.items.length - 1 || reorder.isPending}
                        aria-label="Pastga"
                        className="flex flex-1 items-center justify-center rounded-[12px] bg-surface py-2.5 text-ink-2 disabled:opacity-40"
                      >
                        <Icon name="chevronDown" className="size-4" strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          removeItem.mutate({ collectionId: id, listingId: item.listingId })
                        }
                        disabled={removeItem.isPending}
                        className="flex flex-[2] items-center justify-center gap-1.5 rounded-[12px] bg-surface py-2.5 text-[13px] font-bold text-brand-rose disabled:opacity-50"
                      >
                        <Icon name="close" className="size-4" strokeWidth={2.4} />
                        Olib tashlash
                      </button>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

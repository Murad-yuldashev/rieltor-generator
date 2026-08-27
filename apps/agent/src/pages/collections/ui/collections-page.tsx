import { useState } from 'react';
import { Link } from 'react-router';
import { useCollections, useCreateCollection } from '@/features/collections';
import { Icon } from '@/shared/ui/icon';

const NAME_MAX = 80;

/**
 * "Kolleksiyalarim" — the realtor's collections (`GET /api/agent/collections`,
 * newest first). Each card links to its detail; a "Yangi kolleksiya" affordance
 * reveals an inline name input that creates one (`POST /api/agent/collections`).
 */
export function CollectionsPage() {
  const { data: collections, isPending, isError } = useCollections();
  const createCollection = useCreateCollection();

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  function handleCreate() {
    const trimmed = name.trim();
    if (trimmed.length === 0 || createCollection.isPending) return;
    createCollection.mutate(trimmed, {
      onSuccess: () => {
        setName('');
        setCreating(false);
      },
    });
  }

  return (
    <main className="mx-auto min-h-dvh max-w-content bg-surface px-4 py-6">
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2"
      >
        <Icon name="chevronLeft" className="size-4" />
        Kabinetga qaytish
      </Link>

      <header className="mb-5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-ink-2">Rieltor kabineti</p>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink">Kolleksiyalarim</h1>
        </div>
        {!creating && (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-[12px] bg-accent px-3.5 py-2.5 text-[13px] font-bold text-white"
          >
            <Icon name="doc" className="size-4" strokeWidth={2.2} />
            Yangi
          </button>
        )}
      </header>

      {creating && (
        <div className="mb-5 rounded-card bg-card p-4 shadow-card">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={NAME_MAX}
            autoFocus
            placeholder="Kolleksiya nomi"
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="w-full rounded-[12px] border border-line bg-surface px-3.5 py-2.5 text-[15px] text-ink outline-none focus:border-accent"
          />
          {createCollection.isError && (
            <p className="mt-2 text-[13px] font-semibold text-brand-rose">
              Xatolik yuz berdi. Qaytadan urinib ko'ring.
            </p>
          )}
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setName('');
              }}
              className="rounded-[12px] border border-line px-4 py-2.5 text-[14px] font-bold text-ink-2"
            >
              Bekor
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={name.trim().length === 0 || createCollection.isPending}
              className="flex-1 rounded-[12px] bg-accent py-2.5 text-[14px] font-bold text-white disabled:opacity-50"
            >
              {createCollection.isPending ? 'Yaratilmoqda...' : 'Yaratish'}
            </button>
          </div>
        </div>
      )}

      {isPending ? (
        <p className="text-[15px] font-semibold text-ink-2">Yuklanmoqda...</p>
      ) : isError ? (
        <p className="rounded-card bg-card p-4 text-[14px] font-semibold text-brand-rose shadow-card">
          Kolleksiyalarni yuklab bo'lmadi. Sahifani yangilang.
        </p>
      ) : !collections || collections.length === 0 ? (
        <div className="rounded-card bg-card p-8 text-center shadow-card">
          <p className="text-[15px] font-bold text-ink">Hali kolleksiya yo'q</p>
          <p className="mt-1 text-[13px] font-medium text-ink-2">
            E'lonlarni to'plamlarga guruhlab, mijozlarga qulay ulashing.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.id}`}
              className="flex items-center gap-3 rounded-card bg-card px-4 py-3.5 shadow-card"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Icon name="heart" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-ink">
                  {collection.name}
                </span>
                <span className="block text-[13px] font-medium text-ink-2">
                  {collection.itemCount} ta e'lon
                </span>
              </span>
              <Icon name="chevronRight" className="size-5 text-ink-3" />
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

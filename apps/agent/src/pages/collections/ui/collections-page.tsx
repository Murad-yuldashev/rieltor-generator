import { useState } from 'react';
import { Link } from 'react-router';
import { useCollections, useCreateCollection } from '@/features/collections';
import { Icon } from '@/shared/ui/icon';
import { StatTile, StatTileRow } from '@/shared/ui/stat-tile';
import { CollectionCard } from './collection-card';

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

  // Client-derived summary tiles over the loaded list.
  const list = collections ?? [];
  const totalItems = list.reduce((s, c) => s + c.itemCount, 0);
  const emptyCount = list.filter((c) => c.itemCount === 0).length;
  const lastUpdated = list.length
    ? new Date(Math.max(...list.map((c) => new Date(c.updatedAt).getTime()))).toLocaleDateString(
        'uz-UZ',
      )
    : '—';

  return (
    <main className="flex flex-col gap-5">
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] font-semibold text-ink-2">
        <Icon name="chevronLeft" className="size-4" />
        Kabinetga qaytish
      </Link>

      <header className="flex items-end justify-between gap-3">
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
        <div className="rounded-card bg-card p-4 shadow-card">
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
      ) : list.length === 0 ? (
        <div className="rounded-card bg-card p-8 text-center shadow-card">
          <p className="text-[15px] font-bold text-ink">Hali kolleksiya yo'q</p>
          <p className="mt-1 text-[13px] font-medium text-ink-2">
            E'lonlarni to'plamlarga guruhlab, mijozlarga qulay ulashing.
          </p>
        </div>
      ) : (
        <>
          <StatTileRow className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Jami kolleksiyalar" value={list.length} />
            <StatTile label="Jami e'lonlar" value={totalItems} />
            <StatTile
              label="Bo'sh kolleksiyalar"
              value={emptyCount}
              tone={emptyCount > 0 ? 'rose' : 'default'}
            />
            <StatTile label="So'nggi yangilangan" value={lastUpdated} />
          </StatTileRow>
          <div className="flex flex-col gap-3 md:grid md:grid-cols-2 lg:grid-cols-3 desk:grid-cols-4">
            {list.map((c) => (
              <CollectionCard key={c.id} collection={c} />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

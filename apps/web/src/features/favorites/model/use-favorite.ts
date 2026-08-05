import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'rieltor:favorites';

/**
 * Favourites live in localStorage. The heart on a list card and the heart on the
 * listing page can point at the same listing, so the state is held at module
 * level and broadcast through useSyncExternalStore — every button updates at once.
 */
let ids: ReadonlySet<string> = load();
const listeners = new Set<() => void>();

function load(): ReadonlySet<string> {
  // Private mode, exceeded quota, corrupted JSON — none of these may break the page.
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

function save(next: ReadonlySet<string>) {
  ids = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
  } catch {
    // Even if it cannot be persisted, the choice stays visible for this session.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** One stable reference for the empty result, so useSyncExternalStore settles. */
const NO_IDS: readonly string[] = [];

/** For the favourites page — every saved id, in the order it was added. */
export function useFavoriteIds(): readonly string[] {
  return useSyncExternalStore(
    subscribe,
    () => cachedList(),
    () => NO_IDS,
  );
}

// useSyncExternalStore calls getSnapshot on every render and compares the result
// with Object.is — returning a fresh array each time would loop forever. So the
// array is rebuilt only when `ids` itself changes.
let cachedSource: ReadonlySet<string> | null = null;
let cachedIds: readonly string[] = NO_IDS;

function cachedList(): readonly string[] {
  if (cachedSource !== ids) {
    cachedSource = ids;
    cachedIds = [...ids];
  }
  return cachedIds;
}

export function useFavorite(id: string) {
  const isFavorite = useSyncExternalStore(
    subscribe,
    () => ids.has(id),
    // Nothing is marked on the server — the first render shows an empty heart.
    () => false,
  );

  const toggle = useCallback(() => {
    const next = new Set(ids);
    if (!next.delete(id)) next.add(id);
    save(next);
  }, [id]);

  return { isFavorite, toggle };
}

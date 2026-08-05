import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'rieltor:recent-searches';
/** Four chips is roughly what fits the two rows the section is capped at. */
const LIMIT = 4;

/**
 * The "So'nggi qidiruvlar" chips. Same pattern as favourites: state at module
 * level, broadcast through useSyncExternalStore, so the chips refresh the
 * moment a search is submitted.
 */
let queries: readonly string[] = load();
const listeners = new Set<() => void>();

function load(): readonly string[] {
  // Private mode or corrupted JSON — neither may break the page.
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string').slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

function save(next: readonly string[]) {
  queries = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Even if it cannot be persisted, the list stays visible for this session.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const NO_QUERIES: readonly string[] = [];

export function useSearchHistory() {
  const recent = useSyncExternalStore(
    subscribe,
    () => queries,
    () => NO_QUERIES,
  );

  const remember = useCallback((query: string) => {
    const text = query.trim();
    if (!text) return;
    // A repeated query moves to the front and the list stays bounded.
    const rest = queries.filter((q) => q.toLowerCase() !== text.toLowerCase());
    save([text, ...rest].slice(0, LIMIT));
  }, []);

  const clear = useCallback(() => save([]), []);

  return { recent, remember, clear };
}

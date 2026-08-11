export interface UserLocation {
  lat: number;
  lng: number;
  /** District name, for the header chip. */
  label: string;
  source: 'gps' | 'manual';
}

export type LocationStatus = 'idle' | 'locating' | 'ready' | 'denied';

const STORAGE_KEY = 'rieltor:user-location';

/**
 * Module-level rather than React context: the header chip, the home list and the
 * listing page all need the same point, and they sit in three different subtrees.
 * A store with useSyncExternalStore keeps them in step without wrapping the app.
 */
let location: UserLocation | null = read();
let status: LocationStatus = location ? 'ready' : 'idle';
const listeners = new Set<() => void>();

function read(): UserLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as UserLocation;
    // A partially-corrupt entry — e.g. hand-edited storage, or a shape from an
    // older build — must not reach the app: `label` in particular flows straight
    // into a `.replace()` in location-chip.tsx, and there is no ErrorBoundary to
    // catch a crash from a non-string value.
    return typeof parsed.lat === 'number' &&
      typeof parsed.lng === 'number' &&
      typeof parsed.label === 'string' &&
      (parsed.source === 'gps' || parsed.source === 'manual')
      ? parsed
      : null;
  } catch {
    // A corrupt entry is not worth crashing the app over.
    return null;
  }
}

function emit() {
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getLocation(): UserLocation | null {
  return location;
}

export function getStatus(): LocationStatus {
  return status;
}

export function setStatus(next: LocationStatus): void {
  status = next;
  emit();
}

export function setLocation(next: UserLocation): void {
  location = next;
  status = 'ready';
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode can refuse writes; the location still works for this session.
  }
  emit();
}

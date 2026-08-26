import { useSyncExternalStore } from 'react';

/**
 * A one-flag store for the app-wide login modal. The "Kirish" affordance can be
 * triggered from many places — the guarded shell, and any feature that needs an
 * anonymous visitor to sign in first. Holding the open flag at module level and
 * broadcasting through useSyncExternalStore lets any layer call `openLoginModal()`
 * without threading modal state through props.
 *
 * It lives in `entities/session` rather than `features/auth` on purpose: a
 * feature may only import entities/shared, so the trigger has to sit below the
 * feature layer. The modal component itself stays in `features/auth`, mounted
 * once at the app root and driven by this flag.
 */
let isOpen = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openLoginModal() {
  if (isOpen) return;
  isOpen = true;
  emit();
}

export function closeLoginModal() {
  if (!isOpen) return;
  isOpen = false;
  emit();
}

/** Subscribe to the modal's open flag — the app-root host renders on it. */
export function useLoginModalOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isOpen,
    // Server/first paint has nothing open.
    () => false,
  );
}

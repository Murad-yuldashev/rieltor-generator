import { useEffect, useState } from 'react';
import { Icon } from '@/shared/ui/icon';
import { useUserLocation } from '../model/use-user-location';
import { LocationPicker } from './location-picker';

/**
 * Sits where the static "Toshkent" label used to. Detection runs once on mount —
 * after the first paint, so it never delays the LCP — and only when nothing is
 * stored yet. A refusal is final: the visitor picks from the map instead.
 */
export function LocationChip() {
  const { location, status, detect } = useUserLocation();
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (status !== 'idle') return;
    // Deferred a tick so the first paint still shows the invite label — a synchronous
    // call here would flip straight to "locating" before anything reaches the screen.
    const id = setTimeout(detect, 0);
    return () => clearTimeout(id);
  }, [status, detect]);

  const label = location?.label ?? (status === 'locating' ? 'Aniqlanmoqda…' : 'Joyni tanlash');
  // Every district label ends in " tumani"; the suffix is the same on all of them,
  // so dropping it buys back room for the part that actually identifies the place.
  const shortLabel = label.replace(/\s+tumani$/, '');

  return (
    <>
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        title={label}
        className="flex max-w-[105px] shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-[7px] text-[13px] font-semibold text-ink-2"
      >
        <Icon name="pin" className="h-[13px] w-[13px] shrink-0 text-accent" strokeWidth={2.4} />
        <span className="truncate">{shortLabel}</span>
      </button>

      <LocationPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  );
}

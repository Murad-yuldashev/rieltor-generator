import { useEffect, useRef, useState } from 'react';
import { loadYandexMaps } from '@/shared/lib/yandex-maps';
import { useUserLocation } from '../model/use-user-location';

interface Props {
  open: boolean;
  onClose: () => void;
}

/** Tashkent centre — where the map starts when nothing better is known. */
const FALLBACK_CENTER = { lat: 41.2995, lng: 69.2401 };
const ZOOM = 13;
/** Matches the geolocation timeout already used elsewhere in this feature. */
const LOAD_TIMEOUT_MS = 10_000;

/**
 * The one place an interactive map earns its ~300 KB: the visitor drags the map
 * under a fixed pin and the centre becomes their location. The script loads when
 * this opens, never before.
 */
export function LocationPicker({ open, onClose }: Props) {
  const { location, setManual, detect } = useUserLocation();
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<{ getCenter(): [number, number]; destroy(): void } | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Tracked separately from `error`: reading mapRef during render wouldn't
  // re-render when the map becomes ready, and "no error yet" isn't the same as
  // "a map actually exists" while the load is still in flight.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!open) return;

    // The container stays mounted across an error (see below), so a retry must
    // clear the previous attempt's error itself instead of relying on unmounting.
    setError(null);
    setReady(false);

    let cancelled = false;
    const start = location ?? FALLBACK_CENTER;

    // If the script loads but ymaps.ready() never fires — a content blocker, a
    // stalled CDN, a key that answers 200 without initialising — the promise
    // below never settles. Without this, the visitor sees an empty grey box
    // forever with no explanation.
    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      cancelled = true;
      setError("Xaritani yuklab bo'lmadi. Keyinroq urinib ko'ring.");
    }, LOAD_TIMEOUT_MS);

    loadYandexMaps()
      .then((ymaps) => {
        if (cancelled || !container.current) return;
        clearTimeout(timeoutId);
        const maps = ymaps as unknown as {
          Map: new (
            el: HTMLElement,
            state: { center: [number, number]; zoom: number; controls: string[] },
          ) => { getCenter(): [number, number]; destroy(): void };
        };
        // Yandex orders coordinates latitude-first in the JS API.
        mapRef.current = new maps.Map(container.current, {
          center: [start.lat, start.lng],
          zoom: ZOOM,
          controls: ['zoomControl'],
        });
        setReady(true);
      })
      .catch(() => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        setError(
          import.meta.env.VITE_YANDEX_MAPS_KEY
            ? "Xaritani yuklab bo'lmadi. Keyinroq urinib ko'ring."
            : 'Xarita sozlanmagan.',
        );
      });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      mapRef.current?.destroy();
      mapRef.current = null;
    };
  }, [open, location]);

  if (!open) return null;

  function confirm() {
    const center = mapRef.current?.getCenter();
    if (!center) return;
    setManual({ lat: center[0], lng: center[1] });
    onClose();
  }

  return (
    <div
      role="dialog"
      aria-label="Joyni tanlash"
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/40"
    >
      <div className="rounded-t-[20px] bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[16px] font-extrabold">Joyingizni tanlang</h2>
          <button type="button" onClick={onClose} className="text-[14px] font-bold text-ink-3">
            Yopish
          </button>
        </div>

        <div className="relative">
          {/* Stays mounted through an error so its ref survives for a retry — the
              earlier bug swapped it out for the message below, which left `container`
              null forever and made every later open a no-op. */}
          <div ref={container} className="h-[260px] w-full overflow-hidden rounded-[14px]" />
          {!error && (
            /* The pin never moves; the map slides underneath it. */
            <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full text-[28px]">
              📍
            </span>
          )}
          {error && (
            <p className="absolute inset-0 flex items-center justify-center rounded-[14px] bg-card px-4 text-center text-[14px] font-semibold text-ink-2">
              {error}
            </p>
          )}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={detect}
            className="flex-1 rounded-[14px] border-[1.5px] border-line py-3 text-[14px] font-extrabold text-ink-2"
          >
            Meni topish
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!ready}
            className="flex-1 rounded-[14px] bg-accent py-3 text-[14px] font-extrabold text-white disabled:opacity-60"
          >
            Shu yerni tanlash
          </button>
        </div>
      </div>
    </div>
  );
}

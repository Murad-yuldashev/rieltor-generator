import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/shared/ui/icon';
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

  // Rendered into <body>, not in place. The chip that opens this sheet lives inside
  // the site header, and the header carries backdrop-blur — a backdrop-filter makes
  // its element the containing block for any fixed-position descendant. Left in
  // place, `inset-0` resolved against the 60px header instead of the viewport, so the
  // map sat above the top edge and only the buttons were visible.
  return createPortal(
    <div
      role="dialog"
      aria-label="Joyni tanlash"
      className="fixed inset-0 z-[60] flex flex-col justify-end bg-ink/40"
    >
      {/* 85vh: the map is the whole point of this sheet, so it gets almost the screen. */}
      <div className="flex h-[85vh] flex-col rounded-t-[20px] bg-card p-3">
        <div className="mb-2 flex shrink-0 items-center justify-between px-1">
          <h2 className="text-[16px] font-extrabold">Joyingizni tanlang</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Yopish"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white"
          >
            <Icon name="close" className="h-[18px] w-[18px]" strokeWidth={2.6} />
          </button>
        </div>

        <div className="relative min-h-0 flex-1">
          {/* Stays mounted through an error so its ref survives for a retry — the
              earlier bug swapped it out for the message below, which left `container`
              null forever and made every later open a no-op. */}
          <div ref={container} className="h-full w-full overflow-hidden rounded-[14px]" />
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

          {/* Both controls float over the map, the way a map app puts them. Icon-only,
              so they carry aria-labels — the label is also what the tests query by. */}
          <button
            type="button"
            onClick={detect}
            aria-label="Meni topish"
            className="absolute right-3 bottom-[76px] flex h-11 w-11 items-center justify-center rounded-full bg-card text-ink-2 shadow-card"
          >
            <Icon name="crosshair" className="h-5 w-5" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={!ready}
            aria-label="Shu yerni tanlash"
            className="absolute right-3 bottom-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-card disabled:opacity-60"
          >
            <Icon name="check" className="h-6 w-6" strokeWidth={2.8} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

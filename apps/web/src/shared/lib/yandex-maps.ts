/** Only the slice of the 2.1 API this app touches. */
export interface YandexMaps {
  ready(callback: () => void): void;
}

declare global {
  interface Window {
    ymaps?: YandexMaps;
  }
}

/**
 * Version 2.1 rather than 3: its imperative `map.getCenter()` is exactly what the
 * picker needs, and it has been stable for years. The script is ~300 KB, which is
 * why nothing outside the picker ever calls this.
 */
const SRC_BASE = 'https://api-maps.yandex.ru/2.1/';

/** Cached across calls: two pickers opening in one session share one download. */
let pending: Promise<YandexMaps> | null = null;

export function loadYandexMaps(): Promise<YandexMaps> {
  if (pending) return pending;

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_KEY ?? '';
  if (!apiKey) {
    return Promise.reject(new Error('Yandex Maps kaliti sozlanmagan'));
  }

  pending = new Promise<YandexMaps>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${SRC_BASE}?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;

    script.addEventListener('load', () => {
      const ymaps = window.ymaps;
      if (!ymaps) {
        // Same rule as the error listener: a failure must not be cached, or every
        // later call replays this rejection instead of retrying.
        pending = null;
        reject(new Error('Yandex Maps yuklanmadi'));
        return;
      }
      // ready() fires once the API's own modules are in place.
      ymaps.ready(() => resolve(ymaps));
    });

    script.addEventListener('error', () => {
      // Let a later attempt retry rather than caching the failure forever.
      pending = null;
      reject(new Error('Yandex Maps yuklanmadi'));
    });

    document.head.appendChild(script);
  });

  return pending;
}

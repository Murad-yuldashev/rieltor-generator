import { afterEach, describe, expect, it, vi } from 'vitest';

/** The loader caches its promise per module instance, so each test needs a fresh one. */
async function freshLoader() {
  vi.resetModules();
  return (await import('./yandex-maps')).loadYandexMaps;
}

afterEach(() => {
  vi.unstubAllEnvs();
  document.querySelectorAll('script').forEach((node) => node.remove());
});

describe('loadYandexMaps', () => {
  it('rejects when the key is not configured', async () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', '');
    const loadYandexMaps = await freshLoader();

    await expect(loadYandexMaps()).rejects.toThrow(/kalit/i);
    expect(document.querySelector('script')).toBeNull();
  });

  it('injects the script once and resolves with the global', async () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    const loadYandexMaps = await freshLoader();

    const first = loadYandexMaps();
    const second = loadYandexMaps();

    const scripts = document.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.src).toContain('api-maps.yandex.ru');
    expect(scripts[0]!.src).toContain('apikey=test-key');

    // The real API calls ready(); stand in for it, then let the script "load".
    const ymaps = { ready: (cb: () => void) => cb() };
    (window as unknown as { ymaps: typeof ymaps }).ymaps = ymaps;
    scripts[0]!.dispatchEvent(new Event('load'));

    await expect(first).resolves.toBe(ymaps);
    await expect(second).resolves.toBe(ymaps);
  });

  it('rejects when the script fails to load, and lets a later call retry', async () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    const loadYandexMaps = await freshLoader();

    const pending = loadYandexMaps();
    document.querySelector('script')!.dispatchEvent(new Event('error'));

    await expect(pending).rejects.toThrow(/yuklanmadi/i);

    // A cached rejection would hand the same failure back forever.
    loadYandexMaps();
    expect(document.querySelectorAll('script')).toHaveLength(2);
  });

  it('rejects without caching when the script loads but the global is missing', async () => {
    vi.stubEnv('VITE_YANDEX_MAPS_KEY', 'test-key');
    const loadYandexMaps = await freshLoader();

    const pending = loadYandexMaps();
    delete (window as { ymaps?: unknown }).ymaps;
    document.querySelector('script')!.dispatchEvent(new Event('load'));

    await expect(pending).rejects.toThrow(/yuklanmadi/i);

    loadYandexMaps();
    expect(document.querySelectorAll('script')).toHaveLength(2);
  });
});

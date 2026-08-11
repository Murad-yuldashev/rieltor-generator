import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const STORAGE_KEY = 'rieltor:user-location';

async function freshHook() {
  vi.resetModules();
  return (await import('./use-user-location')).useUserLocation;
}

function stubGeolocation(impl: Partial<Geolocation>) {
  vi.stubGlobal('navigator', { ...navigator, geolocation: impl as Geolocation });
}

beforeEach(() => localStorage.clear());
afterEach(() => vi.unstubAllGlobals());

describe('useUserLocation', () => {
  it('starts empty when nothing is stored', async () => {
    stubGeolocation({ getCurrentPosition: vi.fn() });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toBeNull();
  });

  it('restores a stored location without asking the browser', async () => {
    const stored = { lat: 41.31, lng: 69.24, label: 'Shayxontohur tumani', source: 'manual' };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    const getCurrentPosition = vi.fn();
    stubGeolocation({ getCurrentPosition });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toEqual(stored);
    expect(result.current.status).toBe('ready');
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('stores the detected point with its district name', async () => {
    stubGeolocation({
      getCurrentPosition: (onSuccess) =>
        onSuccess({ coords: { latitude: 41.3675, longitude: 69.2894 } } as GeolocationPosition),
    });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.detect());

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.location?.label).toBe('Yunusobod tumani');
    expect(result.current.location?.source).toBe('gps');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').lat).toBeCloseTo(41.3675, 4);
  });

  it('reports a refusal without storing anything', async () => {
    stubGeolocation({
      getCurrentPosition: (_onSuccess, onError) =>
        onError?.({ code: 1, message: 'denied' } as GeolocationPositionError),
    });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.detect());

    await waitFor(() => expect(result.current.status).toBe('denied'));
    expect(result.current.location).toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('stores a manually picked point and labels it', async () => {
    stubGeolocation({ getCurrentPosition: vi.fn() });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    act(() => result.current.setManual({ lat: 41.22, lng: 69.22 }));

    expect(result.current.location).toEqual({
      lat: 41.22,
      lng: 69.22,
      label: 'Sergeli tumani',
      source: 'manual',
    });
  });

  it('ignores corrupt JSON in storage instead of throwing', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json');
    stubGeolocation({ getCurrentPosition: vi.fn() });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toBeNull();
  });

  it('ignores a structurally-wrong stored entry instead of throwing', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat: 1, lng: 2 }));
    stubGeolocation({ getCurrentPosition: vi.fn() });
    const useUserLocation = await freshHook();

    const { result } = renderHook(() => useUserLocation());
    expect(result.current.location).toBeNull();
  });

  it('shares one state between two consumers', async () => {
    stubGeolocation({ getCurrentPosition: vi.fn() });
    const useUserLocation = await freshHook();

    const a = renderHook(() => useUserLocation());
    const b = renderHook(() => useUserLocation());

    act(() => a.result.current.setManual({ lat: 41.22, lng: 69.22 }));
    expect(b.result.current.location?.label).toBe('Sergeli tumani');
  });
});

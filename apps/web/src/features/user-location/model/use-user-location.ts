import { useCallback, useSyncExternalStore } from 'react';
import { nearestDistrict, type Point } from '@rieltor/shared';
import {
  getLocation,
  getStatus,
  setLocation,
  setStatus,
  subscribe,
  type LocationStatus,
  type UserLocation,
} from './store';

/** High accuracy costs battery and seconds; a district-level fix is all this needs. */
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 10_000,
  maximumAge: 5 * 60 * 1000,
};

export function useUserLocation(): {
  location: UserLocation | null;
  status: LocationStatus;
  detect: () => void;
  setManual: (point: Point) => void;
} {
  const location = useSyncExternalStore(subscribe, getLocation, getLocation);
  const status = useSyncExternalStore(subscribe, getStatus, getStatus);

  const detect = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('denied');
      return;
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = { lat: position.coords.latitude, lng: position.coords.longitude };
        setLocation({ ...point, label: nearestDistrict(point), source: 'gps' });
      },
      // Refusal, timeout and "position unavailable" all land here; the user picks
      // manually from here on and is never prompted again.
      () => setStatus('denied'),
      GEOLOCATION_OPTIONS,
    );
  }, []);

  const setManual = useCallback((point: Point) => {
    setLocation({ ...point, label: nearestDistrict(point), source: 'manual' });
  }, []);

  return { location, status, detect, setManual };
}

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './pin-map.css';

/** One map pin. `label` is the pre-formatted price string; `href` is the target route. */
export type MapPin = { id: string; lat: number; lng: number; label: string; href: string };

const TASHKENT: [number, number] = [41.311, 69.279];
const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '© OpenStreetMap';

type Props =
  | { mode: 'cluster'; pins: MapPin[]; onSelect: (pin: MapPin) => void; className?: string }
  | { mode: 'single'; lat: number; lng: number; className?: string }
  | {
      mode: 'pick';
      lat: number | null;
      lng: number | null;
      onPick: (lat: number, lng: number) => void;
      className?: string;
    };

// A divIcon avoids Leaflet's default marker PNGs (which Vite does not resolve → broken images).
// `iconSize: undefined` → Leaflet writes NO inline width/height, so the CSS sizes the label
// (see pin-map.css targeting `.leaflet-marker-icon.price-pin`). The label is set via `textContent`
// (an HTMLElement passed as `html`), NEVER string-interpolated HTML — a complex-name fallback is
// free user text, so raw `<span>${label}</span>` would be a stored-XSS vector on the public map.
const priceIcon = (label: string) => {
  const span = document.createElement('span');
  span.className = 'price-pin';
  span.textContent = label;
  return L.divIcon({ html: span, className: 'price-pin', iconSize: undefined });
};
const locIcon = () => L.divIcon({ html: '📍', className: 'loc-pin', iconSize: undefined });

// Popup "mini card" shown when a price pin is tapped: the price/label line plus a
// "Batafsil ma'lumot" button that opens the detail route via `onOpen`. Built as a
// DOM element (createElement + textContent), NEVER innerHTML/template-string — the
// `label` is free user text (a complex name can be a fallback), so raw string HTML
// would be a stored-XSS vector on the public map.
const miniCard = (label: string, onOpen: () => void) => {
  const box = document.createElement('div');
  box.className = 'pin-card';
  const title = document.createElement('div');
  title.className = 'pin-card__label';
  title.textContent = label;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'pin-card__link';
  btn.textContent = "Batafsil ma'lumot";
  btn.addEventListener('click', onOpen);
  box.append(title, btn);
  return box;
};

/** Leaflet map primitive. Client-only (inits in useEffect); code-split by consumers via React.lazy. */
export default function PinMap(props: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.Layer | null>(null);
  // Keep the latest callbacks without re-running the init effect.
  const propsRef = useRef(props);
  propsRef.current = props;

  // Init the map + tiles ONCE.
  useEffect(() => {
    if (!elRef.current || mapRef.current) return;
    const map = L.map(elRef.current).setView(TASHKENT, 11);
    L.tileLayer(OSM_URL, { attribution: OSM_ATTR, maxZoom: 19 }).addTo(map);
    if (propsRef.current.mode === 'pick') {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const p = propsRef.current;
        // Wrap into the canonical [-180, 180] range: a click on a repeated world
        // copy yields an out-of-range longitude that ListingDraftSchema rejects.
        const w = e.latlng.wrap();
        if (p.mode === 'pick') p.onPick(w.lat, w.lng);
      });
    }
    mapRef.current = map;
    // Leaflet needs a size recalculation once the container has laid out.
    setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // (Re)draw the data layer when the inputs change.
  const signature =
    props.mode === 'cluster'
      ? props.pins.map((p) => `${p.id}@${p.lat},${p.lng}:${p.label}`).join('|')
      : `${props.mode}:${props.lat},${props.lng}`;
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }
    const p = propsRef.current;
    if (p.mode === 'cluster') {
      const cluster = L.markerClusterGroup();
      const bounds: L.LatLngTuple[] = [];
      for (const pin of p.pins) {
        const marker = L.marker([pin.lat, pin.lng], { icon: priceIcon(pin.label) });
        // A marker click opens the mini card (Leaflet default for a bound popup);
        // only the card's "Batafsil ma'lumot" button navigates via onSelect.
        marker.bindPopup(
          miniCard(pin.label, () => {
            const cur = propsRef.current;
            if (cur.mode === 'cluster') cur.onSelect(pin);
          }),
        );
        cluster.addLayer(marker);
        bounds.push([pin.lat, pin.lng]);
      }
      map.addLayer(cluster);
      layerRef.current = cluster;
      if (bounds.length) map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 });
    } else {
      const group = L.layerGroup().addTo(map);
      if (p.lat != null && p.lng != null) {
        L.marker([p.lat, p.lng], { icon: locIcon() }).addTo(group);
        // `single` (detail) centres+zooms once. `pick` must NOT re-centre/zoom on
        // every click (each click → onPick → new lat/lng → this effect reruns), so
        // it only pans to the first pin and preserves the user's current zoom.
        if (p.mode === 'single') map.setView([p.lat, p.lng], 15);
      }
      layerRef.current = group;
    }
  }, [signature]);

  return <div ref={elRef} className={props.className ?? 'h-[420px] w-full rounded-card'} />;
}

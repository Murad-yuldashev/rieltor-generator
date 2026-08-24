import { cn } from '@/shared/lib/cn';

/**
 * Inline SVG icons — no external icon package is pulled in (bundle size and LCP, spec §7).
 * Outlined icons are drawn with `stroke`, solid ones with `fill`; because the two are
 * rendered differently, the solid ones are listed separately in FILLED.
 */
const PATHS = {
  home: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5'],
  homeSolid: ['M3 10.5 12 3l9 7.5', 'M5 9.5V21h14V9.5', 'M9 21v-6h6v6'],
  pin: ['M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z', 'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  chevronDown: ['m6 9 6 6 6-6'],
  chevronUp: ['m6 15 6-6 6 6'],
  chevronLeft: ['m15 18-6-6 6-6'],
  chevronRight: ['m9 18 6-6-6-6'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3.5 2'],
  doc: ['M6 3h8l4 4v14H6V3Z', 'M14 3v4h4', 'M9 12h6M9 16h4'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z', 'm20 20-3.2-3.2'],
  filter: ['M4 6h16M7 12h10M10 18h4'],
  camera: [
    'M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z',
    'M12 15.4a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z',
  ],
  rooms: ['M3 11h18v7M3 18v-9a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2', 'M3 15h18'],
  area: ['M4 4h16v16H4V4Z', 'M4 12h16M12 4v16'],
  floor: ['M4 20h4v-4h4v-4h4V8h4'],
  phone: [
    'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z',
  ],
  eye: ['M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
  calendar: [
    'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z',
    'M8 2v4M16 2v4M3 9h18',
  ],
  share: [
    'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm12 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    'm8.6 13.5 6.8 4M15.4 6.5l-6.8 4',
  ],
  heart: [
    'M12 21s-7.5-4.7-10-9.3C.6 8.6 2.6 5 6.2 5c2.2 0 3.7 1.2 4.6 2.6h2.4C14.1 6.2 15.6 5 17.8 5c3.6 0 5.6 3.6 4.2 6.7C19.5 16.3 12 21 12 21Z',
  ],
  telegram: [
    'M21.9 4.6c.3-1.3-.9-2.2-2-1.7L2.7 9.9c-1.2.5-1.1 2.2.1 2.6l4.7 1.5 1.8 5.6c.4 1.1 1.8 1.4 2.6.5l2.5-2.7 4.6 3.4c1 .7 2.4.2 2.6-1L21.9 4.6ZM8.6 13.1l9.4-5.9c.3-.2.5.2.3.4l-7.7 7.2-.3 3-1.7-4.7Z',
  ],
  check: ['m4.5 12.5 5 5 10-11'],
  close: ['M6 6l12 12', 'M18 6 6 18'],
  money: ['M3 7h18v10H3V7Z', 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z', 'M6 7v10M18 7v10'],
  mic: ['M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z', 'M6 11a6 6 0 0 0 12 0M12 19v3'],
} as const;

/** These icons are drawn as a solid shape rather than an outline. */
const FILLED = new Set<IconName>(['heart', 'telegram']);

export type IconName = keyof typeof PATHS;

interface Props {
  name: IconName;
  className?: string;
  /** Stroke width for outlined icons. Thicker reads better at small sizes. */
  strokeWidth?: number;
}

export function Icon({ name, className, strokeWidth = 2 }: Props) {
  const filled = FILLED.has(name);

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('shrink-0', className)}
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={filled ? undefined : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

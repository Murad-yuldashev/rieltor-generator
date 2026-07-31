interface Props {
  rooms: number;
  areaM2: number;
  floor: string | null;
  district: string;
}

/** Ikonkalar — inline SVG. Tashqi ikonka paketi qo'shilmaydi (bundle va LCP uchun). */
const ICONS = {
  rooms: 'M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z',
  area: 'M4 4h16v16H4V4Zm0 6h16M10 4v16',
  floor: 'M4 20h16M4 14h16M4 8h16',
  district:
    'M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11Zm0-8.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z',
} as const;

function Element({ d, text }: { d: string; text: string }) {
  return (
    <li className="flex flex-col items-center gap-1 text-center">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="h-5 w-5 text-slate-400"
        aria-hidden="true"
      >
        <path d={d} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-sm text-slate-700">{text}</span>
    </li>
  );
}

export function ParamsRow({ rooms, areaM2, floor, district }: Props) {
  return (
    // grid-flow-col + auto-cols-fr — ustunlar soni elementlar soniga qarab o'zi moslashadi,
    // shuning uchun qavat tushib qolganda ham qator teng bo'linadi.
    <ul className="grid auto-cols-fr grid-flow-col gap-2 border-y border-slate-100 px-4 py-3">
      <Element d={ICONS.rooms} text={`${rooms} xona`} />
      <Element d={ICONS.area} text={`${areaM2} m²`} />
      {/* Hovlida qavat yo'q — element butunlay tushib qoladi. */}
      {floor !== null && <Element d={ICONS.floor} text={floor} />}
      <Element d={ICONS.district} text={district} />
    </ul>
  );
}

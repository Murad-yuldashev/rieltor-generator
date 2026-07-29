interface Props {
  tel: string;
  tg: string;
}

export function StickyCTA({ tel, tg }: Props) {
  const username = tg.replace(/^@/, '');

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-content border-t border-slate-200 bg-white/95 px-3 pt-3 backdrop-blur"
      // iOS'da pastki indikator paneli tugmalarni yopib qo'ymasligi uchun (spec §9.7).
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex gap-2">
        <a
          href={`tel:${tel}`}
          className="flex h-12 flex-1 items-center justify-center rounded-xl bg-accent font-medium text-white"
        >
          📞 Qo'ng'iroq
        </a>
        <a
          href={`https://t.me/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 flex-1 items-center justify-center rounded-xl border border-accent font-medium text-accent"
        >
          ✈️ Telegram
        </a>
      </div>
    </div>
  );
}

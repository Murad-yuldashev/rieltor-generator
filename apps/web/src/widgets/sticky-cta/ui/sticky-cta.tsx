import { Icon } from '@/shared/ui/icon';

interface Props {
  phone: string;
  telegram: string;
}

export function StickyCTA({ phone, telegram }: Props) {
  const username = telegram.replace(/^@/, '');

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-content gap-2.5 border-t border-line bg-white/96 px-4 pt-3 backdrop-blur-xl"
      // Keeps the iOS home indicator from covering the buttons (spec §9.7).
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <a
        href={`tel:${phone}`}
        className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35"
      >
        <Icon name="phone" className="h-[17px] w-[17px]" strokeWidth={2.2} />
        Qo'ng'iroq
      </a>
      <a
        href={`https://t.me/${username}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-telegram bg-card py-3.5 text-[15px] font-extrabold text-telegram"
      >
        <Icon name="telegram" className="h-[17px] w-[17px]" />
        Telegram
      </a>
    </div>
  );
}

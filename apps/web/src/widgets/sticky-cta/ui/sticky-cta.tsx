import { useContactReveal } from '@/features/contact-reveal';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

interface Props {
  listingId: string;
  telegram: string;
  /** Lets the listing page order this block inside its desktop sidebar. */
  className?: string;
}

export function StickyCTA({ listingId, telegram, className }: Props) {
  const username = telegram.replace(/^@/, '');
  const { callSeller } = useContactReveal(listingId);

  return (
    <div
      // Pinned to the bottom of the phone screen; on desktop it stops being a bar
      // and becomes the last block of the sticky sidebar, so every positioning
      // class is undone at 1440px.
      className={cn(
        'fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-content gap-2.5 border-t border-line bg-white/96 px-4 pt-3 pb-cta-safe backdrop-blur-xl desk:static desk:inset-x-auto desk:mx-0 desk:max-w-none desk:rounded-card desk:border desk:border-line/60 desk:bg-card desk:p-4 desk:shadow-card desk:backdrop-blur-none',
        className,
      )}
    >
      <button
        type="button"
        // No static tel: href here — the number is masked until this tap reveals
        // (and tracks) it, then dials in the same action.
        onClick={() => void callSeller()}
        className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35"
      >
        <Icon name="phone" className="h-[17px] w-[17px]" strokeWidth={2.2} />
        Qo'ng'iroq
      </button>
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

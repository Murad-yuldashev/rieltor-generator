import { trackEvent } from '@/features/event-tracking';
import { LeadFormButton } from '@/features/lead-form';
import { Icon } from '@/shared/ui/icon';

interface Props {
  phone: string;
  telegram: string;
  /** Optional so this widget stays renderable without a listing context (its own
   *  test does exactly that); when given, a tap on either button fires a CTA event
   *  (design spec §8.2) alongside the tel:/t.me navigation, never blocking it. Also
   *  gates the third "Raqamimni qoldiraman" CTA below — leaving a lead makes no
   *  sense without a listing to attach it to (design spec §8.4). */
  listingId?: string;
  /** The `?s=` ShareLink code, when the visit came from one. */
  shareCode?: string;
}

export function StickyCTA({ phone, telegram, listingId, shareCode }: Props) {
  const username = telegram.replace(/^@/, '');

  function track(type: 'CALL_CLICK' | 'TG_CLICK') {
    if (listingId) trackEvent({ listingId, type, shareCode });
  }

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-w-content flex-col gap-1.5 border-t border-line bg-white/96 px-4 pt-3 backdrop-blur-xl"
      // Keeps the iOS home indicator from covering the buttons (spec §9.7).
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex gap-2.5">
        <a
          href={`tel:${phone}`}
          onClick={() => track('CALL_CLICK')}
          className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35"
        >
          <Icon name="phone" className="h-[17px] w-[17px]" strokeWidth={2.2} />
          Qo'ng'iroq
        </a>
        <a
          href={`https://t.me/${username}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('TG_CLICK')}
          className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-telegram bg-card py-3.5 text-[15px] font-extrabold text-telegram"
        >
          <Icon name="telegram" className="h-[17px] w-[17px]" />
          Telegram
        </a>
      </div>

      {/* A lighter-weight third action, deliberately subordinate to the two buttons
          above: call/Telegram are immediate contact, this is a lower-friction
          opt-in for a visitor who wants neither right now (design spec §8.4). */}
      {listingId && (
        <LeadFormButton
          listingId={listingId}
          className="flex items-center justify-center gap-1.5 py-1 text-[13px] font-bold text-accent"
        >
          <Icon name="message" className="h-3.5 w-3.5" strokeWidth={2.2} />
          Raqamimni qoldiraman
        </LeadFormButton>
      )}
    </div>
  );
}

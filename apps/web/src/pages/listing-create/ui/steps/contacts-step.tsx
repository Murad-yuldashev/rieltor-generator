import { Link } from 'react-router';
import { formatPriceSom } from '@rieltor/shared';
import { useSession } from '@/entities/session';
import { LISTING_TYPE_META } from '@/entities/listing';
import { Icon } from '@/shared/ui/icon';
import type { ListingDraftState } from '../../model/use-listing-draft';
import { WizardNav } from '../wizard-nav';

/**
 * "998901234567" → "+998 90 123 45 67". A Telegram-only account's phone is
 * "tg:<id>" (see AuthService.loginWithTelegram) and has no dial-in format —
 * shown as-is rather than mangled.
 */
function formatSessionPhone(phone: string): string {
  const m = /^998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return m ? `+998 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-3">{label}</span>
      <span className="font-bold text-ink">{value}</span>
    </div>
  );
}

interface Props {
  draft: ListingDraftState;
}

/**
 * Step 6: contacts + final review + submit. The draft schema has no phone/telegram
 * field of its own (listings are still attributed to the seeded agency agent until
 * Phase 3's realtor profile ships — see DEFAULT_AGENT_ID in ListingsService), so this
 * step shows the caller's own number from the session rather than collecting one that
 * would have nowhere to be saved.
 */
export function ContactsStep({ draft }: Props) {
  const { user } = useSession();
  const { fields, back, submit, isSubmitting, submitError, isSubmitted } = draft;

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
          <Icon name="check" className="h-6 w-6" strokeWidth={2.6} />
        </span>
        <h2 className="text-[18px] font-extrabold tracking-tight">E'lon moderatsiyaga yuborildi</h2>
        <p className="max-w-[320px] text-[13.5px] text-ink-2">
          Tez orada tekshiruvdan o'tadi va sayt bo'ylab ko'rinadigan bo'ladi.
        </p>
        <Link
          to="/my/listings"
          className="mt-2 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3 text-[14.5px] font-extrabold text-white shadow-lg shadow-accent/35"
        >
          Mening e'lonlarim
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-[14px] border border-line bg-surface p-4">
        <p className="text-[13.5px] font-bold text-ink-2">Bog'lanish uchun raqam</p>
        <p className="mt-1 text-[16px] font-extrabold">
          {user ? formatSessionPhone(user.phone) : '—'}
        </p>
        <p className="mt-1.5 text-[12px] text-ink-3">
          Xaridorlar aynan shu raqam orqali siz bilan bog'lanadi.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-[14px] border border-line p-4 text-[13.5px]">
        <p className="mb-1 font-bold text-ink-2">E'lon xulosasi</p>
        <Row label="Bitim" value={fields.deal === 'RENT' ? 'Ijara' : 'Sotib olish'} />
        <Row label="Turi" value={fields.type ? LISTING_TYPE_META[fields.type].label : '—'} />
        <Row label="Manzil" value={fields.address ?? '—'} />
        <Row
          label="Narx"
          value={fields.priceSom ? formatPriceSom(fields.priceSom, fields.deal ?? 'SALE') : '—'}
        />
      </div>

      {submitError && (
        <p className="mt-4 rounded-[12px] bg-brand-rose/10 px-3.5 py-3 text-[13px] font-semibold text-brand-rose">
          {submitError}
        </p>
      )}

      <WizardNav onBack={back} onNext={submit} nextLabel="E'lonni yuborish" isBusy={isSubmitting} />
    </div>
  );
}

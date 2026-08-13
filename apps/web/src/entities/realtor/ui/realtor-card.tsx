import { useTranslation } from 'react-i18next';
import { Icon } from '@/shared/ui/icon';
import { formatPhone } from '../lib/format-phone';

interface Props {
  name: string;
  agency: string | null;
  photoUrl: string | null;
  /** Both nullable per RealtorShowcaseSchema: a realtor can exist (and this page
   *  can be reached) before phone is set, and not every Telegram account has a
   *  public @username to build a t.me link from. Each button drops out on its
   *  own null rather than rendering broken. */
  phone: string | null;
  telegram: string | null;
  registryNo: string | null;
}

/**
 * The realtor profile block at the top of /r/:username (design spec §9.1): photo,
 * name, agency, a Telegram-verified badge, the registry number when the realtor
 * has one, and the two contact buttons. Deliberately renders the same fields the
 * card is specified to show — no extra content invented beyond the spec's list.
 */
export function RealtorCard({ name, agency, photoUrl, phone, telegram, registryNo }: Props) {
  const { t } = useTranslation('misc');
  const username = telegram?.replace(/^@/, '');

  return (
    <section className="rounded-card border border-line/60 bg-card p-4 shadow-card">
      <div className="flex items-center gap-3.5">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={name}
            width={64}
            height={64}
            // This card is the first thing painted on the page — the LCP
            // candidate, same treatment as ResponsiveImage's isFirst (spec §7).
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Icon name="homeSolid" className="h-7 w-7" strokeWidth={2.2} />
          </span>
        )}

        <div className="min-w-0">
          <h1 className="truncate text-[18px] font-extrabold tracking-tight">{name}</h1>
          {agency && (
            <p className="mt-0.5 truncate text-[13px] font-semibold text-ink-3">{agency}</p>
          )}
          <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-telegram/10 px-2 py-0.5 text-[11px] font-extrabold text-telegram">
            <Icon name="check" className="h-3 w-3" strokeWidth={3} />
            {t('verifiedTelegram')}
          </span>
        </div>
      </div>

      {registryNo && (
        <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-3">
          <Icon name="doc" className="h-3.5 w-3.5" />
          {t('registryNumber', { registryNo })}
        </p>
      )}

      {(phone || username) && (
        <div className="mt-4 flex gap-2.5">
          {phone && (
            <a
              href={`tel:${phone}`}
              aria-label={t('callAriaLabel', { phone: formatPhone(phone) })}
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[14.5px] font-extrabold text-white shadow-lg shadow-accent/35"
            >
              <Icon name="phone" className="h-[17px] w-[17px]" strokeWidth={2.2} />
              {t('call')}
            </a>
          )}
          {username && (
            <a
              href={`https://t.me/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-telegram bg-card py-3.5 text-[14.5px] font-extrabold text-telegram"
            >
              <Icon name="telegram" className="h-[17px] w-[17px]" />
              {t('telegram')}
            </a>
          )}
        </div>
      )}
    </section>
  );
}

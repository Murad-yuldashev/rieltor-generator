import { useState, type ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@/shared/api/client';
import { Icon } from '@/shared/ui/icon';
import { submitInquiry } from '../api';

/** WhatsApp glyph — kept local to this block rather than added to the shared Icon
 * set, since it's only used for the realtor site's contact channels. */
function WhatsappGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 2a10 10 0 0 0-8.53 15.25L2 22l4.87-1.42A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.1.9.83-3.02-.2-.31A8.2 8.2 0 1 1 12 20.2Z" />
      <path d="M17.5 14.4c-.29-.15-1.7-.83-1.96-.93-.26-.1-.45-.15-.64.15-.19.29-.74.93-.9 1.12-.17.19-.33.21-.62.07-.29-.15-1.22-.45-2.32-1.43-.86-.76-1.44-1.7-1.6-1.99-.17-.29-.02-.44.13-.59.13-.13.29-.34.44-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.15-.64-1.55-.88-2.12-.23-.56-.47-.49-.64-.49h-.55c-.19 0-.5.07-.76.36-.26.29-1 .98-1 2.38s1.02 2.76 1.17 2.95c.15.19 2.02 3.08 4.9 4.32.68.29 1.21.47 1.63.6.68.22 1.31.19 1.8.11.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.34Z" />
    </svg>
  );
}

/** Instagram glyph — local for the same reason as {@link WhatsappGlyph}. */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** One direct-contact channel, rendered as a soft branded pill. `external` opens a
 * new tab (all links but `tel:`); accent colours read the overridden brand vars. */
function ContactPill({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
      className="flex items-center gap-2 rounded-full bg-accent-soft px-4 py-2.5 text-[13.5px] font-bold text-accent transition-opacity hover:opacity-80"
    >
      {icon}
      {label}
    </a>
  );
}

interface ContactSectionProps {
  slug: string;
  contactPhone: string | null;
  contactTelegram: string | null;
  contactWhatsapp: string | null;
  instagramUrl: string | null;
  telegramChannelUrl: string | null;
}

/**
 * The realtor site's "Bog'lanish" block: direct-contact pills (only the channels
 * the realtor published — a null field renders nothing, so no internal data leaks)
 * plus a general "Qo'ng'iroq so'rash" lead form. The form posts a page-level
 * inquiry (`{ name, phone, message }`, no listingId — MVP scope) and, on success,
 * swaps to a persistent confirmation. All accent styling reads the brand vars set
 * on the page's <main>, so it auto-rebrands per realtor.
 */
export function ContactSection({
  slug,
  contactPhone,
  contactTelegram,
  contactWhatsapp,
  instagramUrl,
  telegramChannelUrl,
}: ContactSectionProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const mutation = useMutation({
    mutationFn: (body: { name: string; phone: string; message: string }) =>
      submitInquiry(slug, body),
  });

  const canSubmit =
    name.trim() !== '' && phone.trim() !== '' && message.trim() !== '' && !mutation.isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    mutation.mutate({ name: name.trim(), phone: phone.trim(), message: message.trim() });
  };

  // The server answers a 400 (validation) / 409 (conflict) with ready-to-show Uzbek
  // copy — surface that verbatim; any other failure keeps a generic message so an
  // unexpected internal string never reaches the visitor.
  const errorText = mutation.error
    ? mutation.error instanceof ApiError &&
      (mutation.error.status === 400 || mutation.error.status === 409)
      ? mutation.error.message
      : "So'rovni yuborib bo'lmadi. Birozdan keyin qayta urinib ko'ring."
    : null;

  const hasChannel =
    contactPhone !== null ||
    contactTelegram !== null ||
    contactWhatsapp !== null ||
    instagramUrl !== null ||
    telegramChannelUrl !== null;

  return (
    <section className="mx-auto w-full max-w-content px-4 py-5 desk:max-w-desk desk:px-8">
      <h2 className="text-[15px] font-extrabold text-ink">Bog'lanish</h2>

      {hasChannel && (
        <div className="mt-3 flex flex-wrap gap-2">
          {contactPhone !== null && (
            <ContactPill
              href={`tel:+${contactPhone}`}
              icon={<Icon name="phone" className="h-4 w-4" strokeWidth={2.2} />}
              label="Qo'ng'iroq"
            />
          )}
          {contactTelegram !== null && (
            <ContactPill
              href={`https://t.me/${contactTelegram}`}
              external
              icon={<Icon name="telegram" className="h-4 w-4" />}
              label="Telegram"
            />
          )}
          {contactWhatsapp !== null && (
            <ContactPill
              href={`https://wa.me/${contactWhatsapp}`}
              external
              icon={<WhatsappGlyph className="h-4 w-4" />}
              label="WhatsApp"
            />
          )}
          {instagramUrl !== null && (
            <ContactPill
              href={instagramUrl}
              external
              icon={<InstagramGlyph className="h-4 w-4" />}
              label="Instagram"
            />
          )}
          {telegramChannelUrl !== null && (
            <ContactPill
              href={telegramChannelUrl}
              external
              icon={<Icon name="telegram" className="h-4 w-4" />}
              label="Telegram kanal"
            />
          )}
        </div>
      )}

      <div className="mt-4 rounded-card border border-line/60 bg-card p-4">
        {mutation.isSuccess ? (
          <p className="flex items-center justify-center gap-2 py-6 text-center text-[14.5px] font-extrabold text-brand-green">
            <Icon name="check" className="h-5 w-5" strokeWidth={2.6} />
            So'rovingiz yuborildi
          </p>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSubmit();
            }}
          >
            <p className="text-[14px] font-extrabold text-ink">Qo'ng'iroq so'rash</p>
            <p className="mt-1 text-[13px] leading-[1.5] font-medium text-ink-2">
              Ma'lumotlaringizni qoldiring — rieltor tez orada siz bilan bog'lanadi.
            </p>

            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={80}
              placeholder="Ismingiz"
              aria-label="Ismingiz"
              className="mt-3 w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent"
            />
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              maxLength={20}
              placeholder="Telefon raqamingiz"
              aria-label="Telefon raqamingiz"
              className="mt-3 w-full rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent"
            />
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Xabaringiz"
              aria-label="Xabaringiz"
              className="mt-3 w-full resize-none rounded-[14px] border border-line bg-surface px-3.5 py-3 text-[14.5px] font-medium outline-none placeholder:text-ink-3 focus:border-accent"
            />

            {errorText && (
              <p className="mt-2 text-[12.5px] font-semibold text-brand-rose">{errorText}</p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              style={{ background: 'var(--brand, var(--color-accent))' }}
              className="mt-3 w-full rounded-[14px] px-5 py-3.5 text-[14.5px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? 'Yuborilmoqda...' : 'Yuborish'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

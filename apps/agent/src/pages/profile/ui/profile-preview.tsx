import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';

/**
 * A live "how buyers see you" card, mirroring the top of the realtor's public
 * microsite. Fed from the editor's FORM STATE (`agency`, `brandColor`) plus
 * session/server truth (`name` from the session user, `verified`/`logoUrl`/`slug`
 * from the saved profile). `RealtorProfile` has no `name` field and the editor keeps
 * no `name` state, so `name` is the nullable session name and the `{name && …}`
 * guard handles null/undefined.
 */
export function ProfilePreview({
  agency,
  name,
  logoUrl,
  brandColor,
  verified,
  slug,
  className,
}: {
  agency: string;
  name?: string | null; // from useSession().user?.name (nullable) — the `{name && …}` guard handles null/undefined
  logoUrl: string | null;
  brandColor: string;
  verified: boolean;
  slug: string | null;
  className?: string;
}) {
  const accent = brandColor || undefined; // '' -> fall back to teal token, not an empty inline color
  return (
    <section className={cn('rounded-card bg-card p-5 shadow-card', className)}>
      <p className="text-[12px] font-semibold text-ink-2">Ommaviy ko'rinish</p>
      <div className="mt-3 flex items-center gap-3">
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={agency}
            className="size-12 shrink-0 rounded-[12px] border border-line object-cover"
          />
        ) : (
          <span
            className="flex size-12 shrink-0 items-center justify-center rounded-[12px] text-[18px] font-extrabold text-white"
            style={{ backgroundColor: accent ?? 'var(--color-accent)' }}
          >
            {(agency || '?').charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[15px] font-extrabold text-ink">
              {agency || 'Agentlik nomi'}
            </p>
            {verified && (
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-dark">
                <Icon name="check" className="size-3.5" /> Tasdiqlangan
              </span>
            )}
          </div>
          {name && <p className="truncate text-[13px] font-medium text-ink-2">{name}</p>}
        </div>
      </div>
      {slug ? (
        <a
          href={`${window.location.origin}/r/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-accent underline"
        >
          <Icon name="share" className="size-4" /> Ommaviy sahifa
        </a>
      ) : (
        <p className="mt-3 text-[12px] text-ink-3">Ommaviy sahifangiz uchun slug belgilang.</p>
      )}
    </section>
  );
}

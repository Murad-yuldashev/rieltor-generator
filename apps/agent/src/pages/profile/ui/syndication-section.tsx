import { useState } from 'react';

/** Feed URL + iframe embed snippet for the realtor's site — shown only when the site
 *  is live (published + active subscription) and has a slug. Copy-to-clipboard. The
 *  URLs are same-origin (window.location.origin), which under the single-container /
 *  Netlify deploy is the platform host that serves both endpoints. */
export function SyndicationSection({ slug, siteLive }: { slug: string | null; siteLive: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);
  if (!slug || !siteLive) return null;

  const origin = window.location.origin;
  const feedUrl = `${origin}/api/r/${slug}/feed.xml`;
  const embedSnippet = `<script src="${origin}/api/r/${slug}/widget.js" async></script>`;

  const copy = (text: string, key: string) => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  const Row = ({ label, value, k }: { label: string; value: string; k: string }) => (
    <div className="mt-3">
      <p className="text-[12px] font-semibold text-ink-2">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-[10px] bg-surface px-3 py-2 text-[11.5px] text-ink-2">
          {value}
        </code>
        <button
          type="button"
          onClick={() => copy(value, k)}
          className="shrink-0 rounded-[10px] border border-line px-3 py-2 text-[12px] font-bold text-ink-2"
        >
          {copied === k ? 'Nusxalandi' : 'Nusxalash'}
        </button>
      </div>
    </div>
  );

  return (
    <section className="rounded-card bg-card p-4 shadow-card md:col-span-2">
      <p className="text-[13px] font-bold text-ink">Tarqatish (feed va embed)</p>
      <p className="mt-1 text-[12px] text-ink-3">
        Boshqa portallarga sindikatsiya uchun YML feed va tashqi saytga qo‘yish uchun embed kodi.
      </p>
      <Row label="Yandex Realty YML feed" value={feedUrl} k="feed" />
      <Row label="Sayt uchun embed kodi" value={embedSnippet} k="embed" />
    </section>
  );
}

import { useState } from 'react';
import { useRevealRequestContact } from '@/entities/property-request';
import { Icon } from '@/shared/ui/icon';

/**
 * "Telefonni ko'rsatish" for the board: the request lists a masked phone, so
 * tapping this fetches the real number (the API logs the reveal as a lead) and
 * then renders it as a `tel:` link the browser can dial. Mirrors the listing
 * contact-reveal feature, minus the immediate auto-dial — a browsing realtor
 * wants to read the number first, not jump straight into a call.
 */
export function RevealButton({ id }: { id: string }) {
  const reveal = useRevealRequestContact();
  const [phone, setPhone] = useState<string | null>(null);

  if (phone) {
    return (
      <a
        href={`tel:${phone}`}
        className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/10 px-3.5 py-2 text-[14px] font-extrabold text-brand-green"
      >
        <Icon name="phone" className="h-4 w-4" strokeWidth={2.2} />
        {phone}
      </a>
    );
  }

  async function onClick() {
    try {
      const contact = await reveal.mutateAsync(id);
      setPhone(contact.phone);
    } catch {
      // The button re-enables on failure; a transient error just lets the user retry.
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={reveal.isPending}
      className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-[13.5px] font-extrabold text-white shadow-lg shadow-accent/30 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Icon name="phone" className="h-4 w-4" strokeWidth={2.2} />
      {reveal.isPending ? 'Yuklanmoqda...' : "Telefonni ko'rsatish"}
    </button>
  );
}

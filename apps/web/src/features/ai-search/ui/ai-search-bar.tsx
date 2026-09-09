import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Icon } from '@/shared/ui/icon';
import { useAiSearch } from '../model/use-ai-search';

/**
 * Natural-language search entry. On submit it parses the query via the public
 * /api/ai/search-parse endpoint, then navigates to /search carrying the RAW
 * AiSearchCriteria DTO in navigation state — the search page converts it into a
 * full Criteria (this feature must not import listing-filters; FSD boundary).
 */
export function AiSearchBar() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { mutateAsync, isPending } = useAiSearch();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    const res = await mutateAsync(q);
    // Carry the raw DTO; the search page converts it via listing-filters' aiCriteriaToCriteria.
    navigate('/search', {
      state: { aiCriteria: res.criteria, aiSummary: res.fallback ? '' : res.summary },
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex gap-2.5 px-4 desk:mt-4 desk:max-w-2xl desk:px-0">
      <label className="flex flex-1 items-center gap-2.5 rounded-[14px] border border-line bg-card px-3.5 py-3 shadow-card">
        <Icon name="star" className="h-[17px] w-[17px] text-accent" strokeWidth={2.2} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={200}
          placeholder="AI bilan qidiring: masalan '3 xonali Yunusobodda 1 mlrd gacha'"
          aria-label="AI bilan qidirish"
          className="w-full bg-transparent text-[14.5px] outline-none placeholder:text-ink-3"
        />
      </label>

      <button
        type="submit"
        disabled={isPending || !query.trim()}
        className="shrink-0 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-4 text-[14px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:opacity-50"
      >
        {isPending ? 'Qidirilmoqda…' : 'AI qidiruv'}
      </button>
    </form>
  );
}

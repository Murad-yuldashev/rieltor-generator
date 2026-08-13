import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { LANGUAGES, setLanguage, type Language } from '../i18n';

/** Compact UZ / RU / EN segmented control for the header. */
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language as Language;

  return (
    <div className="flex shrink-0 overflow-hidden rounded-full border border-line">
      {LANGUAGES.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => setLanguage(lng)}
          aria-pressed={current === lng}
          className={cn(
            'px-1.5 py-1 text-[10.5px] font-extrabold uppercase transition-colors',
            current === lng ? 'bg-accent text-white' : 'text-ink-3',
          )}
        >
          {lng}
        </button>
      ))}
    </div>
  );
}

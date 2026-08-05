import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { useFavorite } from '../model/use-favorite';

interface Props {
  id: string;
  className?: string;
}

export function FavoriteButton({ id, className }: Props) {
  const { isFavorite, toggle } = useFavorite(id);

  return (
    <button
      type="button"
      aria-pressed={isFavorite}
      aria-label={isFavorite ? 'Sevimlilardan olib tashlash' : 'Sevimlilarga qo’shish'}
      onClick={(e) => {
        // The whole card is a <Link> — this tap must not navigate to the listing.
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-full bg-white/95 shadow-md transition-colors',
        isFavorite ? 'text-brand-rose' : 'text-ink-2',
        className,
      )}
    >
      <Icon name="heart" className="h-[18px] w-[18px]" />
    </button>
  );
}

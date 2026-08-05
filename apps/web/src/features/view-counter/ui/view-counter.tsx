import { Icon } from '@/shared/ui/icon';
import { useViews } from '../model/use-views';

/** One piece of the meta row under the listing title (next to the date and id). */
export function ViewCounter({ id }: { id: string }) {
  const { views } = useViews(id);

  // Spec §6.3: if the counter fails it disappears quietly; the rest of the page works.
  if (views === null) return null;

  return (
    <span className="flex items-center gap-1.5">
      <Icon name="eye" className="h-[13px] w-[13px]" />
      {views} marta ko'rildi
    </span>
  );
}

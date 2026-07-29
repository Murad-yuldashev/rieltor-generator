import { useViews } from '../model/use-views';

export function ViewCounter({ id }: { id: string }) {
  const { views } = useViews(id);

  // Spec §6.3: hisoblagich ishlamasa jimgina yo'qoladi, sahifa qolgani ishlayveradi.
  if (views === null) return null;

  return (
    <p className="px-4 pb-1 text-sm text-slate-400" aria-label={`${views} marta ko'rilgan`}>
      👁 {views}
    </p>
  );
}

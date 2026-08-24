import type { IconName } from '@/shared/ui/icon';

/** Left-rail copy for each of the six steps — the single source both the rail and the page title read from. */
export const STEP_META: { title: string; hint: string; icon: IconName }[] = [
  { title: 'Bitim va turi', hint: 'Sotuv yoki ijara — va obyekt turini tanlang', icon: 'doc' },
  { title: 'Manzil', hint: 'Obyekt qayerda joylashganini yozing', icon: 'pin' },
  { title: 'Xususiyatlari', hint: 'Xonalar soni, maydon, qavat va tavsif', icon: 'rooms' },
  { title: 'Rasmlar', hint: "Kamida bitta, ko'pi bilan 10 ta rasm yuklang", icon: 'camera' },
  { title: 'Narx', hint: "Narxni so'mda kiriting, dollar ixtiyoriy", icon: 'money' },
  {
    title: 'Yuborish',
    hint: "Bog'lanish ma'lumotini tekshiring va e'lonni yuboring",
    icon: 'phone',
  },
];

/**
 * `step` is always kept in [0, STEP_META.length) by the hook's `next()`/`back()`
 * clamping, but `noUncheckedIndexedAccess` can't see that invariant — the
 * fallback asserts it instead of threading `undefined` through every caller.
 */
export function stepMeta(step: number) {
  return STEP_META[step] ?? STEP_META[0]!;
}

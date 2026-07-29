interface Props {
  moljal: string;
  manzil: string;
}

/** Xarita YO'Q — spec §9 bo'yicha qamrovdan tashqarida. Faqat matn. */
export function Location({ moljal, manzil }: Props) {
  return (
    <section className="border-t border-slate-100 px-4 py-4">
      <h2 className="mb-1.5 text-sm font-semibold text-slate-900">Joylashuv</h2>
      <p className="text-[15px] text-slate-700">{manzil}</p>
      <p className="mt-0.5 text-sm text-slate-500">{moljal}</p>
    </section>
  );
}

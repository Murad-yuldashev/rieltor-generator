export function Description({ text }: { text: string }) {
  return (
    <section className="px-4 py-4">
      <h2 className="mb-1.5 text-sm font-semibold text-slate-900">Tavsif</h2>
      <p className="text-[15px] leading-relaxed whitespace-pre-line text-slate-700">{text}</p>
    </section>
  );
}

/** The heading is drawn by <SectionCard> — this component renders only the body text. */
export function Description({ text }: { text: string }) {
  return <p className="text-[14.5px] leading-[1.65] whitespace-pre-line text-ink-2">{text}</p>;
}

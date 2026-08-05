interface Props {
  title: string;
  subtitle: string;
}

/** Shared heading block for the bottom-nav pages. */
export function PageHeading({ title, subtitle }: Props) {
  return (
    <div className="px-4 pt-[18px] pb-1">
      <h1 className="text-[22px] leading-tight font-extrabold tracking-tight">{title}</h1>
      <p className="mt-1 text-[13.5px] text-ink-2">{subtitle}</p>
    </div>
  );
}

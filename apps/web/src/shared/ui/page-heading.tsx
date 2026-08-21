interface Props {
  title: string;
  subtitle: string;
}

/** Shared heading block for the bottom-nav pages. */
export function PageHeading({ title, subtitle }: Props) {
  return (
    // The desktop shell already supplies the horizontal padding, so the phone
    // gutter is dropped at 1440px rather than added to it.
    <div className="px-4 pt-[18px] pb-1 desk:px-0 desk:pt-0">
      <h1 className="text-[22px] leading-tight font-extrabold tracking-tight desk:text-[30px]">
        {title}
      </h1>
      <p className="mt-1 text-[13.5px] text-ink-2 desk:text-[15px]">{subtitle}</p>
    </div>
  );
}

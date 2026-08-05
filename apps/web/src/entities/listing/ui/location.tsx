import { Icon } from '@/shared/ui/icon';

interface Props {
  landmark: string;
  address: string;
}

/** NO map — out of scope per spec §9. Text only. */
export function Location({ landmark, address }: Props) {
  return (
    <>
      <p className="flex gap-2.5 text-[14.5px] leading-[1.4] font-semibold">
        <Icon name="pin" className="mt-0.5 h-4 w-4 text-accent" strokeWidth={2.2} />
        {address}
      </p>
      {/* Icon width + gap = 25px, so the landmark line aligns with the address above it. */}
      <p className="mt-1.5 pl-[25px] text-[13px] font-medium text-ink-3">Mo'ljal: {landmark}</p>
    </>
  );
}

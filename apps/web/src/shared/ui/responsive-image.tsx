import { IMAGE_SIZES, imageFallbackSrc, imageSrcSet, type Rasm } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

interface Props {
  rasm: Rasm;
  alt: string;
  /** Birinchi rasm = LCP nomzodi: eager + fetchpriority=high (spec §7). */
  birinchi?: boolean;
  className?: string;
}

export function ResponsiveImage({ rasm, alt, birinchi = false, className }: Props) {
  return (
    <img
      src={imageFallbackSrc(rasm.base)}
      srcSet={imageSrcSet(rasm.base)}
      sizes={IMAGE_SIZES}
      width={rasm.width}
      height={rasm.height}
      alt={alt}
      loading={birinchi ? 'eager' : 'lazy'}
      fetchPriority={birinchi ? 'high' : 'auto'}
      decoding={birinchi ? 'sync' : 'async'}
      className={cn('object-cover', className)}
    />
  );
}

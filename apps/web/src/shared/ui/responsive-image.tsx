import { IMAGE_SIZES, imageFallbackSrc, imageSrcSet, type Image } from '@rieltor/shared';
import { cn } from '@/shared/lib/cn';

interface Props {
  image: Image;
  alt: string;
  /** The first image is the LCP candidate: eager + fetchpriority=high (spec §7). */
  isFirst?: boolean;
  className?: string;
}

export function ResponsiveImage({ image, alt, isFirst = false, className }: Props) {
  return (
    <img
      src={imageFallbackSrc(image.base)}
      srcSet={imageSrcSet(image.base)}
      sizes={IMAGE_SIZES}
      width={image.width}
      height={image.height}
      alt={alt}
      loading={isFirst ? 'eager' : 'lazy'}
      fetchPriority={isFirst ? 'high' : 'auto'}
      decoding={isFirst ? 'sync' : 'async'}
      className={cn('object-cover', className)}
    />
  );
}

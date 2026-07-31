import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { formatPriceSom, imageFallbackSrc, imageSrcSet, IMAGE_SIZES } from '@rieltor/shared';
import { listingsQuery } from '@/entities/listing';

export function HomePage() {
  const { data, isPending, isError } = useQuery(listingsQuery());

  if (isPending) return <p className="p-4 text-slate-500">Yuklanmoqda…</p>;
  if (isError) return <p className="p-4 text-slate-500">Obyektlarni yuklab bo'lmadi.</p>;

  return (
    <main className="mx-auto max-w-content p-4">
      <h1 className="mb-4 text-xl font-semibold">Obyektlar</h1>
      <ul className="space-y-3">
        {data.map((listing) => (
          <li key={listing.id}>
            <Link
              to={`/obj/${listing.id}`}
              className="block overflow-hidden rounded-card border border-slate-200"
            >
              {listing.image && (
                <img
                  src={imageFallbackSrc(listing.image.base)}
                  srcSet={imageSrcSet(listing.image.base)}
                  sizes={IMAGE_SIZES}
                  width={listing.image.width}
                  height={listing.image.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="p-3">
                <p className="font-medium">{listing.title}</p>
                <p className="mt-1 text-lg font-semibold text-accent">
                  {formatPriceSom(listing.priceSom)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {listing.rooms} xona · {listing.areaM2} m² · {listing.district}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

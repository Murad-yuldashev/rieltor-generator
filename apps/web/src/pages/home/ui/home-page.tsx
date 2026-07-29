import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { formatNarxSom, imageFallbackSrc, imageSrcSet, IMAGE_SIZES } from '@rieltor/shared';
import { objectRoyxatQuery } from '@/entities/object';

export function HomePage() {
  const { data, isPending, isError } = useQuery(objectRoyxatQuery());

  if (isPending) return <p className="p-4 text-slate-500">Yuklanmoqda…</p>;
  if (isError) return <p className="p-4 text-slate-500">Obyektlarni yuklab bo'lmadi.</p>;

  return (
    <main className="mx-auto max-w-content p-4">
      <h1 className="mb-4 text-xl font-semibold">Obyektlar</h1>
      <ul className="space-y-3">
        {data.map((obj) => (
          <li key={obj.id}>
            <Link
              to={`/obj/${obj.id}`}
              className="block overflow-hidden rounded-card border border-slate-200"
            >
              {obj.rasm && (
                <img
                  src={imageFallbackSrc(obj.rasm.base)}
                  srcSet={imageSrcSet(obj.rasm.base)}
                  sizes={IMAGE_SIZES}
                  width={obj.rasm.width}
                  height={obj.rasm.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover"
                />
              )}
              <div className="p-3">
                <p className="font-medium">{obj.sarlavha}</p>
                <p className="mt-1 text-lg font-semibold text-accent">
                  {formatNarxSom(obj.narxSom)}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {obj.xona} xona · {obj.maydonM2} m² · {obj.tuman}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

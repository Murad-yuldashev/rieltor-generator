import { Link } from 'react-router';

export function NotFoundView() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col items-center justify-center gap-3 bg-surface p-6 text-center">
      <p className="text-5xl font-extrabold text-ink-3/50">404</p>
      <h1 className="text-lg font-bold">Bunday obyekt topilmadi</h1>
      <p className="text-sm text-ink-2">Havola eskirgan yoki e'lon olib tashlangan.</p>
      <Link
        to="/"
        className="mt-2 rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-accent/35"
      >
        Barcha obyektlar
      </Link>
    </main>
  );
}

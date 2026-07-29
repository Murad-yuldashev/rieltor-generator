import { Link } from 'react-router';

export function NotFoundView() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-content flex-col items-center justify-center gap-3 p-6 text-center">
      <p className="text-4xl font-semibold text-slate-300">404</p>
      <h1 className="text-lg font-medium">Bunday obyekt topilmadi</h1>
      <p className="text-sm text-slate-500">Havola eskirgan yoki e'lon olib tashlangan.</p>
      <Link to="/" className="mt-2 text-accent underline">
        Barcha obyektlar
      </Link>
    </main>
  );
}

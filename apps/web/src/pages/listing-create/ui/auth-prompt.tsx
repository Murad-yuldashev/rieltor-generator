import { useState } from 'react';
import { Link } from 'react-router';
import { LoginModal } from '@/features/auth';
import { Icon } from '@/shared/ui/icon';

/** Shown instead of the wizard when `useSession()` reports no logged-in user (spec: "Kirish qiling"). */
export function AuthPrompt() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon name="homeSolid" className="h-6 w-6" strokeWidth={2.1} />
      </span>

      <div>
        <h1 className="text-[19px] font-extrabold tracking-tight">
          E'lon joylash uchun kirish kerak
        </h1>
        <p className="mt-1.5 max-w-[320px] text-[14px] text-ink-2">
          Avval hisobingizga kiring — bu bir necha soniya vaqt oladi.
        </p>
      </div>

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setLoginOpen(true)}
          className="rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3 text-[14.5px] font-extrabold text-white shadow-lg shadow-accent/35"
        >
          Kirish
        </button>
        <Link
          to="/"
          className="rounded-[14px] border border-line px-6 py-3 text-[14.5px] font-bold text-ink-2 transition-colors hover:bg-surface"
        >
          Bosh sahifa
        </Link>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}

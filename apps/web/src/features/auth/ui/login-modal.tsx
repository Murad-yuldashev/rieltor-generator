import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ApiError } from '@/shared/api/client';
import { cn } from '@/shared/lib/cn';
import { Icon } from '@/shared/ui/icon';
import { useLogin } from '../model/use-login';
import { TelegramLoginButton } from './telegram-login-button';

const CODE_TTL_SEC = 120;
const PHONE_DIGITS = 9;
const CODE_DIGITS = 6;

interface Props {
  open: boolean;
  onClose: () => void;
}

/** "998" + 9 digits — the exact shape `PhoneSchema` (packages/shared) validates. */
function toFullPhone(digits: string): string {
  return `998${digits}`;
}

function formatCountdown(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** Every apiPost/apiGet rejection the modal can see is an ApiError — anything else is unexpected. */
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? fallback : "Xatolik yuz berdi. Qaytadan urinib ko'ring.";
}

export function LoginModal({ open, onClose }: Props) {
  const { requestOtp, verifyOtp, isRequestingOtp, isVerifyingOtp, resetVerifyError } = useLogin();

  const [pane, setPane] = useState<'phone' | 'code'>('phone');
  const [digits, setDigits] = useState('');
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(CODE_TTL_SEC);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  // Dev-only: the code the server hands back when there is no SMS provider yet.
  const [devCode, setDevCode] = useState<string | null>(null);

  // A fresh open should never resume a half-finished attempt from last time.
  useEffect(() => {
    if (!open) return;
    setPane('phone');
    setDigits('');
    setCode('');
    setPhoneError(null);
    setCodeError(null);
    setDevCode(null);
  }, [open]);

  // The 120s countdown only runs while the code pane is showing.
  useEffect(() => {
    if (pane !== 'code' || secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [pane, secondsLeft]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const phone = toFullPhone(digits);

  async function submitPhone() {
    setPhoneError(null);
    try {
      const result = await requestOtp(phone);
      // Dev mode: prefill the code the server returned so the user can log in
      // straight away without a real SMS. Empty in production.
      setDevCode(result.devCode ?? null);
      setCode(result.devCode ?? '');
      setCodeError(null);
      setSecondsLeft(CODE_TTL_SEC);
      setPane('code');
    } catch (error) {
      setPhoneError(errorMessage(error, "Kodni yuborib bo'lmadi. Qaytadan urinib ko'ring."));
    }
  }

  async function resend() {
    setCodeError(null);
    try {
      const result = await requestOtp(phone);
      setDevCode(result.devCode ?? null);
      setCode(result.devCode ?? '');
      setSecondsLeft(CODE_TTL_SEC);
    } catch (error) {
      setCodeError(errorMessage(error, "Kodni yuborib bo'lmadi. Qaytadan urinib ko'ring."));
    }
  }

  async function submitCode() {
    setCodeError(null);
    try {
      await verifyOtp(phone, code);
      onClose();
    } catch (error) {
      setCodeError(errorMessage(error, "Kod noto'g'ri. Qaytadan urinib ko'ring."));
    }
  }

  return (
    // The backdrop is the click target for "close"; the panel stops that click
    // from bubbling so tapping inside the card never dismisses it.
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[400px] rounded-[18px] bg-card p-6 shadow-card"
      >
        <div className="flex items-start justify-between">
          <h2 id="login-modal-title" className="text-[19px] font-extrabold tracking-tight">
            {pane === 'phone' ? 'Kirish' : 'Kodni tasdiqlang'}
          </h2>
          <button
            type="button"
            aria-label="Yopish"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-3 hover:bg-surface"
          >
            <Icon name="close" className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        {pane === 'phone' ? (
          <div className="mt-5">
            <label className="mb-2 block text-[13px] font-bold text-ink-2" htmlFor="login-phone">
              Telefon raqami
            </label>
            <div className="flex items-center gap-2 rounded-[14px] border border-line bg-surface px-3.5 py-3">
              <span className="text-[15px] font-bold text-ink-2">+998</span>
              <input
                id="login-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="90 123 45 67"
                value={digits}
                onChange={(e) =>
                  setDigits(e.target.value.replace(/\D/g, '').slice(0, PHONE_DIGITS))
                }
                className="w-full bg-transparent text-[15px] font-semibold tracking-wide outline-none placeholder:text-ink-3"
              />
            </div>
            {phoneError && (
              <p className="mt-2 text-[13px] font-semibold text-brand-rose">{phoneError}</p>
            )}

            <button
              type="button"
              disabled={digits.length !== PHONE_DIGITS || isRequestingOtp}
              onClick={submitPhone}
              className="mt-4 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRequestingOtp ? 'Yuborilmoqda...' : 'Kodni olish'}
            </button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="text-xs font-semibold text-ink-3">yoki</span>
              <span className="h-px flex-1 bg-line" />
            </div>

            <TelegramLoginButton />

            <p className="mt-4 text-center text-[12px] leading-relaxed text-ink-3">
              Davom etish orqali{' '}
              <Link to="/offer" onClick={onClose} className="font-bold text-accent">
                ommaviy oferta
              </Link>{' '}
              shartlariga rozilik bildirasiz
            </p>
          </div>
        ) : (
          <div className="mt-5">
            <p className="text-[13.5px] text-ink-2">
              <span className="font-bold text-ink">+{phone}</span> raqamiga yuborilgan 6 xonali
              kodni kiriting
            </p>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              value={code}
              onChange={(e) => {
                setCodeError(null);
                resetVerifyError();
                setCode(e.target.value.replace(/\D/g, '').slice(0, CODE_DIGITS));
              }}
              className={cn(
                'mt-3 w-full rounded-[14px] border bg-surface px-3.5 py-3 text-center text-[22px] font-extrabold tracking-[0.5em] outline-none',
                codeError ? 'border-brand-rose' : 'border-line',
              )}
            />
            {codeError && (
              <p className="mt-2 text-[13px] font-semibold text-brand-rose">{codeError}</p>
            )}

            {devCode && !codeError && (
              <p className="mt-2 text-[12.5px] font-semibold text-brand-green">
                Dev rejim — kod avtomatik kiritildi ({devCode}). "Tasdiqlash" tugmasini bosing.
              </p>
            )}

            <button
              type="button"
              disabled={code.length !== CODE_DIGITS || isVerifyingOtp}
              onClick={submitCode}
              className="mt-4 w-full rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isVerifyingOtp ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
            </button>

            <div className="mt-4 text-center text-[13px] font-semibold">
              {secondsLeft > 0 ? (
                <span className="text-ink-3">Qayta yuborish {formatCountdown(secondsLeft)}</span>
              ) : (
                <button
                  type="button"
                  onClick={resend}
                  disabled={isRequestingOtp}
                  className="text-accent"
                >
                  Qayta yuborish
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

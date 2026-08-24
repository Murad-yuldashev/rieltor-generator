interface Props {
  /** Omitted on the first step — there is nowhere to go back to inside the wizard. */
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  nextDisabled?: boolean;
  isBusy?: boolean;
}

/** Back/continue footer shared by every step — kept in one place so the five-button feel stays identical across steps. */
export function WizardNav({ onBack, onNext, nextLabel, nextDisabled, isBusy }: Props) {
  return (
    <div className="mt-6 flex items-center gap-3 border-t border-line pt-5">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          disabled={isBusy}
          className="rounded-[14px] border border-line px-5 py-3 text-[14.5px] font-bold text-ink-2 transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          Orqaga
        </button>
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled || isBusy}
        className="ml-auto rounded-[14px] bg-linear-to-br from-violet-600 to-accent-dark px-6 py-3 text-[14.5px] font-extrabold text-white shadow-lg shadow-accent/35 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isBusy ? 'Saqlanmoqda...' : nextLabel}
      </button>
    </div>
  );
}

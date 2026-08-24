import type { ComponentType } from 'react';
import { Link } from 'react-router';
import { useSession } from '@/entities/session';
import { Icon } from '@/shared/ui/icon';
import { useListingDraft, type ListingDraftState } from '../model/use-listing-draft';
import { AuthPrompt } from './auth-prompt';
import { ContactsStep } from './steps/contacts-step';
import { DealStep } from './steps/deal-step';
import { LocationStep } from './steps/location-step';
import { ParamsStep } from './steps/params-step';
import { PhotosStep } from './steps/photos-step';
import { PriceStep } from './steps/price-step';
import { WizardRail } from './wizard-rail';

const STEPS: ComponentType<{ draft: ListingDraftState }>[] = [
  DealStep,
  LocationStep,
  ParamsStep,
  PhotosStep,
  PriceStep,
  ContactsStep,
];

function CenteredNote({ text }: { text: string }) {
  return (
    <div className="flex min-h-[70dvh] items-center justify-center text-[14px] text-ink-2">
      {text}
    </div>
  );
}

/**
 * Slim top bar — the wizard has its own chrome (no SiteHeader/BottomNav, see
 * router.tsx), but a bare page with no branding at all reads as broken, so a
 * minimal logo + close link takes their place.
 */
function TopBar() {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto flex max-w-desk items-center justify-between px-4 py-3.5 desk:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-linear-to-br from-violet-600 to-accent-dark text-white">
            <Icon name="homeSolid" className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <span className="text-[15px] font-extrabold tracking-tight">
            Rieltor<span className="text-accent">App</span>
          </span>
        </Link>
        <Link
          to="/"
          aria-label="Yopish"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-3 hover:bg-surface"
        >
          <Icon name="close" className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      </div>
    </header>
  );
}

function WizardShell() {
  const draft = useListingDraft();

  if (draft.isCreating) return <CenteredNote text="Yuklanmoqda..." />;
  if (draft.createError) {
    return (
      <div className="flex min-h-[70dvh] flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="text-[14.5px] font-semibold text-brand-rose">{draft.createError}</p>
      </div>
    );
  }

  const Step = STEPS[draft.step] ?? DealStep;

  return (
    <div className="mx-auto max-w-desk px-4 py-6 desk:px-8 desk:py-10">
      <div className="flex flex-col gap-6 desk:grid desk:grid-cols-[280px_1fr] desk:items-start desk:gap-12">
        <WizardRail step={draft.step} />
        <div className="rounded-card border border-line/60 bg-card p-4 shadow-card desk:p-7">
          <Step draft={draft} />
        </div>
      </div>
    </div>
  );
}

/**
 * `/my/listings/new` — the six-step listing creation wizard. Lives outside
 * TabLayout: this page owns its own chrome, same reasoning as the listing page.
 */
export function ListingCreatePage() {
  const { isAuthenticated, isPending } = useSession();

  return (
    <div className="min-h-dvh bg-surface">
      <TopBar />
      {isPending ? (
        <CenteredNote text="Yuklanmoqda..." />
      ) : isAuthenticated ? (
        <WizardShell />
      ) : (
        <AuthPrompt />
      )}
    </div>
  );
}

import { closeLoginModal, useLoginModalOpen } from '@/entities/session';
import { LoginModal } from './login-modal';

/**
 * The single app-wide login modal, mounted once at the app root so any layer can
 * open it with `openLoginModal()` (from `@/entities/session`) — including pages
 * that live outside the site header, like the public valuation flow.
 */
export function AuthModalHost() {
  const open = useLoginModalOpen();
  return <LoginModal open={open} onClose={closeLoginModal} />;
}

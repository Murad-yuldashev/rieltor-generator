import { closeLoginModal, useLoginModalOpen } from '@/entities/session';
import { LoginModal } from './login-modal';

/**
 * The single app-wide login modal, mounted once at the app root so any layer can
 * open it with `openLoginModal()` (from `@/entities/session`) — including the
 * guarded shell that prompts an anonymous visitor to sign in.
 */
export function AuthModalHost() {
  const open = useLoginModalOpen();
  return <LoginModal open={open} onClose={closeLoginModal} />;
}

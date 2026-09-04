import { Module } from '@nestjs/common';
import { OrgWalletService } from './org-wallet.service';

// Provides ONLY OrgWalletService (needs just PrismaModule, which is @Global). The
// OrgWalletController lives in DeveloperModule instead — that keeps the dependency
// one-way (DeveloperModule → OrgWalletModule) so BookingService can debit the org
// wallet without a module cycle. No AuthModule/DeveloperModule import here: those
// were only for the controller, which has moved.
@Module({
  providers: [OrgWalletService],
  exports: [OrgWalletService],
})
export class OrgWalletModule {}

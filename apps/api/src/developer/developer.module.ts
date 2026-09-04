import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OrgWalletModule } from '../org-wallet/org-wallet.module';
import { OrgWalletController } from '../org-wallet/org-wallet.controller';
import { BookingController } from './booking.controller';
import { BookingExpiryCron } from './booking-expiry.cron';
import { BookingService } from './booking.service';
import { ComplexImageController } from './complex-image.controller';
import { DeveloperController } from './developer.controller';
import { DeveloperGuard } from './developer.guard';
import { DeveloperService } from './developer.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  // WalletModule → WalletService (realtor commission credit at convert).
  // OrgWalletModule → OrgWalletService (org-wallet debit at convert + the CRM
  // /api/crm/wallet controller, which lives here to keep the dependency one-way).
  imports: [AuthModule, WalletModule, OrgWalletModule],
  controllers: [
    DeveloperController,
    BookingController,
    ComplexImageController,
    OrgWalletController,
  ],
  providers: [DeveloperService, DeveloperGuard, BookingService, BookingExpiryCron],
  exports: [DeveloperGuard, DeveloperService],
})
export class DeveloperModule {}

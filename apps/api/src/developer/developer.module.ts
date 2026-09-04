import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingController } from './booking.controller';
import { BookingExpiryCron } from './booking-expiry.cron';
import { BookingService } from './booking.service';
import { ComplexImageController } from './complex-image.controller';
import { DeveloperController } from './developer.controller';
import { DeveloperGuard } from './developer.guard';
import { DeveloperService } from './developer.service';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [AuthModule, WalletModule], // JwtGuard/JwtService; WalletModule exports WalletService (commission credit at convert)
  controllers: [DeveloperController, BookingController, ComplexImageController],
  providers: [DeveloperService, DeveloperGuard, BookingService, BookingExpiryCron],
  exports: [DeveloperGuard, DeveloperService], // DeveloperService: OrgWalletModule's controller resolves the caller's org
})
export class DeveloperModule {}

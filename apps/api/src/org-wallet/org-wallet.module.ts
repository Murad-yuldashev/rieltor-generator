import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeveloperModule } from '../developer/developer.module';
import { OrgWalletController } from './org-wallet.controller';
import { OrgWalletService } from './org-wallet.service';

// AuthModule provides JwtGuard/JwtService for @UseGuards(JwtGuard). DeveloperModule
// exports DeveloperGuard + DeveloperService (org resolution). PrismaModule is @Global.
// OrgWalletService is exported so Task 4's BookingService can debit the commission.
@Module({
  imports: [AuthModule, DeveloperModule],
  controllers: [OrgWalletController],
  providers: [OrgWalletService],
  exports: [OrgWalletService],
})
export class OrgWalletModule {}

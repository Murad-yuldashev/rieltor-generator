import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { ConversionController } from './conversion.controller';
import { FixationService } from './fixation.service';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

// AgentModule exports RealtorGuard (with its SubscriptionService); AuthModule
// provides JwtGuard/JwtService for @UseGuards(JwtGuard). PrismaModule is @Global.
// WalletModule exports WalletService so the claim can debit the lead price.
@Module({
  imports: [AgentModule, AuthModule, WalletModule],
  controllers: [LeadsController, ConversionController],
  providers: [LeadsService, FixationService],
})
export class LeadsModule {}

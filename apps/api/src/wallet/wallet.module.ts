import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { AuthModule } from '../auth/auth.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

// AgentModule exports RealtorGuard (with its SubscriptionService); AuthModule
// provides JwtGuard/JwtService for @UseGuards(JwtGuard). PrismaModule is @Global.
// WalletService is exported so Task 4's LeadsModule can inject it into the claim.
@Module({
  imports: [AgentModule, AuthModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}

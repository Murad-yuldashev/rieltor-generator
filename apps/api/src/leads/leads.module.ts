import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { WalletModule } from '../wallet/wallet.module';
import { ConversionController } from './conversion.controller';
import { FixationService } from './fixation.service';
import { LeadAssistService } from './lead-assist.service';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

// AgentModule exports RealtorGuard (with its SubscriptionService); AuthModule
// provides JwtGuard/JwtService for @UseGuards(JwtGuard). PrismaModule is @Global.
// WalletModule exports WalletService so the claim can debit the lead price.
// AiModule exports GeminiService for the (hybrid) lead assistant.
@Module({
  imports: [AgentModule, AuthModule, WalletModule, AiModule],
  controllers: [LeadsController, ConversionController],
  providers: [LeadsService, FixationService, LeadAssistService],
})
export class LeadsModule {}

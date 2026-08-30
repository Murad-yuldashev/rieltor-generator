import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { AuthModule } from '../auth/auth.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

// AgentModule exports RealtorGuard (with its SubscriptionService); AuthModule
// provides JwtGuard/JwtService for @UseGuards(JwtGuard). PrismaModule is @Global.
@Module({
  imports: [AgentModule, AuthModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}

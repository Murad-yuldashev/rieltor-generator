import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AgentController } from './agent.controller';
import { ProfileService } from './profile.service';
import { RealtorGuard } from './realtor.guard';
import { SubscriptionService } from './subscription.service';

// PrismaModule is @Global, so it need not be imported here; AuthModule is
// imported for the JwtGuard used on every route.
@Module({
  imports: [AuthModule],
  controllers: [AgentController],
  providers: [SubscriptionService, ProfileService, RealtorGuard],
  exports: [SubscriptionService, RealtorGuard],
})
export class AgentModule {}

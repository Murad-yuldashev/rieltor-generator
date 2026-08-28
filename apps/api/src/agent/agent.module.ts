import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PresentationsModule } from '../presentations/presentations.module';
import { AgentController } from './agent.controller';
import { CollectionsService } from './collections.service';
import { NotesService } from './notes.service';
import { ProfileLogoController } from './profile-logo.controller';
import { ProfileService } from './profile.service';
import { RealtorGuard } from './realtor.guard';
import { SubscriptionService } from './subscription.service';

// PrismaModule is @Global, so it need not be imported here; AuthModule is
// imported for the JwtGuard used on every route; PresentationsModule provides
// the PresentationsService the realtor-facing presentation routes call.
@Module({
  imports: [AuthModule, PresentationsModule],
  controllers: [AgentController, ProfileLogoController],
  providers: [SubscriptionService, ProfileService, RealtorGuard, NotesService, CollectionsService],
  exports: [SubscriptionService, RealtorGuard],
})
export class AgentModule {}

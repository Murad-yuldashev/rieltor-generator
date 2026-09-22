import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { RealtorPublicController } from './realtor-public.controller';
import { RealtorPublicService } from './realtor-public.service';

// PrismaModule is @Global, so it needs no importing here. The public controller
// (GET /api/r/:slug) is unguarded and slug-gated. RealtorPublicService is exported
// so the SSR filter (Task 7) can inject it to build og-meta for the microsite.
// ReviewsModule is imported for ReviewsService (the authenticated write/read routes);
// AuthModule supplies JwtService/JwtGuard for those two method-level @UseGuards(JwtGuard).
// AgentModule exports SubscriptionService, which getBySlug uses to gate the site
// payload (no cycle — AgentModule does not depend on this module). NotificationsModule
// exports NotificationsService, which createInquiry uses to notify the realtor of a new
// lead. All join the module graph transitively, so app.module.ts needs no separate entry.
@Module({
  imports: [AuthModule, ReviewsModule, AgentModule, NotificationsModule],
  controllers: [RealtorPublicController],
  providers: [RealtorPublicService],
  exports: [RealtorPublicService],
})
export class RealtorPublicModule {}

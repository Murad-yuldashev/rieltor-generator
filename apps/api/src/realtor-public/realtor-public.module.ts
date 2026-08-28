import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { RealtorPublicController } from './realtor-public.controller';
import { RealtorPublicService } from './realtor-public.service';

// PrismaModule is @Global, so it needs no importing here. The public controller
// (GET /api/r/:slug) is unguarded and slug-gated. RealtorPublicService is exported
// so the SSR filter (Task 7) can inject it to build og-meta for the microsite.
// ReviewsModule is imported for ReviewsService (the authenticated write/read routes);
// AuthModule supplies JwtService/JwtGuard for those two method-level @UseGuards(JwtGuard).
// Both join the module graph transitively, so app.module.ts needs no separate entry.
@Module({
  imports: [AuthModule, ReviewsModule],
  controllers: [RealtorPublicController],
  providers: [RealtorPublicService],
  exports: [RealtorPublicService],
})
export class RealtorPublicModule {}

import { Module } from '@nestjs/common';
import { RealtorPublicController } from './realtor-public.controller';
import { RealtorPublicService } from './realtor-public.service';

// PrismaModule is @Global, so it needs no importing here. The public controller
// (GET /api/r/:slug) is unguarded and slug-gated. RealtorPublicService is exported
// so the SSR filter (Task 7) can inject it to build og-meta for the microsite.
@Module({
  controllers: [RealtorPublicController],
  providers: [RealtorPublicService],
  exports: [RealtorPublicService],
})
export class RealtorPublicModule {}

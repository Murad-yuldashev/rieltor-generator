import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

// PrismaModule is @Global, so it needs no importing here. ReviewsService is exported
// so RealtorPublicModule (the write/read routes) and the moderator module can inject it.
@Module({
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}

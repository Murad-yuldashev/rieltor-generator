import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContactController } from './contact.controller';
import { ListingDraftController } from './listing-draft.controller';
import { ListingImageController } from './listing-image.controller';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ModerationController } from './moderation.controller';
import { RealtorModerationController } from './realtor-moderation.controller';
import { RealtorModerationService } from './realtor-moderation.service';
import { ReviewModerationController } from './review-moderation.controller';
import { ReviewModerationService } from './review-moderation.service';

@Module({
  imports: [AuthModule],
  controllers: [
    ListingsController,
    ContactController,
    ListingDraftController,
    ListingImageController,
    ModerationController,
    RealtorModerationController,
    ReviewModerationController,
  ],
  providers: [ListingsService, RealtorModerationService, ReviewModerationService],
  exports: [ListingsService],
})
export class ListingsModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ContactController } from './contact.controller';
import { ListingDraftController } from './listing-draft.controller';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { ModerationController } from './moderation.controller';

@Module({
  imports: [AuthModule],
  controllers: [
    ListingsController,
    ContactController,
    ListingDraftController,
    ModerationController,
  ],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}

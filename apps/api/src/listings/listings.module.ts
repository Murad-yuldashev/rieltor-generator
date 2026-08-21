import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ListingDraftController } from './listing-draft.controller';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

@Module({
  imports: [AuthModule],
  controllers: [ListingsController, ListingDraftController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}

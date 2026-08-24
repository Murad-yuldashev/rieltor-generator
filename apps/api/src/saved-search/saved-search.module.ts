import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SavedSearchController } from './saved-search.controller';
import { SavedSearchService } from './saved-search.service';

@Module({
  imports: [AuthModule],
  controllers: [SavedSearchController],
  providers: [SavedSearchService],
})
export class SavedSearchModule {}

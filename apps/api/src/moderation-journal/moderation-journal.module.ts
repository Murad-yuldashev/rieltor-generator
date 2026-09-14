import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ModerationJournalController } from './moderation-journal.controller';
import { ModerationJournalService } from './moderation-journal.service';

@Module({
  imports: [AuthModule],
  controllers: [ModerationJournalController],
  providers: [ModerationJournalService],
})
export class ModerationJournalModule {}

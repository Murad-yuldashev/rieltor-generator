import { Module } from '@nestjs/common';
import { JournalPublicController } from './journal-public.controller';
import { JournalPublicService } from './journal-public.service';

@Module({
  controllers: [JournalPublicController],
  providers: [JournalPublicService],
  exports: [JournalPublicService],
})
export class JournalPublicModule {}

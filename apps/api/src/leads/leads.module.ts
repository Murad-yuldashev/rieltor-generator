import { Module } from '@nestjs/common';
import { BotModule } from '../bot/bot.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { MyLeadsController } from './my-leads.controller';

@Module({
  imports: [BotModule],
  controllers: [LeadsController, MyLeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}

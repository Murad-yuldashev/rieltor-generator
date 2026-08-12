import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { EventController } from './event.controller';
import { StatsController } from './stats.controller';

@Module({
  controllers: [EventController, StatsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

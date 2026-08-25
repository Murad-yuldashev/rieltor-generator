import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PropertiesService } from './properties.service';

@Injectable()
export class MonthlyValuationCron {
  constructor(private readonly properties: PropertiesService) {}

  // 03:00 on the 1st of every month. Single-instance deploy — see spec §6 for the scale caveat.
  @Cron('0 3 1 * *')
  run() {
    return this.properties.runMonthlyValuation();
  }
}

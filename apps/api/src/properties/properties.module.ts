import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ValuationModule } from '../valuation/valuation.module';
import { MonthlyValuationCron } from './monthly-valuation.cron';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [AuthModule, ValuationModule],
  controllers: [PropertiesController],
  providers: [PropertiesService, MonthlyValuationCron],
})
export class PropertiesModule {}

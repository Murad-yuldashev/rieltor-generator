import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ValuationModule } from '../valuation/valuation.module';
import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [AuthModule, ValuationModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}

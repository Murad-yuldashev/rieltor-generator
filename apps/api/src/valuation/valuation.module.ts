import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ValuationController } from './valuation.controller';
import { ValuationService } from './valuation.service';

@Module({
  imports: [AiModule, PrismaModule],
  controllers: [ValuationController],
  providers: [ValuationService],
})
export class ValuationModule {}

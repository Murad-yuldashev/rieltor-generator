import { Module } from '@nestjs/common';
import { BotModule } from '../bot/bot.module';
import { CronGuard } from './cron.guard';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';

// PrismaService and ConfigService are available without an explicit import —
// PrismaModule is @Global() and ConfigModule.forRoot() runs with isGlobal: true.
@Module({
  imports: [BotModule],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, CronGuard],
})
export class MaintenanceModule {}

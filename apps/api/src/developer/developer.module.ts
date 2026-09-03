import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingController } from './booking.controller';
import { BookingExpiryCron } from './booking-expiry.cron';
import { BookingService } from './booking.service';
import { DeveloperController } from './developer.controller';
import { DeveloperGuard } from './developer.guard';
import { DeveloperService } from './developer.service';

@Module({
  imports: [AuthModule], // JwtGuard/JwtService
  controllers: [DeveloperController, BookingController],
  providers: [DeveloperService, DeveloperGuard, BookingService, BookingExpiryCron],
  exports: [DeveloperGuard],
})
export class DeveloperModule {}

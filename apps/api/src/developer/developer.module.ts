import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DeveloperController } from './developer.controller';
import { DeveloperGuard } from './developer.guard';
import { DeveloperService } from './developer.service';

@Module({
  imports: [AuthModule], // JwtGuard/JwtService
  controllers: [DeveloperController],
  providers: [DeveloperService, DeveloperGuard],
  exports: [DeveloperGuard],
})
export class DeveloperModule {}

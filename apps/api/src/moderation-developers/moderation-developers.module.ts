import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ModerationDevelopersController } from './moderation-developers.controller';
import { ModerationDevelopersService } from './moderation-developers.service';

@Module({
  imports: [AuthModule],
  controllers: [ModerationDevelopersController],
  providers: [ModerationDevelopersService],
})
export class ModerationDevelopersModule {}

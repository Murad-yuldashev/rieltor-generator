import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthDevController } from './auth-dev.controller';

@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [AuthDevController],
})
export class AuthDevModule {}

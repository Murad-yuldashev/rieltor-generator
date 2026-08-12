import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtorsController } from './realtors.controller';
import { RealtorsPublicController } from './realtors-public.controller';
import { RealtorsService } from './realtors.service';

@Module({
  imports: [PrismaModule],
  controllers: [RealtorsController, RealtorsPublicController],
  providers: [RealtorsService],
  exports: [RealtorsService],
})
export class RealtorsModule {}

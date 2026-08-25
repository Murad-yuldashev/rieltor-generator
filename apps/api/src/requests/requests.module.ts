import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MyRequestsController } from './my-requests.controller';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';

@Module({
  imports: [AuthModule],
  controllers: [RequestsController, MyRequestsController],
  providers: [RequestsService],
})
export class RequestsModule {}

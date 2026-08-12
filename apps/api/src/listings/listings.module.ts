import { Module } from '@nestjs/common';
import { RealtorsModule } from '../realtors/realtors.module';
import { ListingsController } from './listings.controller';
import { ListingsWriteController } from './listings-write.controller';
import { ListingsService } from './listings.service';
import { ListingsWriteService } from './listings-write.service';
import { MyListingsController } from './my-listings.controller';

@Module({
  imports: [RealtorsModule],
  controllers: [ListingsController, ListingsWriteController, MyListingsController],
  providers: [ListingsService, ListingsWriteService],
  exports: [ListingsService],
})
export class ListingsModule {}

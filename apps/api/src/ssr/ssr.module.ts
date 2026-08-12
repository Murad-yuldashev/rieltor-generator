import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ListingsModule } from '../listings/listings.module';
import { RealtorsModule } from '../realtors/realtors.module';
import { HtmlCacheService } from './html-cache.service';
import { NotFoundShellFilter } from './not-found-shell.filter';
import { RealtorSsrController } from './realtor-ssr.controller';
import { SsrController } from './ssr.controller';

@Module({
  imports: [ListingsModule, RealtorsModule],
  controllers: [SsrController, RealtorSsrController],
  providers: [HtmlCacheService, { provide: APP_FILTER, useClass: NotFoundShellFilter }],
})
export class SsrModule {}

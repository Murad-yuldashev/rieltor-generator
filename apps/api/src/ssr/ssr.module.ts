import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ListingsModule } from '../listings/listings.module';
import { HtmlCacheService } from './html-cache.service';
import { NotFoundShellFilter } from './not-found-shell.filter';
import { SsrController } from './ssr.controller';

@Module({
  imports: [ListingsModule],
  controllers: [SsrController],
  providers: [HtmlCacheService, { provide: APP_FILTER, useClass: NotFoundShellFilter }],
})
export class SsrModule {}

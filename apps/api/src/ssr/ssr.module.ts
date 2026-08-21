import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ZodExceptionFilter } from '../common/zod-exception.filter';
import { ListingsModule } from '../listings/listings.module';
import { HtmlCacheService } from './html-cache.service';
import { NotFoundShellFilter } from './not-found-shell.filter';
import { SsrController } from './ssr.controller';

@Module({
  imports: [ListingsModule],
  controllers: [SsrController],
  providers: [
    HtmlCacheService,
    { provide: APP_FILTER, useClass: NotFoundShellFilter },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
  ],
})
export class SsrModule {}

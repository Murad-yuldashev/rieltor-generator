import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ZodExceptionFilter } from '../common/zod-exception.filter';
import { ComplexesPublicModule } from '../complexes-public/complexes-public.module';
import { ListingsModule } from '../listings/listings.module';
import { PresentationsModule } from '../presentations/presentations.module';
import { RealtorPublicModule } from '../realtor-public/realtor-public.module';
import { HtmlCacheService } from './html-cache.service';
import { NotFoundShellFilter } from './not-found-shell.filter';
import { SsrController } from './ssr.controller';

@Module({
  imports: [ListingsModule, PresentationsModule, RealtorPublicModule, ComplexesPublicModule],
  controllers: [SsrController],
  providers: [
    HtmlCacheService,
    { provide: APP_FILTER, useClass: NotFoundShellFilter },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
  ],
})
export class SsrModule {}

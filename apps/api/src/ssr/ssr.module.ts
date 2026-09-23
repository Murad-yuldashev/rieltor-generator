import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ZodExceptionFilter } from '../common/zod-exception.filter';
import { ComplexesPublicModule } from '../complexes-public/complexes-public.module';
import { JournalPublicModule } from '../journal-public/journal-public.module';
import { ListingsModule } from '../listings/listings.module';
import { PresentationsModule } from '../presentations/presentations.module';
import { RealtorPublicModule } from '../realtor-public/realtor-public.module';
import { HtmlCacheService } from './html-cache.service';
import { NotFoundShellFilter } from './not-found-shell.filter';
import { RealtorHostMiddleware, RealtorHostResolver } from './realtor-host.middleware';
import { SsrController } from './ssr.controller';

@Module({
  imports: [
    ListingsModule,
    PresentationsModule,
    RealtorPublicModule,
    ComplexesPublicModule,
    JournalPublicModule,
  ],
  controllers: [SsrController],
  providers: [
    HtmlCacheService,
    RealtorHostResolver,
    RealtorHostMiddleware,
    { provide: APP_FILTER, useClass: NotFoundShellFilter },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
  ],
})
export class SsrModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RealtorHostMiddleware).forRoutes('*');
  }
}

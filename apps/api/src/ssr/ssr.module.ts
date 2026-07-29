import { Module } from '@nestjs/common';
import { ObjectsModule } from '../objects/objects.module';
import { HtmlCacheService } from './html-cache.service';
import { SsrController } from './ssr.controller';

@Module({
  imports: [ObjectsModule],
  controllers: [SsrController],
  providers: [HtmlCacheService],
})
export class SsrModule {}

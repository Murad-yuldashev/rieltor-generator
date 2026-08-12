import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env';
import { createMediaStorage, MEDIA_STORAGE } from './media-storage';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

/**
 * Registers unconditionally, unlike AuthDevModule — LocalDiskStorage needs no env
 * config at all, so there is nothing to gate on (task's storage decision overrides
 * spec §6.5's "module disables itself without R2_*"). PrismaService is available
 * without an explicit import because PrismaModule is @Global().
 */
@Module({
  controllers: [MediaController],
  providers: [
    MediaService,
    {
      provide: MEDIA_STORAGE,
      useFactory: (config: ConfigService<Env, true>) => createMediaStorage(config),
      inject: [ConfigService],
    },
  ],
})
export class MediaModule {}

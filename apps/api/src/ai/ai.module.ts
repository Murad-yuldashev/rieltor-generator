import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiSearchController } from './ai-search.controller';
import { GeminiService } from './gemini.service';

@Module({
  imports: [AuthModule],
  controllers: [AiController, AiSearchController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}

import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { AuthModule } from '../auth/auth.module';
import { AiController } from './ai.controller';
import { AiContentController } from './ai-content.controller';
import { AiSearchController } from './ai-search.controller';
import { GeminiService } from './gemini.service';

@Module({
  imports: [AuthModule, AgentModule],
  controllers: [AiController, AiSearchController, AiContentController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class AiModule {}

import { Module } from '@nestjs/common';
import { AgentModule } from '../agent/agent.module';
import { AiModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';
import { RealtorContentController } from './realtor-content.controller';
import { RealtorContentService } from './realtor-content.service';

// AuthModule is REQUIRED — @UseGuards(JwtGuard) makes Nest instantiate JwtGuard in THIS
// module's context, and its JwtService dep is surfaced only by AuthModule (module imports
// are not transitive, so AgentModule/AiModule importing AuthModule does not help here).
// Omitting it is a runtime bootstrap crash ("can't resolve JwtGuard dependencies") that
// typecheck/build do NOT catch. AgentModule exports RealtorGuard; AiModule exports
// GeminiService (Task 3). PrismaModule/ConfigModule are @Global. No cycle: none import this.
@Module({
  imports: [AuthModule, AgentModule, AiModule],
  controllers: [RealtorContentController],
  providers: [RealtorContentService],
})
export class RealtorContentModule {}

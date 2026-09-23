import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { RealtorGuard } from '../agent/realtor.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { RealtorContentService } from './realtor-content.service';

// Global prefix ('api') → /api/agent/content/*. Distinct subpath from AgentController('agent').
// Realtor-gated (paid marketing tool), mirroring AiContentController.
@ApiExcludeController()
@Controller('agent/content')
@UseGuards(JwtGuard, RealtorGuard)
export class RealtorContentController {
  constructor(private readonly content: RealtorContentService) {}

  @Get('listings')
  listings(@CurrentUser() user: { id: string; role: string }) {
    return this.content.ownListings(user.id);
  }
}

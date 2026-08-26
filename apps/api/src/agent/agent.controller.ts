import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { RealtorProfileUpdateSchema } from '@rieltor/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtGuard } from '../auth/jwt.guard';
import { ProfileService } from './profile.service';
import { RealtorGuard } from './realtor.guard';
import { SubscriptionService } from './subscription.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/agent/*.
@Controller('agent')
@UseGuards(JwtGuard)
export class AgentController {
  constructor(
    private readonly subscriptions: SubscriptionService,
    private readonly profiles: ProfileService,
  ) {}

  // become-realtor + subscription routes are JwtGuard-only: right after the
  // upgrade the caller's JWT still says USER, so gating on JWT role would lock
  // them out. RealtorGuard (below) reads role fresh from the DB instead.
  @Post('become-realtor')
  becomeRealtor(@CurrentUser() user: { id: string; role: string }) {
    return this.subscriptions.becomeRealtor(user.id);
  }

  @Get('subscription')
  subscription(@CurrentUser() user: { id: string; role: string }) {
    return this.subscriptions.view(user.id);
  }

  @Post('subscription/activate')
  activate(@CurrentUser() user: { id: string; role: string }) {
    return this.subscriptions.activate(user.id);
  }

  @Get('profile')
  @UseGuards(RealtorGuard)
  getProfile(@CurrentUser() user: { id: string; role: string }) {
    return this.profiles.get(user.id);
  }

  @Patch('profile')
  @UseGuards(RealtorGuard)
  updateProfile(@CurrentUser() user: { id: string; role: string }, @Body() body: unknown) {
    return this.profiles.update(user.id, RealtorProfileUpdateSchema.parse(body));
  }
}

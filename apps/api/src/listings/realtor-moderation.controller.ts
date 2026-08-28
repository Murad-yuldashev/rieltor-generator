import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import type { ModeratorRealtorRow } from '@rieltor/shared';
import { RealtorVerifySchema } from '@rieltor/shared';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { RealtorModerationService } from './realtor-moderation.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/moderation/realtors.
@Controller('moderation/realtors')
@UseGuards(JwtGuard, RolesGuard)
@Roles('MODERATOR', 'ADMIN')
export class RealtorModerationController {
  constructor(private readonly realtors: RealtorModerationService) {}

  @Get()
  list(): Promise<ModeratorRealtorRow[]> {
    return this.realtors.list();
  }

  @Patch(':userId')
  verify(@Param('userId') userId: string, @Body() body: unknown): Promise<ModeratorRealtorRow> {
    const { verified } = RealtorVerifySchema.parse(body);
    return this.realtors.setVerified(userId, verified);
  }
}

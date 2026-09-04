import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import type { ModeratorDeveloperRow } from '@rieltor/shared';
import { DeveloperVerifySchema } from '@rieltor/shared';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { ModerationDevelopersService } from './moderation-developers.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/moderation/developers.
@Controller('moderation/developers')
@UseGuards(JwtGuard, RolesGuard)
@Roles('MODERATOR', 'ADMIN')
export class ModerationDevelopersController {
  constructor(private readonly developers: ModerationDevelopersService) {}

  @Get()
  list(): Promise<ModeratorDeveloperRow[]> {
    return this.developers.list();
  }

  @Patch(':orgId')
  setVerified(
    @Param('orgId') orgId: string,
    @Body() body: unknown,
  ): Promise<ModeratorDeveloperRow> {
    const { verified, note } = DeveloperVerifySchema.parse(body);
    return this.developers.setVerified(orgId, verified, note);
  }
}

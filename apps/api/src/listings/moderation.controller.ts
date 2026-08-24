import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ModerationRejectSchema } from '@rieltor/shared';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { ListingsService } from './listings.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/moderation/listings.
@Controller('moderation/listings')
@UseGuards(JwtGuard, RolesGuard)
@Roles('MODERATOR', 'ADMIN')
export class ModerationController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  queue() {
    return this.listings.listForModeration();
  }

  @Post(':id/approve')
  approve(@Param('id') id: string) {
    return this.listings.approve(id);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() body: unknown) {
    const { reason } = ModerationRejectSchema.parse(body);
    return this.listings.reject(id, reason);
  }
}

import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import type { ModeratorReviewRow } from '@rieltor/shared';
import { ReviewModerateSchema } from '@rieltor/shared';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { JwtGuard } from '../auth/jwt.guard';
import { ReviewModerationService } from './review-moderation.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/moderation/reviews.
@Controller('moderation/reviews')
@UseGuards(JwtGuard, RolesGuard)
@Roles('MODERATOR', 'ADMIN')
export class ReviewModerationController {
  constructor(private readonly reviews: ReviewModerationService) {}

  @Get()
  list(): Promise<ModeratorReviewRow[]> {
    return this.reviews.listPending();
  }

  @Patch(':id')
  moderate(
    @Param('id') id: string,
    @Body() body: unknown,
  ): Promise<{ id: string; status: string }> {
    const { status } = ReviewModerateSchema.parse(body);
    return this.reviews.moderate(id, status);
  }
}

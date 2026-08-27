import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PresentationViewEventSchema } from '@rieltor/shared';
import { PresentationsService } from './presentations.service';

// Global prefix ('api', see bootstrap.ts) makes the real URLs /api/p/:token and
// /api/p/:token/view. PUBLIC and token-gated: no JwtGuard/RealtorGuard — a client
// (not a platform user) with the link must be able to view the presentation and
// the analytics beacon must work even if the realtor's subscription has lapsed.
// Excluded from the OpenAPI doc, like the other public/SSR surfaces.
@ApiExcludeController()
@Controller('p')
export class PublicPresentationController {
  constructor(private readonly presentations: PresentationsService) {}

  @Get(':token')
  get(@Param('token') token: string) {
    return this.presentations.publicGet(token);
  }

  @Post(':token/view')
  @HttpCode(204)
  async view(@Param('token') token: string, @Body() body: unknown): Promise<void> {
    await this.presentations.recordView(token, PresentationViewEventSchema.parse(body));
  }
}

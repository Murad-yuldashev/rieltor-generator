import { Controller, Get, Param } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { RealtorPublicService } from './realtor-public.service';

// Global prefix ('api', see bootstrap.ts) makes the real URL /api/r/:slug. PUBLIC
// and slug-gated: no JwtGuard/RealtorGuard — anyone with the link must be able to
// view a realtor's microsite even if the realtor's subscription has lapsed.
// Excluded from the OpenAPI doc, like the other public/SSR surfaces.
@ApiExcludeController()
@Controller('r')
export class RealtorPublicController {
  constructor(private readonly realtors: RealtorPublicService) {}

  @Get(':slug')
  get(@Param('slug') slug: string) {
    return this.realtors.getBySlug(slug);
  }
}
